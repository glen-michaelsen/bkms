import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words, sentences, categories, levels, users, userDailyActivity, verbs } from "@/db/schema"
import { desc } from "drizzle-orm"
import { addCategoryAction, addLevelAction, deleteCategoryAction } from "@/app/actions"
import { AdminTabs } from "@/components/AdminTabs"

// ── Streak helpers ────────────────────────────────────────────────────────────

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function calcStreak(actMap: Map<string, number>, today: string): number {
  let d = actMap.has(today) ? today : prevDay(today)
  let streak = 0
  while ((actMap.get(d) ?? 0) > 0) { streak++; d = prevDay(d) }
  return streak
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  const today   = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [allCategories, allLevels, allWords, allSentences, allUsers, allActivity, allVerbs] = await Promise.all([
    db.select().from(categories).orderBy(categories.id),
    db.select().from(levels).orderBy(levels.id),
    db.select().from(words).orderBy(words.id),
    db.select().from(sentences).orderBy(sentences.id),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(userDailyActivity),
    db.select().from(verbs).orderBy(verbs.sortOrder, verbs.id),
  ])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeTodayIds = new Set(allActivity.filter(a => a.date === today).map(a => a.userId))
  const activeWeekIds  = new Set(allActivity.filter(a => a.date >= weekAgo).map(a => a.userId))
  const answersToday   = allActivity.filter(a => a.date === today).reduce((s, a) => s + a.answersCount, 0)
  const answersWeek    = allActivity.filter(a => a.date >= weekAgo).reduce((s, a) => s + a.answersCount, 0)
  const answersTotal   = allActivity.reduce((s, a) => s + a.answersCount, 0)

  const userRows = allUsers.map(u => {
    const acts   = allActivity.filter(a => a.userId === u.id)
    const actMap = new Map(acts.map(a => [a.date, a.answersCount]))
    const total  = acts.reduce((s, a) => s + a.answersCount, 0)
    const last   = acts.length > 0 ? acts.reduce((mx, a) => a.date > mx ? a.date : mx, "") : null
    return { ...u, totalAnswers: total, lastActive: last, streak: calcStreak(actMap, today) }
  })

  const bestStreak = userRows.reduce((mx, u) => Math.max(mx, u.streak), 0)

  // ── Weekly growth (last 12 weeks) ─────────────────────────────────────────
  function weekMonday(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00Z")
    const dow = d.getUTCDay()
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1))
    return d.toISOString().slice(0, 10)
  }

  const NUM_WEEKS = 12
  const weeks: string[] = []
  const baseMonday = new Date(weekMonday(today) + "T00:00:00Z")
  for (let i = NUM_WEEKS - 1; i >= 0; i--) {
    const d = new Date(baseMonday)
    d.setUTCDate(d.getUTCDate() - i * 7)
    weeks.push(d.toISOString().slice(0, 10))
  }

  const weeklyNewUsers   = weeks.map(w => {
    const next = new Date(w + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 7)
    const nextStr = next.toISOString().slice(0, 10)
    return allUsers.filter(u => {
      const d = u.createdAt?.toISOString().slice(0, 10) ?? ""
      return d >= w && d < nextStr
    }).length
  })

  const weeklyAnswers = weeks.map(w => {
    const next = new Date(w + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 7)
    const nextStr = next.toISOString().slice(0, 10)
    return allActivity.filter(a => a.date >= w && a.date < nextStr).reduce((s, a) => s + a.answersCount, 0)
  })

  const weeklyActiveUsers = weeks.map(w => {
    const next = new Date(w + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 7)
    const nextStr = next.toISOString().slice(0, 10)
    return new Set(allActivity.filter(a => a.date >= w && a.date < nextStr).map(a => a.userId)).size
  })

  const weeklyStats = weeks.map((w, i) => ({ week: w, newUsers: weeklyNewUsers[i], answers: weeklyAnswers[i], activeUsers: weeklyActiveUsers[i] }))


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Čujemo se" className="h-6" />
            <span className="text-slate-400 font-medium text-sm">· Admin</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10">
        <AdminTabs
          stats={{
            totalUsers: allUsers.length,
            srCount: allUsers.filter(u => u.language === "sr").length,
            hrCount: allUsers.filter(u => u.language === "hr").length,
            activeTodayCount: activeTodayIds.size,
            activeWeekCount:  activeWeekIds.size,
            answersToday, answersWeek, answersTotal, bestStreak,
          }}
          userRows={userRows}
          categories={allCategories}
          levels={allLevels}
          words={allWords}
          sentences={allSentences}
          verbs={allVerbs}
          weeklyStats={weeklyStats}
          actions={{ addCategoryAction, addLevelAction, deleteCategoryAction }}
        />
      </main>
    </div>
  )
}
