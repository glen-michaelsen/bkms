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

  const language = session.user.language as "sr" | "hr"
  const userId = parseInt(session.user.id)

  // Fetch all items
  const allItems = await db.select().from(type === "words" ? words : sentences)

  if (allItems.length < 4) {
    return NextResponse.json(
      { error: "Not enough items in the database (need at least 4)" },
      { status: 400 }
    )
  }

  // For sentences: check if user has level config
  let sessionItems = shuffle(allItems).slice(0, 10)

  if (type === "sentences") {
    const levelConfigs = await db
      .select()
      .from(userLevelConfig)
      .where(eq(userLevelConfig.userId, userId))

    if (levelConfigs.length > 0) {
      const distribution = distribute(10, levelConfigs)
      const picked: typeof allItems = []

      for (const { levelId, count } of distribution) {
        if (count === 0) continue
        // sentences have levelId column
        const pool = shuffle(
          (allItems as (typeof allItems[number] & { levelId?: number | null })[]).filter(
            (s) => s.levelId === levelId
          )
        )
        picked.push(...pool.slice(0, count))
      }

      // Fill any shortfall (e.g. a level had fewer items than requested)
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
