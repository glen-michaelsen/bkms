"use client"

import { useActionState, useState } from "react"
import { saveLevelConfigAction } from "@/app/actions"

type Level = { id: number; name: string }
type Config = { levelId: number; percentage: number }

export function LevelConfig({
  levels,
  initialConfig,
}: {
  levels: Level[]
  initialConfig: Config[]
}) {
  const [state, formAction, pending] = useActionState(saveLevelConfigAction, undefined)

  // Build initial percentages: use saved config or equal split
  const makeInitial = () => {
    if (initialConfig.length > 0) {
      const map = Object.fromEntries(initialConfig.map((c) => [c.levelId, c.percentage]))
      return Object.fromEntries(levels.map((l) => [l.id, map[l.id] ?? 0]))
    }
    // Equal distribution
    if (levels.length === 0) return {}
    const base = Math.floor(100 / levels.length)
    const remainder = 100 - base * levels.length
    return Object.fromEntries(
      levels.map((l, i) => [l.id, i === levels.length - 1 ? base + remainder : base])
    )
  }

  const [pcts, setPcts] = useState<Record<number, number>>(makeInitial)

  const total = Object.values(pcts).reduce((s, v) => s + (v || 0), 0)
  const isValid = total === 100

  if (levels.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No levels created yet. Ask an admin to add levels first.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {levels.map((level) => (
        <div key={level.id} className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700 w-28 shrink-0 truncate">
            {level.name}
          </span>
          <div className="flex-1 relative">
            <div
              className="absolute inset-0 rounded-xl bg-violet-100 transition-all"
              style={{ width: `${Math.min(pcts[level.id] ?? 0, 100)}%` }}
            />
            <input
              name={`pct_${level.id}`}
              type="number"
              min={0}
              max={100}
              value={pcts[level.id] ?? 0}
              onChange={(e) =>
                setPcts((prev) => ({ ...prev, [level.id]: parseInt(e.target.value) || 0 }))
              }
              className="relative z-10 w-full px-4 py-2.5 bg-transparent border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>
          <span className="text-sm font-semibold text-slate-400 w-6 text-right">%</span>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold tabular-nums ${
              isValid ? "text-emerald-600" : total > 100 ? "text-rose-600" : "text-amber-500"
            }`}
          >
            {total}%
          </span>
          <span className="text-sm text-slate-400">
            {isValid ? "✓ Ready to save" : total < 100 ? `— ${100 - total}% remaining` : `— ${total - 100}% over`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state?.error && <p className="text-sm text-rose-600 font-medium">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600 font-semibold">Saved ✓</p>}
          <button
            type="submit"
            disabled={pending || !isValid}
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  )
}
