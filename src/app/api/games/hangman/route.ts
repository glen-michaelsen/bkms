import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words } from "@/db/schema"
import { sql } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Fresh random batch of words for the endless hangman game.
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const pool = await db
    .select({ serbian: words.serbian, croatian: words.croatian, english: words.english })
    .from(words)
    .orderBy(sql`RANDOM()`)
    .limit(100)
    .all()

  return NextResponse.json(pool)
}
