import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words, categories, userItemProgress } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { LearnWordsSession } from "@/components/LearnWordsSession"

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

const SESSION_SIZE = 5

export default async function LearnWordsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId     = parseInt(session.user.id)
  const language   = (session.user.language ?? "sr") as "sr" | "hr"
  const isFemale   = session.user.gender === "female"
  const isEnglish  = (session.user.studyDirection ?? "to_slavic") === "to_english"

  const [allWords, allCategories, allProgress] = await Promise.all([
    db.select().from(words),
    db.select().from(categories),
    db.select().from(userItemProgress).where(
      and(eq(userItemProgress.userId, userId), eq(userItemProgress.itemType, "word"))
    ),
  ])

  const catMap      = new Map(allCategories.map(c => [c.id, c.name]))
  const progressMap = new Map(allProgress.map(p => [p.itemId, p]))

  // "new" = no progress record; "learning" = record exists but never answered correctly
  const candidates = allWords.filter(w => {
    const p = progressMap.get(w.id)
    return !p || p.correctCount === 0
  })

  const sessionWords = shuffle(candidates).slice(0, SESSION_SIZE).map(w => ({
    ...w,
    categoryName: w.categoryId ? (catMap.get(w.categoryId) ?? null) : null,
  }))

  const allWordsTagged = allWords.map(w => ({
    ...w,
    categoryName: w.categoryId ? (catMap.get(w.categoryId) ?? null) : null,
  }))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Back
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        {sessionWords.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🎓</div>
            <h2 className="text-2xl font-extrabold text-slate-900">You're all caught up!</h2>
            <p className="text-slate-500 text-sm">No new words to learn right now. Keep practising what you know.</p>
            <Link href="/study/words" className="inline-block mt-4 px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition">
              Practise words →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Learn new words</h1>
              <p className="text-sm text-slate-500 mt-1">{sessionWords.length} words · Read → Choose → Type</p>
            </div>
            <LearnWordsSession
              words={sessionWords}
              allWords={allWordsTagged}
              language={language}
              isFemale={isFemale}
              isEnglishLearner={isEnglish}
            />
          </>
        )}
      </main>
    </div>
  )
}
