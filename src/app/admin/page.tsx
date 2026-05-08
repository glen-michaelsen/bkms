import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words, sentences, categories, levels, users, userDailyActivity } from "@/db/schema"
import { AddItemForm } from "@/components/AddItemForm"
import { AddNamedItem } from "@/components/AddNamedItem"
import { CsvUpload } from "@/components/CsvUpload"
import { addCategoryAction, addLevelAction, deleteCategoryAction } from "@/app/actions"
import { eq, desc } from "drizzle-orm"

// ── Streak helpers (same logic as dashboard) ─────────────────────────────────

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

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [allCategories, allLevels, allWords, allSentences, allUsers, allActivity] = await Promise.all([
    db.select().from(categories).orderBy(categories.id),
    db.select().from(levels).orderBy(levels.id),
    db.select().from(words).orderBy(words.id),
    db.select().from(sentences).orderBy(sentences.id),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(userDailyActivity),
  ])

  // ── Usage stats ─────────────────────────────────────────────────────────────
  const activeTodayIds  = new Set(allActivity.filter(a => a.date === today).map(a => a.userId))
  const activeWeekIds   = new Set(allActivity.filter(a => a.date >= weekAgo).map(a => a.userId))
  const answersToday    = allActivity.filter(a => a.date === today).reduce((s, a) => s + a.answersCount, 0)
  const answersWeek     = allActivity.filter(a => a.date >= weekAgo).reduce((s, a) => s + a.answersCount, 0)
  const answersTotal    = allActivity.reduce((s, a) => s + a.answersCount, 0)

  const userRows = allUsers.map(u => {
    const acts   = allActivity.filter(a => a.userId === u.id)
    const actMap = new Map(acts.map(a => [a.date, a.answersCount]))
    const total  = acts.reduce((s, a) => s + a.answersCount, 0)
    const last   = acts.length > 0 ? acts.reduce((mx, a) => a.date > mx ? a.date : mx, "") : null
    return { ...u, totalAnswers: total, lastActive: last, streak: calcStreak(actMap, today) }
  })

  const bestStreak = userRows.reduce((mx, u) => Math.max(mx, u.streak), 0)

  // Enrich words with category names
  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]))
  const levelMap = Object.fromEntries(allLevels.map((l) => [l.id, l.name]))

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

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-14">

        {/* ── Usage dashboard ───────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Usage</h2>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: "👥", label: "Total users",    value: allUsers.length,           sub: `${allUsers.filter(u => u.language === "sr").length} SR · ${allUsers.filter(u => u.language === "hr").length} HR` },
              { icon: "🟢", label: "Active today",   value: activeTodayIds.size,       sub: `${activeWeekIds.size} this week` },
              { icon: "✅", label: "Answers today",  value: answersToday.toLocaleString(), sub: `${answersWeek.toLocaleString()} this week` },
              { icon: "🔥", label: "Best streak",    value: `${bestStreak}d`,          sub: `${answersTotal.toLocaleString()} answers total` },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
                <span className="text-2xl">{icon}</span>
                <p className="text-2xl font-extrabold text-slate-900 leading-none mt-2">{value}</p>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* Per-user table */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">User</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Lang</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Joined</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Last active</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-500">Streak</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-500">Answers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users yet</td></tr>
                ) : userRows.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{u.firstName ?? "—"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.language === "sr" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
                        {u.language.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 tabular-nums">
                      {u.createdAt ? u.createdAt.toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 tabular-nums">
                      {u.lastActive ?? <span className="text-slate-300">never</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.streak > 0
                        ? <span className="font-semibold text-amber-600">{u.streak}d 🔥</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700 tabular-nums">
                      {u.totalAnswers > 0 ? u.totalAnswers.toLocaleString() : <span className="text-slate-300">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Categories & Levels ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Categories */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏷️</span>
              <h2 className="font-bold text-slate-900">Categories</h2>
              <span className="ml-auto text-sm text-slate-400">{allCategories.length}</span>
            </div>
            <AddNamedItem label="Category" placeholder="e.g. Food, Travel…" action={addCategoryAction} accent="violet" />
            {allCategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allCategories.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-violet-50 text-violet-700 text-sm font-medium rounded-full">
                    {c.name}
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-violet-200 text-violet-400 hover:text-violet-700 transition-colors text-xs leading-none"
                        title={`Delete ${c.name}`}
                      >
                        ×
                      </button>
                    </form>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Levels */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📊</span>
              <h2 className="font-bold text-slate-900">Levels</h2>
              <span className="ml-auto text-sm text-slate-400">{allLevels.length}</span>
            </div>
            <AddNamedItem label="Level" placeholder="e.g. Beginner, A1…" action={addLevelAction} accent="sky" />
            {allLevels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allLevels.map((l) => (
                  <span key={l.id} className="px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full">
                    {l.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Add content ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Add content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AddItemForm type="words" categories={allCategories} levels={allLevels} />
            <AddItemForm type="sentences" categories={allCategories} levels={allLevels} />
          </div>
        </section>

        {/* ── Bulk import ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Bulk import</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CsvUpload type="words" />
            <CsvUpload type="sentences" />
          </div>
        </section>

        {/* ── Words table ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">Words</h2>
            <span className="text-sm font-medium text-slate-400">{allWords.length} total</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allWords.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No words yet</td></tr>
                ) : allWords.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{w.english}</td>
                    <td className="px-5 py-3.5 text-slate-600">{w.serbian}</td>
                    <td className="px-5 py-3.5 text-slate-600">{w.croatian}</td>
                    <td className="px-5 py-3.5">
                      {w.categoryId ? (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                          {catMap[w.categoryId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Sentences table ───────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">Sentences</h2>
            <span className="text-sm font-medium text-slate-400">{allSentences.length} total</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSentences.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No sentences yet</td></tr>
                ) : allSentences.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{s.english}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.serbian}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.croatian}</td>
                    <td className="px-5 py-3.5">
                      {s.categoryId ? (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                          {catMap[s.categoryId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.levelId ? (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-full">
                          {levelMap[s.levelId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
