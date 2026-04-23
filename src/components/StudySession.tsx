"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { Exercise } from "@/app/api/study/route"
import { getItemStatus, STATUS_META } from "@/lib/progress"

type Phase = "loading" | "exercise" | "feedback" | "results"
type Closeness = "very_close" | "close" | "wrong"

// Cumulative knowledge update shown in feedback banner
type ProgressUpdate = { streak: number; correctCount: number; incorrectCount: number }

// ── Levenshtein helpers ───────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function getCloseness(given: string, correct: string): Closeness {
  const a = given.trim().toLowerCase()
  const b = correct.trim().toLowerCase()
  const dist = levenshtein(a, b)
  if (dist <= 2) return "very_close"
  if (dist <= Math.max(4, Math.floor(b.length * 0.35))) return "close"
  return "wrong"
}

const CLOSENESS_META: Record<Closeness, { banner: string; title: string; emoji: string }> = {
  very_close: { banner: "bg-amber-50 border border-amber-200",  title: "text-amber-700",  emoji: "😅", },
  close:      { banner: "bg-orange-50 border border-orange-200", title: "text-orange-700", emoji: "💪", },
  wrong:      { banner: "bg-rose-50 border border-rose-200",     title: "text-rose-700",   emoji: "😅", },
}

function closenessLabel(c: Closeness): string {
  if (c === "very_close") return "Almost! Just a small typo"
  if (c === "close")      return "Close! Nearly there"
  return "Not quite"
}

export function StudySession({ type }: { type: "words" | "sentences" }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")
  const [results, setResults] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [closeness, setCloseness] = useState<Closeness | null>(null)

  useEffect(() => {
    fetch(`/api/study?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else {
          setExercises(data.exercises)
          setPhase("exercise")
        }
      })
      .catch(() => setError("Failed to load session. Please try again."))
  }, [type])

  const exercise = exercises[current]

  const checkAnswer = useCallback(
    (answer: string) => {
      const correct =
        answer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase()
      setIsCorrect(correct)
      setCloseness(
        correct || exercise.exerciseType === "multiple_choice"
          ? null
          : getCloseness(answer, exercise.correctAnswer)
      )
      setResults((r) => [...r, correct])
      setProgressUpdate(null)
      setPhase("feedback")

      // Record answer and get updated progress
      fetch("/api/study/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: exercise.id,
          itemType: type === "words" ? "word" : "sentence",
          isCorrect: correct,
        }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.progress) setProgressUpdate(d.progress) })
        .catch(() => {})
    },
    [exercise, type]
  )

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (phase === "feedback") return
      setSelectedOption(option)
      checkAnswer(option)
    },
    [phase, checkAnswer]
  )

  const handleTypeInSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return
      checkAnswer(inputValue)
    },
    [inputValue, checkAnswer]
  )

  const handleNext = useCallback(() => {
    setProgressUpdate(null)
    if (current + 1 >= exercises.length) {
      setPhase("results")
    } else {
      setCurrent((c) => c + 1)
      setPhase("exercise")
      setInputValue("")
      setSelectedOption(null)
      setIsCorrect(null)
      setCloseness(null)
    }
  }, [current, exercises.length])

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-violet-600 font-semibold hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="text-center py-20">
        <div className="inline-flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-slate-400 mt-4 text-sm">Loading your session…</p>
      </div>
    )
  }

  if (phase === "results") {
    const score = results.filter(Boolean).length
    const total = results.length
    const pct = Math.round((score / total) * 100)
    const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"
    const msg =
      pct >= 80
        ? "Excellent work!"
        : pct >= 50
        ? "Good job, keep it up!"
        : "Keep practising — you'll get there!"

    return (
      <div className="text-center py-12 px-4">
        <div className="text-7xl mb-5">{emoji}</div>
        <div className="inline-flex items-baseline gap-2 mb-3">
          <span className="text-5xl font-extrabold text-slate-900">{score}</span>
          <span className="text-2xl text-slate-400 font-medium">/ {total}</span>
        </div>
        <p className="text-slate-500 text-lg mb-2">{msg}</p>

        {/* Score bar */}
        <div className="w-full max-w-xs mx-auto h-3 bg-slate-100 rounded-full overflow-hidden mt-6 mb-8">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Per-question dots */}
        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${r ? "bg-emerald-400" : "bg-rose-400"}`}
              title={r ? "Correct" : "Wrong"}
            />
          ))}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/study/${type}`}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 transition-all active:scale-[0.98]"
          >
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-violet-300 hover:bg-violet-50 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const progress = (current / exercises.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-500">
            {current + 1} / {exercises.length}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              exercise.exerciseType === "multiple_choice"
                ? "bg-violet-100 text-violet-700"
                : "bg-fuchsia-100 text-fuchsia-700"
            }`}
          >
            {exercise.exerciseType === "multiple_choice" ? "Choose" : "Type"}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Translate to {type === "words" ? "the word" : "the sentence"}
        </p>
        <p className="text-2xl font-bold text-slate-900 leading-snug">{exercise.english}</p>
      </div>

      {/* Exercise */}
      {exercise.exerciseType === "multiple_choice" ? (
        <div className="grid grid-cols-1 gap-3">
          {exercise.options!.map((option) => {
            let cls =
              "w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-base transition-all duration-150 "

            if (phase === "feedback") {
              if (option === exercise.correctAnswer) {
                cls += "border-emerald-400 bg-emerald-50 text-emerald-800"
              } else if (option === selectedOption) {
                cls += "border-rose-400 bg-rose-50 text-rose-700"
              } else {
                cls += "border-slate-100 text-slate-300 cursor-default"
              }
            } else {
              cls +=
                option === selectedOption
                  ? "border-violet-500 bg-violet-50 text-violet-800"
                  : "border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50 cursor-pointer active:scale-[0.98]"
            }

            return (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={phase === "feedback"}
                className={cls}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : (
        <form onSubmit={handleTypeInSubmit} className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={phase === "feedback"}
            placeholder="Type your answer…"
            autoFocus
            className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-violet-500 text-slate-900 text-base placeholder:text-slate-400 disabled:bg-slate-50 transition"
          />
          {phase === "exercise" && (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-full py-4 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Check answer
            </button>
          )}
        </form>
      )}

      {/* Feedback banner */}
      {phase === "feedback" && (() => {
        const cm = closeness ? CLOSENESS_META[closeness] : null
        const bannerCls = isCorrect
          ? "bg-emerald-50 border border-emerald-200"
          : cm?.banner ?? CLOSENESS_META.wrong.banner
        const titleCls = isCorrect ? "text-emerald-700" : cm?.title ?? CLOSENESS_META.wrong.title
        const headline = isCorrect
          ? "Correct! 🎯"
          : `${closenessLabel(closeness ?? "wrong")} ${cm?.emoji ?? "😅"}`

        return (
          <div className={`rounded-2xl p-5 ${bannerCls}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`font-bold text-base ${titleCls}`}>{headline}</p>
                {!isCorrect && (
                  <p className="text-sm text-slate-600 mt-1">
                    Correct answer:{" "}
                    <span className="font-semibold text-slate-800">{exercise.correctAnswer}</span>
                  </p>
                )}
              </div>
              {progressUpdate && (() => {
                const status = getItemStatus(progressUpdate)
                const meta = STATUS_META[status]
                return (
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                    {status === "known" ? "⭐ " : ""}{meta.label}
                    {status !== "new" && progressUpdate.streak > 0 && ` · ${progressUpdate.streak}🔥`}
                  </span>
                )
              })()}
            </div>
            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              {current + 1 >= exercises.length ? "See results →" : "Next →"}
            </button>
          </div>
        )
      })()}
    </div>
  )
}
