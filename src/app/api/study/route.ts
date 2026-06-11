export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences, userLevelConfig, categories, users } from "@/db/schema"
import { eq, or, sql } from "drizzle-orm"

export type Exercise = {
  id: number
  exerciseType: "type_in" | "multiple_choice"
  /** The question prompt shown to the user (English for Slavic learners; Slavic for English learners) */
  prompt: string
  correctAnswer: string
  alternateAnswer?: string  // opposite-gender form, shown in feedback and accepted as correct on type-in
  options?: string[]
  categoryName?: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type DistractorItem = {
  id: number
  categoryId: number | null
  english: string
  serbian: string
  croatian: string
  serbianFemale?: string | null
  croatianFemale?: string | null
}

/**
 * Pick `count` distractor answers that are as confusable as possible with the
 * correct answer, using different strategies for words vs sentences.
 *
 * Words  — category is the primary signal (semantically confusable vocab),
 *          text length within ±50 % as a tiebreaker.
 * Sentences — length similarity is the primary filter (a wildly different
 *          length is a dead giveaway), category is preferred within that.
 *
 * For English-learning direction, all text resolution uses item.english.
 */
function pickDistractors(
  correct: DistractorItem,
  allItems: DistractorItem[],
  language: "sr" | "hr",
  itemType: "words" | "sentences",
  isFemale: boolean,
  isEnglishLearner: boolean,
  count = 3,
): string[] {
  const resolveText = (i: DistractorItem) => {
    if (isEnglishLearner) return i.english
    const base = language === "sr" ? i.serbian : i.croatian
    const female = language === "sr" ? i.serbianFemale : i.croatianFemale
    return (isFemale && female) ? female : base
  }
  const correctText = resolveText(correct)
  const correctLen = correctText.length
  const getText = resolveText

  // Exclude correct item and any accidental duplicates
  const pool = allItems.filter(i => i.id !== correct.id && getText(i) !== correctText)

  const lenSim = (text: string) =>
    Math.min(text.length, correctLen) / Math.max(text.length, correctLen)

  const withinLen = (text: string, tol: number) => lenSim(text) >= 1 - tol

  /** Shuffle pool, de-dupe by text, take `count`. */
  const pick = (candidates: DistractorItem[]): string[] => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const item of shuffle(candidates)) {
      const t = getText(item)
      if (!seen.has(t)) { seen.add(t); result.push(t) }
      if (result.length === count) break
    }
    return result
  }

  if (itemType === "words") {
    // Tier 1 — same category + similar length (±50 %)
    const t1 = pool.filter(i => i.categoryId === correct.categoryId && withinLen(getText(i), 0.5))
    if (t1.length >= count) return pick(t1)

    // Tier 2 — same category, any length
    const t2 = pool.filter(i => i.categoryId === correct.categoryId)
    if (t2.length >= count) return pick(t2)

    // Tier 3 — full pool, sorted by length similarity (best match first)
    const t3 = [...pool].sort((a, b) => lenSim(getText(b)) - lenSim(getText(a)))
    return pick(t3.slice(0, count * 4))

  } else {
    // Tier 1 — same category + length within ±35 %
    const t1 = pool.filter(i => i.categoryId === correct.categoryId && withinLen(getText(i), 0.35))
    if (t1.length >= count) return pick(t1)

    // Tier 2 — any category + length within ±35 %
    const t2 = pool.filter(i => withinLen(getText(i), 0.35))
    if (t2.length >= count) return pick(t2)

    // Tier 3 — any category + length within ±60 %
    const t3 = pool.filter(i => withinLen(getText(i), 0.60))
    if (t3.length >= count) return pick(t3)

    // Tier 4 — full pool sorted by length similarity
    const t4 = [...pool].sort((a, b) => lenSim(getText(b)) - lenSim(getText(a)))
    return pick(t4.slice(0, count * 4))
  }
}

/** Distribute `total` items across configs using largest-remainder method. */
function distribute(total: number, configs: { levelId: number; percentage: number }[]) {
  const raw = configs.map((c) => ({
    levelId: c.levelId,
    exact: (c.percentage / 100) * total,
  }))
  const result = raw.map((r) => ({ levelId: r.levelId, count: Math.floor(r.exact), frac: r.exact % 1 }))
  let remainder = total - result.reduce((s, r) => s + r.count, 0)
  result
    .slice()
    .sort((a, b) => b.frac - a.frac)
    .forEach((r) => {
      if (remainder > 0) {
        result.find((x) => x.levelId === r.levelId)!.count++
        remainder--
      }
    })
  return result
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const type = req.nextUrl.searchParams.get("type")
  if (type !== "words" && type !== "sentences") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const categoryParam = req.nextUrl.searchParams.get("category")
  const categoryId = categoryParam ? parseInt(categoryParam) : null

  const wordTextsParam = req.nextUrl.searchParams.get("wordTexts")
  const wordTextList = wordTextsParam
    ? wordTextsParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : null

  const language = session.user.language as "sr" | "hr"
  const isFemale = session.user.gender === "female"
  const isEnglishLearner = (session.user.studyDirection ?? "to_slavic") === "to_english"
  const userId = parseInt(session.user.id)

  // Fetch all items (always needed for MC distractor generation) + categories map + user prefs + level config
  const [allItems, allCategories, userRow, levelConfigs] = await Promise.all([
    db.select().from(type === "words" ? words : sentences),
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ multipleChoiceRatio: users.multipleChoiceRatio }).from(users).where(eq(users.id, userId)).get(),
    db.select().from(userLevelConfig).where(eq(userLevelConfig.userId, userId)),
  ])
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]))
  const mcRatio = userRow?.multipleChoiceRatio ?? 50  // 0–100, default 50/50

  if (allItems.length < 4) {
    return NextResponse.json(
      { error: "Not enough items in the database (need at least 4)" },
      { status: 400 }
    )
  }

  // Session pool: word-text filter > category filter > all items
  let sessionPool: typeof allItems

  if (wordTextList && wordTextList.length > 0 && type === "sentences") {
    const conditions = wordTextList.map((text) =>
      sql`lower(${sentences.serbian}) LIKE ${"%" + text + "%"}`
    )
    const matched = await db.select().from(sentences).where(or(...conditions))

    if (matched.length === 0) {
      sessionPool = allItems
    } else if (levelConfigs.length > 0) {
      // Distribute matched sentences by the user's level preferences.
      // We only pick from matched sentences — no shortfall fill from unrelated content.
      const distribution = distribute(Math.min(10, matched.length), levelConfigs)
      const picked: typeof matched = []
      for (const { levelId, count } of distribution) {
        if (count === 0) continue
        const pool = shuffle(
          (matched as (typeof allItems[number] & { levelId: number | null })[]).filter(
            (s) => s.levelId === levelId
          )
        )
        picked.push(...pool.slice(0, count))
      }
      // If nothing matched any configured level, fall back to all matched sentences
      sessionPool = picked.length > 0 ? picked : matched
    } else {
      sessionPool = matched
    }
  } else if (categoryId !== null) {
    sessionPool = allItems.filter((i) => i.categoryId === categoryId)
  } else {
    sessionPool = allItems
  }

  if (sessionPool.length === 0) {
    return NextResponse.json(
      { error: "No items found for this category" },
      { status: 400 }
    )
  }

  const sessionSize = Math.min(10, sessionPool.length)
  let sessionItems = shuffle(sessionPool).slice(0, sessionSize)

  if (type === "sentences" && categoryId === null && !wordTextList) {
    // Level-distribution for the full (non-category, non-word-text) flow
    if (levelConfigs.length > 0) {
      const distribution = distribute(10, levelConfigs)
      const picked: typeof allItems = []

      for (const { levelId, count } of distribution) {
        if (count === 0) continue
        const pool = shuffle(
          (allItems as (typeof allItems[number] & { levelId?: number | null })[]).filter(
            (s) => s.levelId === levelId
          )
        )
        picked.push(...pool.slice(0, count))
      }

      const shortfall = 10 - picked.length
      if (shortfall > 0) {
        const usedIds = new Set(picked.map((i) => i.id))
        const extras = shuffle(allItems.filter((i) => !usedIds.has(i.id))).slice(0, shortfall)
        picked.push(...extras)
      }

      if (picked.length >= 4) sessionItems = shuffle(picked)
    }
  }

  // Build a shuffled array of exercise types matching the user's MC ratio
  const mcCount = Math.round(sessionItems.length * mcRatio / 100)
  const exerciseTypes = shuffle([
    ...Array(mcCount).fill("multiple_choice"),
    ...Array(sessionItems.length - mcCount).fill("type_in"),
  ]) as ("multiple_choice" | "type_in")[]

  const exercises: Exercise[] = sessionItems.map((item, index) => {
    const exerciseType = exerciseTypes[index]
    const categoryName = item.categoryId ? categoryMap.get(item.categoryId) : undefined

    let prompt: string
    let correctAnswer: string
    let alternateAnswer: string | undefined

    if (isEnglishLearner) {
      // Prompt = Slavic (gender-matched for female users), answer = English
      const slavicBase = language === "sr" ? item.serbian : item.croatian
      const slavicFemale = language === "sr" ? item.serbianFemale : item.croatianFemale
      prompt = (isFemale && slavicFemale) ? slavicFemale : slavicBase
      correctAnswer = item.english
      // No alternateAnswer — English has no grammatical gender
    } else {
      // Prompt = English, answer = Slavic (with optional female form)
      prompt = item.english
      const base = language === "sr" ? item.serbian : item.croatian
      const female = language === "sr" ? item.serbianFemale : item.croatianFemale
      correctAnswer = (isFemale && female) ? female : base
      alternateAnswer = female && female !== base
        ? (isFemale ? base : female)
        : undefined
    }

    if (exerciseType === "multiple_choice") {
      const distractors = pickDistractors(item as DistractorItem, allItems as DistractorItem[], language, type, isFemale, isEnglishLearner)
      return {
        id: item.id,
        exerciseType,
        prompt,
        correctAnswer,
        alternateAnswer,
        options: shuffle([correctAnswer, ...distractors]),
        categoryName,
      }
    }

    return { id: item.id, exerciseType, prompt, correctAnswer, alternateAnswer, categoryName }
  })

  return NextResponse.json({ exercises })
}
