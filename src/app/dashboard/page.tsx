import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { logoutAction } from "@/app/actions"
import { db } from "@/db"
import { words, sentences, userItemProgress, userDailyActivity, categories } from "@/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { buildStats, STATUS_META, type ItemStats } from "@/lib/progress"
import { ActivityGraph } from "@/components/ActivityGraph"
import { CategoryTags } from "@/components/CategoryTags"
import { DailySentences } from "@/components/DailySentences"
import { Greeting } from "@/components/Greeting"

const languageInfo = {
  sr: { label: "Serbian", flag: "🇷🇸", native: "Srpski" },
  hr: { label: "Croatian", flag: "🇭🇷", native: "Hrvatski" },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function calcStreak(activityMap: Map<string, number>, today: string): number {
  let d = activityMap.has(today) ? today : prevDay(today) // grace period
  let streak = 0
  while ((activityMap.get(d) ?? 0) > 0) {
    streak++
    d = prevDay(d)
  }
  return streak
}

function buildGrid(activityMap: Map<string, number>, numWeeks = 16) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dow = today.getUTCDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const currentMonday = new Date(today)
  currentMonday.setUTCDate(today.getUTCDate() - daysFromMonday)

  const start = new Date(currentMonday)
  start.setUTCDate(currentMonday.getUTCDate() - (numWeeks - 1) * 7)

  const weeks = []
  for (let w = 0; w < numWeeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + w * 7 + d)
      const dateStr = date.toISOString().slice(0, 10)
      week.push({
        date: dateStr,
        count: activityMap.get(dateStr) ?? 0,
        isFuture: dateStr > todayStr,
      })
    }
    weeks.push(week)
  }
  return weeks
}

// ── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: ItemStats }) {
  const segments = [
    { key: "known" as const,    count: stats.known },
    { key: "familiar" as const, count: stats.familiar },
    { key: "learning" as const, count: stats.learning },
    { key: "new" as const,      count: stats.unseen },
  ] as const

  if (stats.total === 0) {
    return <p className="text-xs text-slate-400 mt-3">No items yet</p>
  }

  return (
    <div className="mt-4">
      <div className="h-1.5 rounded-full overflow-hidden flex gap-px bg-slate-100">
        {segments.map(({ key, count }) =>
          count > 0 ? (
            <div
              key={key}
              className={`h-full ${STATUS_META[key].bar}`}
              style={{ width: `${(count / stats.total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
        {segments.map(({ key, count }) => (
          <span key={key} className={`text-xs font-medium ${count === 0 ? "text-slate-300" : STATUS_META[key].color}`}>
            {count} {STATUS_META[key].label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const lang = languageInfo[session.user.language as "sr" | "hr"] ?? {
    label: session.user.language, flag: "🌍", native: "",
  }
  const firstName = session.user.firstName || session.user.email.split("@")[0]
  const userId = parseInt(session.user.id)
  const today = new Date().toISOString().slice(0, 10)

  // 12 weeks back for graph
  const graphStart = new Date()
  graphStart.setUTCDate(graphStart.getUTCDate() - 12 * 7)
  const graphStartStr = graphStart.toISOString().slice(0, 10)

  const [allWords, allSentences, allProgress, allActivity, allCategories] = await Promise.all([
    db.select({ id: words.id }).from(words),
    db.select({ id: sentences.id }).from(sentences),
    db.select().from(userItemProgress).where(eq(userItemProgress.userId, userId)),
    db.select().from(userDailyActivity).where(
      and(eq(userDailyActivity.userId, userId), gte(userDailyActivity.date, graphStartStr))
    ),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ])

  const wordStats = buildStats(
    allWords.map((w) => w.id),
    allProgress.filter((p) => p.itemType === "word")
  )
  const sentenceStats = buildStats(
    allSentences.map((s) => s.id),
    allProgress.filter((p) => p.itemType === "sentence")
  )

  const activityMap = new Map(allActivity.map((a) => [a.date, a.answersCount]))
  const streak = calcStreak(activityMap, today)
  const weeks = buildGrid(activityMap, 12)
  const totalDaysActive = allActivity.length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="flex items-center gap-5">
            {session.user.role === "admin" && (
              <Link href="/admin" className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition">
                Admin
              </Link>
            )}
            <Link href="/settings" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
              Settings
            </Link>
            <form action={logoutAction}>
              <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-6">
        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full mb-4">
            <span>{lang.flag}</span>
            <span>{lang.label} · {lang.native}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
            <Greeting firstName={firstName} />
          </h1>
          <p className="text-slate-500 mt-2 text-lg">What would you like to practice today?</p>
        </div>

        {/* Activity graph + daily sentences — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ActivityGraph weeks={weeks} streak={streak} totalDaysActive={totalDaysActive} numWeeks={12} />
          <DailySentences />
        </div>

        {/* Study cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/study/words"
            className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-violet-200 transition-colors">
                📖
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">Train Words</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Practise vocabulary — translate single words between English and {lang.label}.
              </p>
              <StatsBar stats={wordStats} />
              <div className="mt-4 flex items-center text-violet-600 text-sm font-semibold">
                Start session
                <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/study/sentences"
            className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-fuchsia-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-fuchsia-200 transition-colors">
                💬
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">Train Sentences</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Build fluency with full phrases — common everyday sentences in {lang.label}.
              </p>
              <StatsBar stats={sentenceStats} />
              <div className="mt-4 flex items-center text-fuchsia-600 text-sm font-semibold">
                Start session
                <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Category tags */}
        <CategoryTags categories={allCategories} />

        <p className="text-center text-xs text-slate-400">
          <span className="font-semibold">Known</span> = 3 correct in a row · each session is 10 items
        </p>
      </main>
    </div>
  )
}
