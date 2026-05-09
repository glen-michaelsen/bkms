import { auth } from "@/auth"
import { db } from "@/db"
import { words, crosswordPuzzles, userCrosswordProgress } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { generateDailyCrossword, GeneratedPuzzle } from "@/lib/crossword-generator"
import { CrosswordGame } from "@/components/CrosswordGame"

// Today's date in YYYY-MM-DD (UTC — consistent for all users for the "daily" puzzle)
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function CrosswordPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const date = todayUtc()

  // ── Fetch or generate today's puzzle ─────────────────────────────────────────
  let puzzle: GeneratedPuzzle | null = null

  const existing = await db
    .select()
    .from(crosswordPuzzles)
    .where(eq(crosswordPuzzles.date, date))
    .get()

  if (existing) {
    puzzle = JSON.parse(existing.puzzleJson) as GeneratedPuzzle
  } else {
    // Generate from the word database
    const dbWords = await db.select({ english: words.english, serbian: words.serbian }).from(words).all()
    puzzle = generateDailyCrossword(dbWords)

    if (puzzle) {
      try {
        await db.insert(crosswordPuzzles).values({
          date,
          puzzleJson: JSON.stringify(puzzle),
        })
      } catch {
        // Another request may have inserted it concurrently — that's fine
      }
    }
  }

  // ── Fetch user's saved progress ────────────────────────────────────────────
  const userId = parseInt(session.user.id)

  const progress = await db
    .select()
    .from(userCrosswordProgress)
    .where(
      and(
        eq(userCrosswordProgress.userId, userId),
        eq(userCrosswordProgress.date, date),
      ),
    )
    .get()

  const initialInput: Record<string, string> = progress
    ? JSON.parse(progress.inputJson || "{}")
    : {}

  const initialSolvedAt: string | null = progress?.solvedAt
    ? progress.solvedAt.toISOString()
    : null

  return (
    <CrosswordGame
      puzzle={puzzle}
      date={date}
      initialInput={initialInput}
      initialSolvedAt={initialSolvedAt}
    />
  )
}
