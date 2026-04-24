"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Category = { id: number; name: string }

export function CategoryTags({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<Category | null>(null)
  const router = useRouter()

  if (categories.length === 0) return null

  function go(type: "words" | "sentences") {
    if (!selected) return
    setSelected(null)
    router.push(`/study/${type}?category=${selected.id}`)
  }

  return (
    <>
      {/* ── Tag list ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Train by category
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat)}
              className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all active:scale-[0.97]"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Category
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900">{selected.name}</h3>
              <p className="text-slate-500 text-sm mt-1">What would you like to practise?</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => go("words")}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-violet-100 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-all active:scale-[0.97]"
              >
                <span className="text-3xl">📖</span>
                <span className="font-bold text-violet-700 text-sm">Words</span>
              </button>
              <button
                onClick={() => go("sentences")}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-fuchsia-100 bg-fuchsia-50 hover:border-fuchsia-400 hover:bg-fuchsia-100 transition-all active:scale-[0.97]"
              >
                <span className="text-3xl">💬</span>
                <span className="font-bold text-fuchsia-700 text-sm">Sentences</span>
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
