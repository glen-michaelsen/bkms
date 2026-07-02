"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Trophy, Flame, RotateCcw } from "lucide-react"
import type { HangmanWord } from "@/app/games/hangman/page"

const MAX_WRONG = 6

// Keyboard layouts. Slavic uses the SR/HR Latin alphabet (no q/w/x/y, plus the
// diacritic letters); digraphs dž/lj/nj are typed via their component letters.
const EN_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map(r => r.split(""))
const SR_ROWS = [
  ["A", "B", "C", "Č", "Ć", "D", "Đ", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N", "O", "P", "R"],
  ["S", "Š", "T", "U", "V", "Z", "Ž"],
]

const isLetter = (ch: string) => /\p{L}/u.test(ch)

// ── Hangman drawing ─────────────────────────────────────────────────────────
function Gallows({ wrong }: { wrong: number }) {
  const stroke = "#334155"
  const line = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={4} strokeLinecap="round" />
  )
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56" role="img" aria-label={`${wrong} of ${MAX_WRONG} wrong guesses`}>
      {/* gallows (always drawn) */}
      {line(20, 230, 120, 230, "base")}
      {line(50, 230, 50, 20, "pole")}
      {line(50, 20, 140, 20, "beam")}
      {line(140, 20, 140, 45, "rope")}
      {/* body parts appear one per wrong guess */}
      {wrong >= 1 && <circle cx="140" cy="62" r="17" fill="none" stroke={stroke} strokeWidth={4} />}
      {wrong >= 2 && line(140, 79, 140, 140, "body")}
      {wrong >= 3 && line(140, 95, 115, 120, "armL")}
      {wrong >= 4 && line(140, 95, 165, 120, "armR")}
      {wrong >= 5 && line(140, 140, 118, 178, "legL")}
      {wrong >= 6 && line(140, 140, 162, 178, "legR")}
    </svg>
  )
}

export function HangmanGame({
  pool: initialPool, language, studyDirection,
}: {
  pool: HangmanWord[]
  language: "sr" | "hr"
  studyDirection: "to_slavic" | "to_english"
}) {
  const targetIsSlavic = studyDirection !== "to_english"
  const rows = targetIsSlavic ? SR_ROWS : EN_ROWS
  const keySet = useMemo(() => new Set(rows.flat()), [rows])

  const slavic = useCallback((w: HangmanWord) => (language === "sr" ? w.serbian : w.croatian), [language])
  const targetOf = useCallback((w: HangmanWord) => (targetIsSlavic ? slavic(w) : w.english), [targetIsSlavic, slavic])
  const clueOf   = useCallback((w: HangmanWord) => (targetIsSlavic ? w.english : slavic(w)), [targetIsSlavic, slavic])

  const [pool, setPool]     = useState(initialPool)
  const [idx, setIdx]       = useState(0)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [wrong, setWrong]   = useState(0)
  const [score, setScore]   = useState(0)
  const [streak, setStreak] = useState(0)

  const current = pool[idx]
  const target  = (current ? targetOf(current) : "").toUpperCase()
  const clue    = current ? clueOf(current) : ""

  const letters = useMemo(() => [...target].filter(isLetter), [target])
  const won  = letters.length > 0 && letters.every(c => guessed.has(c))
  const lost = wrong >= MAX_WRONG
  const over = won || lost

  function guess(letter: string) {
    if (over || guessed.has(letter)) return
    const next = new Set(guessed)
    next.add(letter)
    setGuessed(next)
    if (!target.includes(letter)) {
      const w = wrong + 1
      setWrong(w)
      if (w >= MAX_WRONG) setStreak(0)
    } else if ([...target].filter(isLetter).every(c => next.has(c))) {
      // solved
      setScore(s => s + 1)
      setStreak(s => s + 1)
    }
  }

  async function nextWord() {
    setGuessed(new Set())
    setWrong(0)
    const nextIdx = idx + 1
    // top up the pool when running low so play never stops
    if (nextIdx >= pool.length - 3) {
      try {
        const more: HangmanWord[] = await fetch("/api/games/hangman").then(r => r.json())
        if (Array.isArray(more) && more.length) setPool(p => [...p, ...more])
      } catch { /* keep cycling existing pool */ }
    }
    setIdx(nextIdx)
  }

  // Physical keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "Enter" && over) { nextWord(); return }
      const k = e.key.length === 1 ? e.key.toUpperCase() : ""
      if (k && keySet.has(k)) guess(k)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed, wrong, over, keySet, idx, pool])

  if (!current) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">No words available yet.</p>
        <Link href="/dashboard" className="text-violet-600 font-semibold">← Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Dashboard</Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Hangman</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="flex items-center gap-1 text-amber-500"><Trophy className="w-4 h-4" />{score}</span>
            <span className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" />{streak}</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-8 flex flex-col items-center">
        {/* Clue */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            {targetIsSlavic ? (language === "sr" ? "Serbian word for" : "Croatian word for") : "English word for"}
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{clue}</p>
        </div>

        {/* Hangman */}
        <Gallows wrong={wrong} />
        <p className="text-xs text-slate-400 mt-1 mb-6">{MAX_WRONG - wrong} guess{MAX_WRONG - wrong !== 1 ? "es" : ""} left</p>

        {/* Word blanks — grouped by word so spaces show as gaps */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 mb-8 min-h-[3rem]">
          {target.split(" ").map((word, wi) => (
            <div key={wi} className="flex gap-1.5">
              {[...word].map((ch, ci) => {
                const revealed = !isLetter(ch) || guessed.has(ch)
                const missed = lost && isLetter(ch) && !guessed.has(ch)
                return (
                  <span
                    key={ci}
                    className={`w-7 sm:w-8 text-center text-2xl font-bold border-b-4 pb-1 ${
                      missed ? "text-rose-500 border-rose-200" : "text-slate-900 border-slate-300"
                    } ${isLetter(ch) ? "" : "border-transparent"}`}
                  >
                    {revealed || missed ? ch : " "}
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        {/* Result + next */}
        {over ? (
          <div className="flex flex-col items-center gap-3 mb-6">
            <p className={`text-lg font-extrabold ${won ? "text-emerald-600" : "text-rose-500"}`}>
              {won ? "Correct! 🎉" : "Out of guesses"}
            </p>
            <button
              onClick={nextWord}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" /> Next word
            </button>
          </div>
        ) : (
          /* Keyboard */
          <div className="flex flex-col items-center gap-2 w-full max-w-lg">
            {rows.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1.5">
                {row.map(letter => {
                  const used = guessed.has(letter)
                  const correct = used && target.includes(letter)
                  return (
                    <button
                      key={letter}
                      onClick={() => guess(letter)}
                      disabled={used}
                      className={`w-8 h-10 sm:w-9 sm:h-11 rounded-lg font-bold text-base transition select-none ${
                        !used
                          ? "bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 hover:border-violet-300 active:scale-95"
                          : correct
                          ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-300 border border-slate-200 line-through"
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
