import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences } from "@/db/schema"

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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const type = req.nextUrl.searchParams.get("type")
  if (type !== "words" && type !== "sentences") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const language = session.user.language as "sr" | "hr"
  const table = type === "words" ? words : sentences
  const allItems = await db.select().from(table)

  if (allItems.length < 4) {
    return NextResponse.json(
      { error: "Not enough items in the database (need at least 4)" },
      { status: 400 }
    )
  }

  const sessionItems = shuffle(allItems).slice(0, 10)

  const exercises: Exercise[] = sessionItems.map((item, index) => {
    const exerciseType = index % 2 === 0 ? "multiple_choice" : "type_in"
    const correctAnswer = language === "sr" ? item.serbian : item.croatian

    if (exerciseType === "multiple_choice") {
      const distractors = shuffle(
        allItems.filter((i) => i.id !== item.id)
      )
        .slice(0, 3)
        .map((i) => (language === "sr" ? i.serbian : i.croatian))

      const options = shuffle([correctAnswer, ...distractors])
      return { id: item.id, exerciseType, english: item.english, correctAnswer, options }
    }

    return { id: item.id, exerciseType, english: item.english, correctAnswer }
  })

  return NextResponse.json({ exercises })
}
