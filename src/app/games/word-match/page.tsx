import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { words, wordMatchPuzzles, userWordMatchProgress } from "@/db/schema"
import { sql, eq, and } from "drizzle-orm"
import { WordMatch } from "@/components/WordMatch"

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

type MatchWord = { id: number; serbian: string; croatian: string; english: string }

export default async function WordMatchPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const today = todayUtc()
  const userId = parseInt(session.user.id)
  const language = session.user.language as "sr" | "hr"
  const studyDirection = (session.user.studyDirection ?? "to_slavic") as "to_slavic" | "to_english"

  // Fetch or generate today's puzzle
  let existing = await db
    .select()
    .from(wordMatchPuzzles)
    .where(eq(wordMatchPuzzles.date, today))
    .get()

  if (!existing) {
    const picked = await db
      .select({ id: words.id, serbian: words.serbian, croatian: words.croatian, english: words.english })
      .from(words)
      .orderBy(sql`RANDOM()`)
      .limit(5)
      .all()

    const [created] = await db
      .insert(wordMatchPuzzles)
      .values({ date: today, wordsJson: JSON.stringify(picked) })
      .returning()

    existing = created
  }

  const puzzleWords: MatchWord[] = JSON.parse(existing.wordsJson)

  // Check if user already solved today
  const userProgress = await db
    .select()
    .from(userWordMatchProgress)
    .where(
      and(
        eq(userWordMatchProgress.userId, userId),
        eq(userWordMatchProgress.date, today),
      ),
    )
    .get()

  const initialSolved = !!userProgress?.solvedAt
  const isAdmin = session.user.role === "admin"

  return (
    <WordMatch
      initialWords={puzzleWords}
      date={today}
      initialSolved={initialSolved}
      isAdmin={isAdmin}
      language={language}
      studyDirection={studyDirection}
    />
  )
}
