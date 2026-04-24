import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences, userLevelConfig } from "@/db/schema"
import { eq } from "drizzle-orm"

export type Exercise = {
  id: number
  exerciseType: "type_in" | "multiple_choice"
  english: string
  correctAnswer: string
  options?: string[]
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
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

  const language = session.user.language as "sr" | "hr"
  const userId = parseInt(session.user.id)

  // Fetch all items (always needed for MC distractor generation)
  const allItems = await db.select().from(type === "words" ? words : sentences)

  if (allItems.length < 4) {
    return NextResponse.json(
      { error: "Not enough items in the database (need at least 4)" },
      { status: 400 }
    )
  }

  // Session pool: restrict to category when requested
  const sessionPool =
    categoryId !== null
      ? allItems.filter((i) => i.categoryId === categoryId)
      : allItems

  if (sessionPool.length === 0) {
    return NextResponse.json(
      { error: "No items found for this category" },
      { status: 400 }
    )
  }

  const sessionSize = Math.min(10, sessionPool.length)
  let sessionItems = shuffle(sessionPool).slice(0, sessionSize)

  if (type === "sentences" && categoryId === null) {
    // Level-distribution only applies to the full (non-category) flow
    const levelConfigs = await db
      .select()
      .from(userLevelConfig)
      .where(eq(userLevelConfig.userId, userId))

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

  const exercises: Exercise[] = sessionItems.map((item, index) => {
    const exerciseType = index % 2 === 0 ? "multiple_choice" : "type_in"
    const correctAnswer = language === "sr" ? item.serbian : item.croatian

    if (exerciseType === "multiple_choice") {
      const distractors = shuffle(allItems.filter((i) => i.id !== item.id))
        .slice(0, 3)
        .map((i) => (language === "sr" ? i.serbian : i.croatian))
      return {
        id: item.id,
        exerciseType,
        english: item.english,
        correctAnswer,
        options: shuffle([correctAnswer, ...distractors]),
      }
    }

    return { id: item.id, exerciseType, english: item.english, correctAnswer }
  })

  return NextResponse.json({ exercises })
}
