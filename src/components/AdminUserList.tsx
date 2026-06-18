"use client"

import { useState, useMemo } from "react"
import { Flame, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

export type AdminUserRow = {
  id: number
  email: string
  firstName: string | null
  language: string
  studyDirection: string
  createdAt: Date | null
  lastActive: string | null
  streak: number
  totalAnswers: number
}

type SortKey = "firstName" | "email" | "language" | "studyDirection" | "createdAt" | "lastActive" | "streak" | "totalAnswers"
type SortDir = "asc" | "desc"


function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline" />
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-violet-500 ml-1 inline" />
    : <ChevronDown className="w-3.5 h-3.5 text-violet-500 ml-1 inline" />
}

export function AdminUserList({ rows }: { rows: AdminUserRow[] }) {
  const [query, setQuery]     = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(u => {
      if (!q) return true
      const langMatch = u.language === q || u.language.includes(q)
      const dirMatch  = (u.studyDirection === "to_english" ? "english" : "serbian croatian").includes(q)
      return (
        (u.firstName?.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        langMatch ||
        dirMatch
      )
    })
  }, [rows, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number | null
      let bv: string | number | null
      switch (sortKey) {
        case "firstName":      av = a.firstName?.toLowerCase() ?? ""; bv = b.firstName?.toLowerCase() ?? ""; break
        case "email":          av = a.email.toLowerCase(); bv = b.email.toLowerCase(); break
        case "language":       av = a.language; bv = b.language; break
        case "studyDirection": av = a.studyDirection; bv = b.studyDirection; break
        case "createdAt":      av = a.createdAt?.toISOString() ?? ""; bv = b.createdAt?.toISOString() ?? ""; break
        case "lastActive":     av = a.lastActive ?? ""; bv = b.lastActive ?? ""; break
        case "streak":         av = a.streak; bv = b.streak; break
        case "totalAnswers":   av = a.totalAnswers; bv = b.totalAnswers; break
        default:               av = 0; bv = 0
      }
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function Th({ col, label, align = "left" }: { col: SortKey; label: string; align?: "left" | "right" }) {
    return (
      <th
        className={`px-4 py-3.5 font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors whitespace-nowrap text-${align}`}
        onClick={() => toggleSort(col)}
      >
        {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </th>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email or language…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
        />
      </div>

      <p className="text-xs text-slate-400">{sorted.length} of {rows.length} users</p>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <Th col="firstName"      label="Name" />
                <Th col="studyDirection" label="Lang" />
                <Th col="createdAt"      label="Joined" />
                <Th col="lastActive"     label="Last active" />
                <Th col="streak"         label="Streak"  align="right" />
                <Th col="totalAnswers"   label="Answers" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users found</td></tr>
              ) : sorted.map(u => {
                const isEN = u.studyDirection === "to_english"
                const langLabel = isEN ? "EN" : u.language.toUpperCase()
                const langStyle = isEN
                  ? "bg-amber-50 text-amber-700"
                  : u.language === "sr" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"
                return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-900">{u.firstName ?? <span className="text-slate-300">—</span>}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${langStyle}`}>
                      {langLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 tabular-nums text-xs">
                    {u.createdAt ? u.createdAt.toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 tabular-nums text-xs">
                    {u.lastActive ?? <span className="text-slate-300">never</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {u.streak > 0
                      ? <span className="font-semibold text-amber-600 inline-flex items-center gap-0.5">{u.streak}d<Flame className="w-3.5 h-3.5" /></span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums">
                    {u.totalAnswers > 0 ? u.totalAnswers.toLocaleString() : <span className="text-slate-300">0</span>}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
