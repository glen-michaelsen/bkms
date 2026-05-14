"use client"

import { useState } from "react"
import { CASES, type GrammarCase } from "@/lib/cases"

function getSentence(ex: GrammarCase["examples"][0], lang: "sr" | "hr") {
  return lang === "hr" && ex.hr ? ex.hr : ex.sr
}

function getQuestion(q: GrammarCase["questions"][0], lang: "sr" | "hr") {
  return lang === "hr" && q.hr ? q.hr : q.sr
}

function getCaseName(c: GrammarCase, lang: "sr" | "hr") {
  return lang === "hr" ? c.hrName : c.srName
}

export function CasesStudy({ language }: { language: "sr" | "hr" }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = CASES[activeIdx]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {CASES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              i === activeIdx
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            <span className="opacity-60 mr-1.5 text-xs">{c.number}.</span>
            {getCaseName(c, language)}
          </button>
        ))}
      </div>

      {/* Case content */}
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">
                Case {active.number} of {CASES.length}
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">{getCaseName(active, language)}</h2>
              <p className="text-slate-400 font-medium mt-0.5">{active.englishName}</p>
            </div>
            <span className="text-5xl font-black text-violet-100 select-none leading-none">
              {active.number}
            </span>
          </div>

          {/* Used for */}
          <div className="mt-5 pt-5 border-t border-slate-50">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Used for</p>
            <ul className="space-y-1.5">
              {active.usedFor.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Prepositions (if any) */}
        {active.prepositions && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Common prepositions</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {active.prepositions.map((p) => (
                <div key={p.prep} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-xl px-3 py-1.5">
                  <span className="font-bold text-violet-700 text-sm">{p.prep}</span>
                  <span className="text-slate-400 text-xs">=</span>
                  <span className="text-slate-600 text-xs">{p.meaning}</span>
                </div>
              ))}
            </div>
            {active.prepositionNote && (
              <p className="text-xs text-slate-500 italic mt-2">{active.prepositionNote}</p>
            )}
          </div>
        )}

        {/* Example sentences */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Example sentences</p>
          <div className="space-y-3">
            {active.examples.map((ex, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4 py-2.5 border-b border-slate-50 last:border-0">
                <p className="font-semibold text-slate-900">{getSentence(ex, language)}</p>
                <p className="text-slate-500 text-sm">→ {ex.english}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Questions + Endings side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Key questions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Key questions</p>
            <div className="space-y-3">
              {active.questions.map((q, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <span className="font-bold text-violet-700 text-sm">{getQuestion(q, language)}</span>
                  <span className="text-slate-500 text-sm text-right">{q.english}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Endings table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Endings</p>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs text-slate-400 font-semibold pb-2 pr-3">Gender</th>
                  <th className="text-center text-xs text-slate-400 font-semibold pb-2 px-2">Singular</th>
                  <th className="text-center text-xs text-slate-400 font-semibold pb-2">Plural</th>
                </tr>
              </thead>
              <tbody>
                {active.endings.map((e, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="text-slate-600 text-xs py-2 pr-3">{e.gender}</td>
                    <td className="text-center font-bold text-violet-700 py-2 px-2">{e.singular}</td>
                    <td className="text-center font-bold text-violet-700 py-2">{e.plural}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {active.endingNote && (
              <p className="text-xs text-slate-400 italic mt-3">{active.endingNote}</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 self-center">{activeIdx + 1} / {CASES.length}</span>
          <button
            onClick={() => setActiveIdx((i) => Math.min(CASES.length - 1, i + 1))}
            disabled={activeIdx === CASES.length - 1}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
