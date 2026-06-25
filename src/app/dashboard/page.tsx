import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { logoutAction } from "@/app/actions"
import { db } from "@/db"
import { words, sentences, userItemProgress, userDailyActivity, categories, userCrosswordProgress, userWordMatchProgress, userProfile } from "@/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { buildStats, STATUS_META, type ItemStats } from "@/lib/progress"
import { ActivityGraph } from "@/components/ActivityGraph"
import { CategoryTags } from "@/components/CategoryTags"
import { DailySentences } from "@/components/DailySentences"
import { Greeting } from "@/components/Greeting"
import { BookOpen, MessageSquare, Grid3x3, Shuffle, ArrowRight, Check, User, List, Sparkles, ALargeSmall, Hash } from "lucide-react"

const languageInfo = {
  sr: { label: "Serbian", flag: "🇷🇸", native: "Srpski" },
  hr: { label: "Croatian", flag: "🇭🇷", native: "Hrvatski" },
}

function getLangBadge(language: string, studyDirection: string) {
  const slavic = languageInfo[language as "sr" | "hr"] ?? { label: language, flag: "🌍", native: "" }
  if (studyDirection === "to_english") {
    return { flag: "🇬🇧", label: "English", subtitle: null }
  }
  return { flag: slavic.flag, label: slavic.label, subtitle: slavic.native }
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

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({ href, icon: Icon, name, solved, subtitle }: { href: string; icon: React.ComponentType<{ className?: string }>; name: string; solved: boolean; subtitle?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${solved ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"} transition-colors`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
        {solved ? (
          <p className="text-xs font-medium text-emerald-600 mt-0.5 flex items-center gap-1"><Check className="w-3 h-3" />Solved today</p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle ?? "Play today's puzzle"}</p>
        )}
      </div>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${solved ? "bg-emerald-400" : "bg-slate-200"}`} />
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const studyDirection = session.user.studyDirection ?? "to_slavic"
  const lang = getLangBadge(session.user.language, studyDirection)
  const firstName = session.user.firstName || session.user.email.split("@")[0]
  const userId = parseInt(session.user.id)
  const today = new Date().toISOString().slice(0, 10)

  // 12 weeks back for graph
  const graphStart = new Date()
  graphStart.setUTCDate(graphStart.getUTCDate() - 12 * 7)
  const graphStartStr = graphStart.toISOString().slice(0, 10)

  const [allWords, allSentences, allProgress, allActivity, allCategories, crosswordProgress, wordMatchProgress, profile] = await Promise.all([
    db.select({ id: words.id }).from(words),
    db.select({ id: sentences.id }).from(sentences),
    db.select().from(userItemProgress).where(eq(userItemProgress.userId, userId)),
    db.select().from(userDailyActivity).where(
      and(eq(userDailyActivity.userId, userId), gte(userDailyActivity.date, graphStartStr))
    ),
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ solvedAt: userCrosswordProgress.solvedAt })
      .from(userCrosswordProgress)
      .where(and(eq(userCrosswordProgress.userId, userId), eq(userCrosswordProgress.date, today)))
      .get(),
    db.select({ solvedAt: userWordMatchProgress.solvedAt })
      .from(userWordMatchProgress)
      .where(and(eq(userWordMatchProgress.userId, userId), eq(userWordMatchProgress.date, today)))
      .get(),
    db.select({ userId: userProfile.userId, jobStatus: userProfile.jobStatus, birthday: userProfile.birthday, city: userProfile.city, country: userProfile.country, countryOfOrigin: userProfile.countryOfOrigin })
      .from(userProfile).where(eq(userProfile.userId, userId)).get(),
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-8">
        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full mb-4">
            <span>{lang.flag}</span>
            <span>{lang.label}{lang.subtitle ? ` · ${lang.subtitle}` : ""}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
            <Greeting firstName={firstName} studyDirection={studyDirection} />
          </h1>
          <p className="text-slate-500 mt-2 text-lg">What would you like to practice today?</p>
        </div>

        {/* Activity graph + daily sentences — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ActivityGraph weeks={weeks} streak={streak} totalDaysActive={totalDaysActive} numWeeks={12} />
          <DailySentences studyDirection={studyDirection} language={session.user.language as "sr" | "hr"} />
        </div>

        {/* Streak milestone — Instagram follow nudge (Slavic learners only) */}
        {[7, 30, 100].includes(streak) && studyDirection !== "to_english" && (
          <a
            href="https://www.instagram.com/cujemoseapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-2xl px-5 py-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 mb-1">Want to learn even more?</p>
              <p className="text-sm text-slate-600 leading-relaxed">We post useful sentences and a taste of Balkan culture on Instagram a few times a week. Come join us at <span className="font-semibold text-violet-700">@cujemoseapp</span></p>
            </div>
          </a>
        )}

        {/* Vocabulary Training */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Vocabulary Training</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {wordStats.unseen > 0 && (
              <Link
                href="/learn/words"
                className="group relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl border border-violet-500 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 sm:col-span-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors text-white">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Learn New Words</h3>
                    <p className="text-violet-200 text-sm">{wordStats.unseen} unseen word{wordStats.unseen !== 1 ? "s" : ""} · Read, choose, then type each one</p>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-violet-200 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </Link>
            )}
            <Link
              href="/study/words"
              className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-violet-200 transition-colors text-violet-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Train Words</h3>
                <StatsBar stats={wordStats} />
                <div className="mt-4 flex items-center text-violet-600 text-sm font-semibold">
                  Start session
                  <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link
              href="/study/sentences"
              className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-fuchsia-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-fuchsia-200 transition-colors text-fuchsia-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Train Sentences</h3>
                <StatsBar stats={sentenceStats} />
                <div className="mt-4 flex items-center text-fuchsia-600 text-sm font-semibold">
                  Start session
                  <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Standard Exercises */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Standard Exercises</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GameCard
              href="/study/introduction"
              icon={User}
              name="My Introduction"
              solved={false}
              subtitle={profile ? "Practice your intro" : "Set up your profile"}
            />
            {studyDirection !== "to_english" && (
              <GameCard
                href="/study/cases"
                icon={List}
                name="Cases"
                solved={false}
                subtitle="All 7 cases"
              />
            )}
            {studyDirection !== "to_english" && (
              <GameCard
                href="/alphabet"
                icon={ALargeSmall}
                name="Alphabet"
                solved={false}
                subtitle="Learn letters"
              />
            )}
            <GameCard
              href="/numbers"
              icon={Hash}
              name="Numbers"
              solved={false}
              subtitle="Learn to count"
            />
          </div>
        </div>

        {/* Daily Games */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GameCard
              href="/games/crossword"
              icon={Grid3x3}
              name="Crossword"
              solved={!!crosswordProgress?.solvedAt}
            />
            <GameCard
              href="/games/word-match"
              icon={Shuffle}
              name="Word Match"
              solved={!!wordMatchProgress?.solvedAt}
            />
          </div>
        </div>

        {/* Train by Category */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Train by Category</h2>
          <CategoryTags categories={allCategories} />
        </div>

        <p className="text-center text-xs text-slate-400">
          <span className="font-semibold">Known</span> = 3 correct in a row · each session is 10 items
        </p>
      </main>
    </div>
  )
}
