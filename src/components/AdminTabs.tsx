"use client"

import { useState } from "react"
import { AddItemForm } from "./AddItemForm"
import { AddNamedItem } from "./AddNamedItem"
import { CsvUpload } from "./CsvUpload"

// ── Types ────────────────────────────────────────────────────────────────────

type Category  = { id: number; name: string }
type Level     = { id: number; name: string }
type Word      = { id: number; english: string; serbian: string; croatian: string; categoryId: number | null }
type Sentence  = { id: number; english: string; serbian: string; croatian: string; categoryId: number | null; levelId: number | null }
type UserRow   = {
  id: number; email: string; firstName: string | null; language: string
  createdAt: Date | null; lastActive: string | null; streak: number; totalAnswers: number
}
type Stats = {
  totalUsers: number; srCount: number; hrCount: number
  activeTodayCount: number; activeWeekCount: number
  answersToday: number; answersWeek: number; answersTotal: number
  bestStreak: number
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
  userRows: UserRow[]
  categories: Category[]
  levels: Level[]
  words: Word[]
  sentences: Sentence[]
  actions: ServerActions
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = ["Stats", "Taxonomies", "Add content", "Words", "Sentences"] as const
type Tab = (typeof TABS)[number]

// ── Helpers ──────────────────────────────────────────────────────────────────

function matches(q: string, ...fields: (string | null | undefined)[]): boolean {
  const lq = q.toLowerCase()
  return fields.some(f => f?.toLowerCase().includes(lq))
}

// ── Sub-panels ───────────────────────────────────────────────────────────────

function StatsPanel({ stats, userRows }: { stats: Stats; userRows: UserRow[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: "👥", label: "Total users",   value: stats.totalUsers,                sub: `${stats.srCount} SR · ${stats.hrCount} HR` },
          { icon: "🟢", label: "Active today",  value: stats.activeTodayCount,          sub: `${stats.activeWeekCount} this week` },
          { icon: "✅", label: "Answers today", value: stats.answersToday.toLocaleString(), sub: `${stats.answersWeek.toLocaleString()} this week` },
          { icon: "🔥", label: "Best streak",   value: `${stats.bestStreak}d`,          sub: `${stats.answersTotal.toLocaleString()} answers total` },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-none mt-2">{value}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

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
    </div>
  )
}

function TaxonomiesPanel({ categories, levels, actions }: { categories: Category[]; levels: Level[]; actions: ServerActions }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏷️</span>
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
          <span className="text-xl">📊</span>
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
    <div className="relative mb-5">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">🔍</span>
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

function WordsPanel({ words, categories }: { words: Word[]; categories: Category[] }) {
  const [q, setQ] = useState("")
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const filtered = q.trim() === "" ? words : words.filter(w => matches(q, w.english, w.serbian, w.croatian))

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search English, Serbian or Croatian…" />
      <p className="text-xs text-slate-400 mb-3">
        {filtered.length === words.length ? `${words.length} words` : `${filtered.length} of ${words.length} words`}
      </p>
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
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No results</td></tr>
            ) : filtered.map(w => (
              <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900">{w.english}</td>
                <td className="px-5 py-3.5 text-slate-600">{w.serbian}</td>
                <td className="px-5 py-3.5 text-slate-600">{w.croatian}</td>
                <td className="px-5 py-3.5">
                  {w.categoryId
                    ? <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">{catMap[w.categoryId] ?? "—"}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SentencesPanel({ sentences, categories, levels }: { sentences: Sentence[]; categories: Category[]; levels: Level[] }) {
  const [q, setQ] = useState("")
  const catMap   = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const levelMap = Object.fromEntries(levels.map(l => [l.id, l.name]))
  const filtered = q.trim() === "" ? sentences : sentences.filter(s => matches(q, s.english, s.serbian, s.croatian))

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search English, Serbian or Croatian…" />
      <p className="text-xs text-slate-400 mb-3">
        {filtered.length === sentences.length ? `${sentences.length} sentences` : `${filtered.length} of ${sentences.length} sentences`}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No results</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900">{s.english}</td>
                <td className="px-5 py-3.5 text-slate-600">{s.serbian}</td>
                <td className="px-5 py-3.5 text-slate-600">{s.croatian}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export function AdminTabs({ stats, userRows, categories, levels, words, sentences, actions }: AdminTabsProps) {
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
      {activeTab === "Stats"       && <StatsPanel stats={stats} userRows={userRows} />}
      {activeTab === "Taxonomies"  && <TaxonomiesPanel categories={categories} levels={levels} actions={actions} />}
      {activeTab === "Add content" && <AddContentPanel categories={categories} levels={levels} />}
      {activeTab === "Words"       && <WordsPanel words={words} categories={categories} />}
      {activeTab === "Sentences"   && <SentencesPanel sentences={sentences} categories={categories} levels={levels} />}
    </>
  )
}
