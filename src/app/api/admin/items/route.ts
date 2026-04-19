import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences } from "@/db/schema"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { type, english, serbian, croatian } = body

  if (!type || !english?.trim() || !serbian?.trim() || !croatian?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 })
  }

  if (type !== "words" && type !== "sentences") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  const table = type === "words" ? words : sentences
  const [item] = await db
    .insert(table)
    .values({ english: english.trim(), serbian: serbian.trim(), croatian: croatian.trim() })
    .returning()

  return NextResponse.json({ item }, { status: 201 })
}
