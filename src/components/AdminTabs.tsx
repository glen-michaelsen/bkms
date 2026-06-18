"use client"

import { useState, useActionState } from "react"
import Link from "next/link"
import { Users, Activity, CheckCircle2, Flame, Tag, BarChart2, Search, Mail, BookOpen as BookOpenIcon, SendHorizonal } from "lucide-react"
import { AddItemForm } from "./AddItemForm"
import { AddNamedItem } from "./AddNamedItem"
import { CsvUpload } from "./CsvUpload"
import { VerbCsvUpload } from "./VerbCsvUpload"
import {
  updateWordAction, deleteWordAction,
  updateSentenceAction, deleteSentenceAction,
  addVerbAction, deleteVerbAction,
  adminTriggerStreakMailAction, adminTriggerVerbOfDayAction,
  type StreakMailResult,
} from "@/app/actions"

// ── Types ────────────────────────────────────────────────────────────────────

type Category  = { id: number; name: string }
type Level     = { id: number; name: string }
type Word      = { id: number; english: string; serbian: string; croatian: string; serbianFemale: string | null; croatianFemale: string | null; categoryId: number | null }
type Sentence  = { id: number; english: string; serbian: string; croatian: string; serbianFemale: string | null; croatianFemale: string | null; categoryId: number | null; levelId: number | null }
type VerbExample = { serbian: string; croatian?: string; english: string }
type Verb      = { id: number; infinitive: string; translation: string; ja: string; ti: string; onOna: string; mi: string; vi: string; oni: string; infinitiveHr: string | null; jaHr: string | null; tiHr: string | null; onOnaHr: string | null; miHr: string | null; viHr: string | null; oniHr: string | null; examplesJson: string; sortOrder: number }
type UserRow   = {
  id: number; email: string; firstName: string | null; language: string; studyDirection: string
  createdAt: Date | null; lastActive: string | null; streak: number; totalAnswers: number
}
type Stats = {
  totalUsers: number; srCount: number; hrCount: number; enCount: number
  activeTodayCount: number; activeWeekCount: number
  answersToday: number; answersWeek: number; answersTotal: number
  bestStreak: number
}
type WeekStat = { week: string; newUsers: number; answers: number; activeUsers: number }
type MonthMetrics = { newUsers: number; activeUsers: number; answers: number }
type MonthComparison = {
  lastMonthName: string; thisMonthName: string
  daysElapsed: number; daysInMonth: number
  last: MonthMetrics; projected: MonthMetrics
}
type SimpleResult = { error?: string; success?: boolean }
type UseActionStateAction = (prev: SimpleResult | undefined, formData: FormData) => Promise<SimpleResult>
type ServerActions = {
  addCategoryAction:    UseActionStateAction
  addLevelAction:       UseActionStateAction
  deleteCategoryAction: (formData: FormData) => Promise<void>
}

export type AdminTabsProps = {
  stats: Stats
  categories: Category[]
  levels: Level[]
  words: Word[]
  sentences: Sentence[]
  verbs: Verb[]
  weeklyStats: WeekStat[]
  monthComparison: MonthComparison
  actions: ServerActions
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = ["Stats", "Taxonomies", "Add content", "Words", "Sentences", "Verbs"] as const
type Tab = (typeof TABS)[number]

// ── Helpers ──────────────────────────────────────────────────────────────────

function matches(q: string, ...fields: (string | null | undefined)[]): boolean {
  const lq = q.toLowerCase()
  return fields.some(f => f?.toLowerCase().includes(lq))
}

// ── Sub-panels ───────────────────────────────────────────────────────────────

function EmailToolsPanel() {
  const [streakState, setStreakState] = useState<StreakMailResult | null>(null)
  const [verbState, setVerbState]     = useState<boolean | null>(null)
  const [streakBusy, setStreakBusy]   = useState(false)
  const [verbBusy, setVerbBusy]       = useState(false)

  async function triggerStreak() {
    setStreakBusy(true)
    setStreakState(null)
    const res = await adminTriggerStreakMailAction()
    setStreakState(res)
    setStreakBusy(false)
  }

  async function triggerVerb() {
    setVerbBusy(true)
    setVerbState(null)
    const res = await adminTriggerVerbOfDayAction()
    setVerbState(res.sent)
    setVerbBusy(false)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Mail className="w-4.5 h-4.5 text-slate-500" />
        <h2 className="font-bold text-slate-900">Email tools</h2>
        <span className="text-xs text-slate-400 ml-1">— sends to your account only</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Streak mail */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-slate-800">Streak reminder</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sends only if you haven't trained today — same logic as the real cron, without the time check.
          </p>
          <button
            onClick={triggerStreak}
            disabled={streakBusy}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100 disabled:opacity-50 transition"
          >
            <SendHorizonal className="w-3.5 h-3.5" />
            {streakBusy ? "Sending…" : "Send streak mail"}
          </button>
          {streakState && (
            streakState.reason === "sent"
              ? <p className="text-xs font-semibold text-emerald-600">✓ Streak mail sent</p>
              : streakState.reason === "streak_done"
              ? <p className="text-xs font-semibold text-sky-600">— Not sent · streak already done today</p>
              : <p className="text-xs font-semibold text-slate-400">— Not sent · streak mail not enabled</p>
          )}
        </div>

        {/* Verb of the day */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-violet-500" />
            <p className="text-sm font-semibold text-slate-800">Verb of the day</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Always sends today's verb regardless of whether it was already sent today.
          </p>
          <button
            onClick={triggerVerb}
            disabled={verbBusy}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-100 disabled:opacity-50 transition"
          >
            <SendHorizonal className="w-3.5 h-3.5" />
            {verbBusy ? "Sending…" : "Send verb mail"}
          </button>
          {verbState !== null && (
            verbState
              ? <p className="text-xs font-semibold text-emerald-600">✓ Verb of the day sent</p>
              : <p className="text-xs font-semibold text-rose-500">✗ Failed — no verbs in database?</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 800, H = 140, BAR_GAP = 6
  const barW = (W - BAR_GAP * (data.length - 1)) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ display: "block" }}>
      {data.map((d, i) => {
        const barH = Math.max(3, (d.value / max) * H)
        const x = i * (barW + BAR_GAP)
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={13} fontWeight="600" fill="#475569">{d.value}</text>
            )}
            <text x={x + barW / 2} y={H + 20} textAnchor="middle" fontSize={12} fill="#94a3b8">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00Z")
  const thu = new Date(d); thu.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const jan1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1))
  return Math.ceil((((thu.getTime() - jan1.getTime()) / 86400000) + 1) / 7)
}

function trendColor(projected: number, last: number) {
  if (last === 0) return { text: "text-emerald-600", bg: "bg-emerald-50", arrow: "↑" }
  const ratio = projected / last
  if (ratio >= 1.05) return { text: "text-emerald-600", bg: "bg-emerald-50",  arrow: "↑" }
  if (ratio >= 0.95) return { text: "text-amber-600",   bg: "bg-amber-50",    arrow: "→" }
  return                     { text: "text-rose-600",    bg: "bg-rose-50",     arrow: "↓" }
}

function MonthRecap({ monthComparison: mc }: { monthComparison: MonthComparison }) {
  const metrics = [
    { label: "New users",    lastVal: mc.last.newUsers,    projVal: mc.projected.newUsers    },
    { label: "Active users", lastVal: mc.last.activeUsers, projVal: mc.projected.activeUsers },
    { label: "Answers",      lastVal: mc.last.answers,     projVal: mc.projected.answers     },
  ]
  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map(({ label, lastVal, projVal }) => {
        const { text, bg, arrow } = trendColor(projVal, lastVal)
        return (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">{label} · {mc.lastMonthName}</p>
            <p className="text-3xl font-extrabold text-slate-900 leading-none mb-3">{lastVal.toLocaleString()}</p>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${bg}`}>
              <span className={`text-sm font-bold ${text}`}>{arrow} {projVal.toLocaleString()}</span>
              <span className={`text-xs font-medium ${text} opacity-80`}>est. {mc.thisMonthName}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{mc.daysElapsed} of {mc.daysInMonth} days in</p>
          </div>
        )
      })}
    </div>
  )
}

function GrowthCharts({ weeklyStats }: { weeklyStats: WeekStat[] }) {

  const charts = [
    { title: "New users",    sub: "per week · last 12 weeks", key: "newUsers"    as const, color: "#7c3aed" },
    { title: "Answers",      sub: "per week · last 12 weeks", key: "answers"     as const, color: "#0ea5e9" },
    { title: "Active users", sub: "per week · last 12 weeks", key: "activeUsers" as const, color: "#10b981" },
  ]

  return (
    <div className="space-y-4">
      {charts.map(({ title, sub, key, color }) => {
        const data = weeklyStats.map(w => ({ label: `#${isoWeek(w.week)}`, value: w[key] }))
        const total = data.reduce((s, d) => s + d.value, 0)
        return (
          <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 pt-5 pb-4">
            <div className="flex items-baseline gap-3 mb-4">
              <p className="text-base font-bold text-slate-800">{title}</p>
              <p className="text-xs text-slate-400">{sub}</p>
              <p className="ml-auto text-2xl font-extrabold text-slate-900">{total.toLocaleString()}</p>
            </div>
            <BarChart data={data} color={color} />
          </div>
        )
      })}
    </div>
  )
}

function StatsPanel({ stats, weeklyStats, monthComparison }: { stats: Stats; weeklyStats: WeekStat[]; monthComparison: MonthComparison }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/users" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md hover:border-violet-100 transition-all group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-500 bg-violet-50 group-hover:bg-violet-100 transition-colors"><Users className="w-4.5 h-4.5" /></div>
          <p className="text-2xl font-extrabold text-slate-900 leading-none mt-2">{stats.totalUsers}</p>
          <p className="text-xs font-semibold text-slate-500">Total users</p>
          <p className="text-xs text-slate-400">{[stats.srCount > 0 && `${stats.srCount} SR`, stats.hrCount > 0 && `${stats.hrCount} HR`, stats.enCount > 0 && `${stats.enCount} EN`].filter(Boolean).join(" · ")}</p>
        </Link>
        {[
          { icon: Activity,     color: "text-emerald-500 bg-emerald-50", label: "Active today",  value: stats.activeTodayCount,           sub: `${stats.activeWeekCount} this week` },
          { icon: CheckCircle2, color: "text-sky-500 bg-sky-50",         label: "Answers today", value: stats.answersToday.toLocaleString(), sub: `${stats.answersWeek.toLocaleString()} this week` },
          { icon: Flame,        color: "text-amber-500 bg-amber-50",     label: "Best streak",   value: `${stats.bestStreak}d`,           sub: `${stats.answersTotal.toLocaleString()} answers total` },
        ].map(({ icon: Icon, color, label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4.5 h-4.5" /></div>
            <p className="text-2xl font-extrabold text-slate-900 leading-none mt-2">{value}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <MonthRecap monthComparison={monthComparison} />

      <GrowthCharts weeklyStats={weeklyStats} />

      <EmailToolsPanel />
    </div>
  )
}

function TaxonomiesPanel({ categories, levels, actions }: { categories: Category[]; levels: Level[]; actions: ServerActions }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4.5 h-4.5 text-slate-500" />
          <h2 className="font-bold text-slate-900">Categories</h2>
          <span className="ml-auto text-sm text-slate-400">{categories.length}</span>
        </div>
        <AddNamedItem label="Category" placeholder="e.g. Food, Travel…" action={actions.addCategoryAction} accent="violet" />
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-violet-50 text-violet-700 text-sm font-medium rounded-full">
                {c.name}
                <form action={actions.deleteCategoryAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-violet-200 text-violet-400 hover:text-violet-700 transition-colors text-xs leading-none"
                    title={`Delete ${c.name}`}
                  >×</button>
                </form>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4.5 h-4.5 text-slate-500" />
          <h2 className="font-bold text-slate-900">Levels</h2>
          <span className="ml-auto text-sm text-slate-400">{levels.length}</span>
        </div>
        <AddNamedItem label="Level" placeholder="e.g. Beginner, A1…" action={actions.addLevelAction} accent="sky" />
        {levels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {levels.map(l => (
              <span key={l.id} className="px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full">
                {l.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AddContentPanel({ categories, levels }: { categories: Category[]; levels: Level[] }) {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4">Add single item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AddItemForm type="words" categories={categories} levels={levels} />
          <AddItemForm type="sentences" categories={categories} levels={levels} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4">Bulk import</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CsvUpload type="words" />
          <CsvUpload type="sentences" />
        </div>
      </div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
      />
    </div>
  )
}

function FilterSelect({
  value, onChange, options, placeholder, accent = "violet",
}: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string; accent?: "violet" | "sky"
}) {
  const ring = accent === "violet" ? "focus:ring-violet-300 focus:border-violet-400" : "focus:ring-sky-300 focus:border-sky-400"
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`py-2.5 pl-3.5 pr-8 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 transition appearance-none cursor-pointer ${ring}`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ── Shared modal primitives ───────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <td className="px-3 py-3 text-right whitespace-nowrap">
      <button
        onClick={onEdit}
        title="Edit"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
        </svg>
      </button>
    </td>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({
  label, onConfirm, onCancel, busy,
}: { label: string; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  const [text, setText] = useState("")
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-1">Delete</p>
        <h3 className="text-xl font-extrabold text-slate-900 mb-1">Are you sure?</h3>
        <p className="text-sm text-slate-500 mb-1">You are about to permanently delete:</p>
        <p className="text-sm font-semibold text-slate-800 bg-slate-50 rounded-xl px-4 py-2.5 mb-5 break-words">{label}</p>
        <p className="text-sm text-slate-500 mb-2">Type <span className="font-mono font-bold text-slate-800">DELETE</span> to confirm:</p>
        <input
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="DELETE"
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 mb-5 transition"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={text !== "DELETE" || busy}
            className="flex-1 py-2.5 rounded-2xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ── Edit modal & confirm diff ─────────────────────────────────────────────────

type WordForm     = { english: string; serbian: string; croatian: string; serbianFemale: string; croatianFemale: string; categoryId: string }
type SentenceForm = WordForm & { levelId: string }

function DiffRow({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after
  return (
    <div className={`rounded-xl px-4 py-2.5 ${changed ? "bg-amber-50 border border-amber-100" : "bg-slate-50"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      {changed ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs line-through text-slate-400">{before || "—"}</p>
          <p className="text-sm font-semibold text-slate-900">{after || "—"}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{before || "—"}</p>
      )}
    </div>
  )
}

function EditWordModal({
  item, categories, onSave, onCancel,
}: {
  item: Word; categories: Category[]
  onSave: (updated: Word) => void; onCancel: () => void
}) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const [form, setForm] = useState<WordForm>({
    english: item.english, serbian: item.serbian, croatian: item.croatian,
    serbianFemale: item.serbianFemale ?? "", croatianFemale: item.croatianFemale ?? "",
    categoryId: item.categoryId != null ? String(item.categoryId) : "",
  })
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof WordForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleConfirm() {
    setBusy(true)
    const data = {
      english: form.english.trim(), serbian: form.serbian.trim(), croatian: form.croatian.trim(),
      serbianFemale: form.serbianFemale.trim() || null,
      croatianFemale: form.croatianFemale.trim() || null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
    }
    await updateWordAction(item.id, data)
    onSave({ ...item, ...data })
  }

  const newCatLabel = form.categoryId ? (catMap[parseInt(form.categoryId)] ?? "—") : "—"
  const oldCatLabel = item.categoryId ? (catMap[item.categoryId] ?? "—") : "—"

  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="p-7 max-h-[90vh] overflow-y-auto">
        {!confirming ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Edit word</p>
            <h3 className="text-xl font-extrabold text-slate-900 mb-5">{item.english}</h3>
            <div className="space-y-3 mb-6">
              {(["english", "serbian", "croatian"] as const).map(k => (
                <div key={k}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block capitalize">{k}</label>
                  <input value={form[k]} onChange={set(k)} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition" />
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 mb-2">Female forms <span className="text-slate-400 font-normal normal-case">(optional — leave blank if same as above)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Serbian ♀</label>
                    <input value={form.serbianFemale} onChange={set("serbianFemale")} placeholder="e.g. umorna" className="w-full px-4 py-2.5 rounded-2xl border border-rose-100 bg-rose-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Croatian ♀</label>
                    <input value={form.croatianFemale} onChange={set("croatianFemale")} placeholder="e.g. umorna" className="w-full px-4 py-2.5 rounded-2xl border border-rose-100 bg-rose-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                <select value={form.categoryId} onChange={set("categoryId")} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition appearance-none">
                  <option value="">— none —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => setConfirming(true)} className="flex-1 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">Review changes</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Confirm changes</p>
            <h3 className="text-xl font-extrabold text-slate-900 mb-5">Review before saving</h3>
            <div className="space-y-2 mb-6">
              <DiffRow label="English"        before={item.english}              after={form.english.trim()} />
              <DiffRow label="Serbian"        before={item.serbian}              after={form.serbian.trim()} />
              <DiffRow label="Serbian ♀"      before={item.serbianFemale ?? ""}  after={form.serbianFemale.trim()} />
              <DiffRow label="Croatian"       before={item.croatian}             after={form.croatian.trim()} />
              <DiffRow label="Croatian ♀"     before={item.croatianFemale ?? ""} after={form.croatianFemale.trim()} />
              <DiffRow label="Category"       before={oldCatLabel}               after={newCatLabel} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">← Back</button>
              <button onClick={handleConfirm} disabled={busy} className="flex-1 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition">{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </>
        )}
      </div>
    </ModalBackdrop>
  )
}

function EditSentenceModal({
  item, categories, levels, onSave, onCancel,
}: {
  item: Sentence; categories: Category[]; levels: Level[]
  onSave: (updated: Sentence) => void; onCancel: () => void
}) {
  const catMap   = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const levelMap = Object.fromEntries(levels.map(l => [l.id, l.name]))
  const [form, setForm] = useState<SentenceForm>({
    english: item.english, serbian: item.serbian, croatian: item.croatian,
    serbianFemale: item.serbianFemale ?? "", croatianFemale: item.croatianFemale ?? "",
    categoryId: item.categoryId != null ? String(item.categoryId) : "",
    levelId:    item.levelId    != null ? String(item.levelId)    : "",
  })
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof SentenceForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleConfirm() {
    setBusy(true)
    const data = {
      english: form.english.trim(), serbian: form.serbian.trim(), croatian: form.croatian.trim(),
      serbianFemale: form.serbianFemale.trim() || null,
      croatianFemale: form.croatianFemale.trim() || null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      levelId:    form.levelId    ? parseInt(form.levelId)    : null,
    }
    await updateSentenceAction(item.id, data)
    onSave({ ...item, ...data })
  }

  const newCatLabel   = form.categoryId ? (catMap[parseInt(form.categoryId)]     ?? "—") : "—"
  const oldCatLabel   = item.categoryId ? (catMap[item.categoryId]               ?? "—") : "—"
  const newLevelLabel = form.levelId    ? (levelMap[parseInt(form.levelId)]      ?? "—") : "—"
  const oldLevelLabel = item.levelId    ? (levelMap[item.levelId]                ?? "—") : "—"

  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="p-7 max-h-[90vh] overflow-y-auto">
        {!confirming ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Edit sentence</p>
            <h3 className="text-xl font-extrabold text-slate-900 mb-5 leading-snug">{item.english}</h3>
            <div className="space-y-3 mb-6">
              {(["english", "serbian", "croatian"] as const).map(k => (
                <div key={k}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block capitalize">{k}</label>
                  <input value={form[k]} onChange={set(k)} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition" />
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 mb-2">Female forms <span className="text-slate-400 font-normal normal-case">(optional — leave blank if same as above)</span></p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Serbian ♀</label>
                    <input value={form.serbianFemale} onChange={set("serbianFemale")} placeholder="Female version of the Serbian sentence…" className="w-full px-4 py-2.5 rounded-2xl border border-rose-100 bg-rose-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Croatian ♀</label>
                    <input value={form.croatianFemale} onChange={set("croatianFemale")} placeholder="Female version of the Croatian sentence…" className="w-full px-4 py-2.5 rounded-2xl border border-rose-100 bg-rose-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                <select value={form.categoryId} onChange={set("categoryId")} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition appearance-none">
                  <option value="">— none —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Level</label>
                <select value={form.levelId} onChange={set("levelId")} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition appearance-none">
                  <option value="">— none —</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => setConfirming(true)} className="flex-1 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">Review changes</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Confirm changes</p>
            <h3 className="text-xl font-extrabold text-slate-900 mb-5">Review before saving</h3>
            <div className="space-y-2 mb-6">
              <DiffRow label="English"    before={item.english}              after={form.english.trim()} />
              <DiffRow label="Serbian"    before={item.serbian}              after={form.serbian.trim()} />
              <DiffRow label="Serbian ♀"  before={item.serbianFemale ?? ""}  after={form.serbianFemale.trim()} />
              <DiffRow label="Croatian"   before={item.croatian}             after={form.croatian.trim()} />
              <DiffRow label="Croatian ♀" before={item.croatianFemale ?? ""} after={form.croatianFemale.trim()} />
              <DiffRow label="Category"   before={oldCatLabel}               after={newCatLabel} />
              <DiffRow label="Level"      before={oldLevelLabel}             after={newLevelLabel} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">← Back</button>
              <button onClick={handleConfirm} disabled={busy} className="flex-1 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition">{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </>
        )}
      </div>
    </ModalBackdrop>
  )
}

// ── Words panel ───────────────────────────────────────────────────────────────

function WordsPanel({ words: initialWords, categories }: { words: Word[]; categories: Category[] }) {
  const [items, setItems] = useState(initialWords)
  const [q, setQ]         = useState("")
  const [cat, setCat]     = useState("")
  const [editing, setEditing]   = useState<Word | null>(null)
  const [deleting, setDeleting] = useState<Word | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const filtered = items.filter(w =>
    (q.trim() === "" || matches(q, w.english, w.serbian, w.croatian)) &&
    (cat === "" || w.categoryId === parseInt(cat))
  )

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    await deleteWordAction(deleting.id)
    setItems(prev => prev.filter(w => w.id !== deleting.id))
    setDeleting(null)
    setDeleteBusy(false)
  }

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search English, Serbian or Croatian…" /></div>
        <FilterSelect value={cat} onChange={setCat} options={categories.map(c => ({ value: String(c.id), label: c.name }))} placeholder="All categories" accent="violet" />
      </div>
      <p className="text-xs text-slate-400 mb-3">
        {filtered.length === items.length ? `${items.length} words` : `${filtered.length} of ${items.length} words`}
      </p>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
              <th className="px-3 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No results</td></tr>
            ) : filtered.map(w => (
              <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5 font-medium text-slate-900">{w.english}</td>
                <td className="px-5 py-3.5 text-slate-600">
                  {w.serbian}
                  {w.serbianFemale && <span className="ml-1.5 text-[10px] font-bold text-rose-400 bg-rose-50 px-1 py-0.5 rounded" title={`Female: ${w.serbianFemale}`}>♀</span>}
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  {w.croatian}
                  {w.croatianFemale && <span className="ml-1.5 text-[10px] font-bold text-rose-400 bg-rose-50 px-1 py-0.5 rounded" title={`Female: ${w.croatianFemale}`}>♀</span>}
                </td>
                <td className="px-5 py-3.5">
                  {w.categoryId
                    ? <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">{catMap[w.categoryId] ?? "—"}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <RowActions onEdit={() => setEditing(w)} onDelete={() => setDeleting(w)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditWordModal
          item={editing} categories={categories}
          onSave={updated => { setItems(prev => prev.map(w => w.id === updated.id ? updated : w)); setEditing(null) }}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteModal
          label={`${deleting.english} / ${deleting.serbian} / ${deleting.croatian}`}
          onConfirm={handleDelete} onCancel={() => setDeleting(null)} busy={deleteBusy}
        />
      )}
    </div>
  )
}

// ── Sentences panel ───────────────────────────────────────────────────────────

function SentencesPanel({ sentences: initialSentences, categories, levels }: { sentences: Sentence[]; categories: Category[]; levels: Level[] }) {
  const [items, setItems] = useState(initialSentences)
  const [q, setQ]         = useState("")
  const [cat, setCat]     = useState("")
  const [lvl, setLvl]     = useState("")
  const [editing, setEditing]   = useState<Sentence | null>(null)
  const [deleting, setDeleting] = useState<Sentence | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const catMap   = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const levelMap = Object.fromEntries(levels.map(l => [l.id, l.name]))
  const filtered = items.filter(s =>
    (q.trim() === "" || matches(q, s.english, s.serbian, s.croatian)) &&
    (cat === "" || s.categoryId === parseInt(cat)) &&
    (lvl === "" || s.levelId === parseInt(lvl))
  )

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    await deleteSentenceAction(deleting.id)
    setItems(prev => prev.filter(s => s.id !== deleting.id))
    setDeleting(null)
    setDeleteBusy(false)
  }

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search English, Serbian or Croatian…" /></div>
        <FilterSelect value={cat} onChange={setCat} options={categories.map(c => ({ value: String(c.id), label: c.name }))} placeholder="All categories" accent="violet" />
        <FilterSelect value={lvl} onChange={setLvl} options={levels.map(l => ({ value: String(l.id), label: l.name }))} placeholder="All levels" accent="sky" />
      </div>
      <p className="text-xs text-slate-400 mb-3">
        {filtered.length === items.length ? `${items.length} sentences` : `${filtered.length} of ${items.length} sentences`}
      </p>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Level</th>
              <th className="px-3 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No results</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5 font-medium text-slate-900">{s.english}</td>
                <td className="px-5 py-3.5 text-slate-600">
                  {s.serbian}
                  {s.serbianFemale && <span className="ml-1.5 text-[10px] font-bold text-rose-400 bg-rose-50 px-1 py-0.5 rounded" title={`Female: ${s.serbianFemale}`}>♀</span>}
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  {s.croatian}
                  {s.croatianFemale && <span className="ml-1.5 text-[10px] font-bold text-rose-400 bg-rose-50 px-1 py-0.5 rounded" title={`Female: ${s.croatianFemale}`}>♀</span>}
                </td>
                <td className="px-5 py-3.5">
                  {s.categoryId
                    ? <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">{catMap[s.categoryId] ?? "—"}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {s.levelId
                    ? <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-full">{levelMap[s.levelId] ?? "—"}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <RowActions onEdit={() => setEditing(s)} onDelete={() => setDeleting(s)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditSentenceModal
          item={editing} categories={categories} levels={levels}
          onSave={updated => { setItems(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditing(null) }}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteModal
          label={`${deleting.english} / ${deleting.serbian} / ${deleting.croatian}`}
          onConfirm={handleDelete} onCancel={() => setDeleting(null)} busy={deleteBusy}
        />
      )}
    </div>
  )
}

// ── VerbsPanel ───────────────────────────────────────────────────────────────

function VerbsPanel({ verbs }: { verbs: Verb[] }) {
  const [items, setItems]         = useState(verbs)
  const [addState, addAction, addPending] = useActionState(addVerbAction, undefined)
  const [examples, setExamples]   = useState([{ serbian: "", english: "" }])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Clear form on success
  const formRef = useState<HTMLFormElement | null>(null)

  async function handleDelete(id: number) {
    setDeleteBusy(true)
    const res = await deleteVerbAction(id)
    if (!res.error) setItems(prev => prev.filter(v => v.id !== id))
    setDeletingId(null)
    setDeleteBusy(false)
  }

  const srFields: [string, string][] = [
    ["ja", "Ja"], ["ti", "Ti"], ["onOna", "On / Ona"], ["mi", "Mi"], ["vi", "Vi"], ["oni", "Oni / One"],
  ]
  const hrFields: [string, string][] = [
    ["jaHr", "Ja"], ["tiHr", "Ti"], ["onOnaHr", "On / Ona"], ["miHr", "Mi"], ["viHr", "Vi"], ["oniHr", "Oni / One"],
  ]
  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="space-y-8">
      {/* CSV import */}
      <VerbCsvUpload />

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Add verb manually</h3>
        <form action={addAction} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Serbian infinitive</label>
              <input name="infinitive" required placeholder="piti" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Croatian infinitive <span className="font-normal text-slate-400">(if different)</span></label>
              <input name="infinitiveHr" placeholder="piti" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">English</label>
              <input name="translation" required placeholder="to drink" className={inputCls} />
            </div>
          </div>

          {/* Conjugations side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">Serbian</p>
              <div className="grid grid-cols-2 gap-2">
                {srFields.map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                    <input name={field} required placeholder={label.toLowerCase()} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wide mb-2">Croatian <span className="font-normal normal-case text-slate-400">(leave blank if same)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {hrFields.map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                    <input name={field} placeholder={label.toLowerCase()} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Example sentences</label>
              <button type="button" onClick={() => setExamples(e => [...e, { serbian: "", english: "" }])}
                className="text-xs text-violet-600 font-semibold hover:text-violet-800">+ Add example</button>
            </div>
            <div className="space-y-2">
              {examples.map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input name={`example_serbian_${i}`} placeholder="Serbian sentence" className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <input name={`example_croatian_${i}`} placeholder="Croatian (if different)" className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                  <input name={`example_english_${i}`} placeholder="English translation" className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {addState?.error && <p className="text-sm text-rose-600">{addState.error}</p>}
            {addState?.success && <p className="text-sm text-emerald-600 font-semibold">Verb added ✓</p>}
            <button type="submit" disabled={addPending}
              className="ml-auto px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition">
              {addPending ? "Saving…" : "Add verb"}
            </button>
          </div>
        </form>
      </div>

      {/* Verb list */}
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-400">No verbs yet.</p>}
        {items.map((v, idx) => {
          const examples: VerbExample[] = JSON.parse(v.examplesJson || "[]")
          const srConj = [["Ja", v.ja], ["Ti", v.ti], ["On/Ona", v.onOna], ["Mi", v.mi], ["Vi", v.vi], ["Oni", v.oni]]
          const hrConj = [["Ja", v.jaHr], ["Ti", v.tiHr], ["On/Ona", v.onOnaHr], ["Mi", v.miHr], ["Vi", v.viHr], ["Oni", v.oniHr]]
          const hasCroatian = hrConj.some(([, f]) => f)
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-bold text-slate-900">{v.infinitive}</span>
                    {v.infinitiveHr && <span className="text-sm text-sky-600 font-medium">/ {v.infinitiveHr}</span>}
                    <span className="text-sm text-slate-500">— {v.translation}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
                      <span className="text-xs font-semibold text-violet-500 mr-1">SR</span>
                      {srConj.map(([p, f]) => (
                        <span key={p}><span className="text-slate-400">{p} </span>{f}</span>
                      ))}
                    </div>
                    {hasCroatian && (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
                        <span className="text-xs font-semibold text-sky-500 mr-1">HR</span>
                        {hrConj.map(([p, f]) => (
                          <span key={p}><span className="text-slate-400">{p} </span>{f || <span className="text-slate-300">= SR</span>}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {examples.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {examples.map((ex, i) => (
                        <p key={i} className="text-xs text-slate-500 italic">
                          "{ex.serbian}"{ex.croatian ? ` / "${ex.croatian}"` : ""} — {ex.english}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setDeletingId(v.id)}
                  className="text-slate-300 hover:text-rose-500 transition flex-shrink-0 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {deletingId !== null && (
        <DeleteModal
          label={items.find(v => v.id === deletingId)?.infinitive ?? ""}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          busy={deleteBusy}
        />
      )}
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export function AdminTabs({ stats, categories, levels, words, sentences, verbs, weeklyStats, monthComparison, actions }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Stats")

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-max px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel */}
      {activeTab === "Stats"       && <StatsPanel stats={stats} weeklyStats={weeklyStats} monthComparison={monthComparison} />}
      {activeTab === "Taxonomies"  && <TaxonomiesPanel categories={categories} levels={levels} actions={actions} />}
      {activeTab === "Add content" && <AddContentPanel categories={categories} levels={levels} />}
      {activeTab === "Words"       && <WordsPanel words={words} categories={categories} />}
      {activeTab === "Sentences"   && <SentencesPanel sentences={sentences} categories={categories} levels={levels} />}
      {activeTab === "Verbs"       && <VerbsPanel verbs={verbs} />}
    </>
  )
}
