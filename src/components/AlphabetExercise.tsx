"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Volume2, Lightbulb } from "lucide-react"
import { SR_PHONETICS } from "@/lib/alphabet-phonetics"

type Word = { id: number; display: string; translation: string }

type Props = {
  alphabet: string[]
  letterMap: Record<string, Word[]>
  langName: string
  isEnglishLearner: boolean
}

/** Highlight the starting letter(s) within a word */
function HighlightedWord({ word, letter }: { word: string; letter: string }) {
  const len = letter.length
  if (word.toLowerCase().startsWith(letter.toLowerCase())) {
    return (
      <span className="font-bold text-slate-900 text-lg">
        <span className="text-violet-600">{word.slice(0, len)}</span>{word.slice(len)}
      </span>
    )
  }
  return <span className="font-bold text-slate-900 text-lg">{word}</span>
}

export function AlphabetExercise({ alphabet, letterMap, langName, isEnglishLearner }: Props) {
  const [idx, setIdx] = useState(0)
  const chipRef       = useRef<HTMLButtonElement | null>(null)
  const scrollRef     = useRef<HTMLDivElement>(null)

  const letter = alphabet[idx]
  const words  = letterMap[letter] ?? []

  // Scroll the active chip into view when the letter changes
  useEffect(() => {
    chipRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [idx])

  function prev() { if (idx > 0) setIdx(i => i - 1) }
  function next() { if (idx < alphabet.length - 1) setIdx(i => i + 1) }

  return (
    <div className="space-y-5">
      {/* Letter chip strip */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {alphabet.map((l, i) => (
          <button
            key={l}
            ref={i === idx ? chipRef : undefined}
            onClick={() => setIdx(i)}
            className={`shrink-0 w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              i === idx
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Main letter card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Letter hero */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-10 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
              {langName} alphabet · {idx + 1} of {alphabet.length}
            </p>
            <p className="text-white font-extrabold leading-none" style={{ fontSize: "6rem" }}>
              {letter}
            </p>
            <p className="text-white/60 text-sm mt-2 font-medium">
              {words.length === 0
                ? "No words yet"
                : `${words.length} word${words.length !== 1 ? "s" : ""} in library`}
            </p>
          </div>

          <button
            onClick={next}
            disabled={idx === alphabet.length - 1}
            className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pronunciation guide — Slavic learners only */}
        {!isEnglishLearner && SR_PHONETICS[letter] && (() => {
          const p = SR_PHONETICS[letter]
          return (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              <div className="flex items-start gap-3 px-6 py-4">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pronunciation</p>
                  <p className="text-sm text-slate-700">{p.sounds}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-6 py-4">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Think of</p>
                  <p className="text-sm text-slate-700">{p.think}</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Words list */}
        <div className="divide-y divide-slate-50">
          {words.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-400 text-sm">No words starting with <strong>{letter}</strong> in the library yet.</p>
            </div>
          ) : (
            words.map(w => (
              <div key={w.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                <HighlightedWord word={w.display} letter={letter} />
                <span className="text-slate-400 text-sm ml-4 text-right">{w.translation}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex gap-3">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> {idx > 0 ? alphabet[idx - 1] : ""}
        </button>
        <button
          onClick={next}
          disabled={idx === alphabet.length - 1}
          className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
        >
          {idx < alphabet.length - 1 ? alphabet[idx + 1] : ""} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
