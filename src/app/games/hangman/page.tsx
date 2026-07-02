import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { words } from "@/db/schema"
import { sql } from "drizzle-orm"
import { HangmanGame } from "@/components/HangmanGame"

export const dynamic = "force-dynamic"

export type HangmanWord = { serbian: string; croatian: string; english: string }

export default async function HangmanPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const language = (session.user.language ?? "sr") as "sr" | "hr"
  const studyDirection = (session.user.studyDirection ?? "to_slavic") as "to_slavic" | "to_english"

  // Endless practice: grab a generous random pool; the client cycles through it
  // and asks the API for a fresh batch when it runs low.
  const pool = await db
    .select({ serbian: words.serbian, croatian: words.croatian, english: words.english })
    .from(words)
    .orderBy(sql`RANDOM()`)
    .limit(100)
    .all()

  return (
    <HangmanGame pool={pool} language={language} studyDirection={studyDirection} />
  )
}
