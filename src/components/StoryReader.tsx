"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { saveUnderstandingAction } from "@/app/stories/actions"
import { UNDERSTANDING_OPTIONS, type KeyWord, type Understanding } from "@/lib/stories"

export function StoryReader({
  storyId, lines, keyWords, initialUnderstanding, nextSlug,
}: {
  storyId: number
  lines: { target: string; translation: string }[]
  keyWords: KeyWord[]
  initialUnderstanding: Understanding | null
  nextSlug: string | null
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [answer, setAnswer] = useState(initialUnderstanding)
  const [saveFailed, setSaveFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle(index: number) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function choose(value: Understanding) {
    const previous = answer
    setAnswer(value)
    setSaveFailed(false)
    startTransition(async () => {
      try {
        await saveUnderstandingAction(storyId, value)
      } catch {
        setAnswer(previous)
        setSaveFailed(true)
      }
    })
  }

  return (
    <>
      {keyWords.length > 0 && (
        <section className="mt-7 bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-violet-900">Good words to know first</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {keyWords.map(word => (
              <li key={word.target} className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{word.target}</span> – {word.translation}
                {word.form && <span className="text-slate-500"> ({word.form})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-slate-400">Tap a line to see its translation.</p>
      <div className="mt-2 space-y-1">
        {lines.map((line, index) => {
          const open = revealed.has(index)
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={open}
              className={`block w-full text-left px-3 py-2 rounded-xl transition-colors ${
                open ? "bg-white" : "hover:bg-white"
              }`}
            >
              <span className="block text-lg leading-relaxed text-slate-900">{line.target}</span>
              {open && <span className="block text-sm text-violet-700 mt-0.5">{line.translation}</span>}
            </button>
          )
        })}
      </div>

      <section className="mt-10 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900">How much did you understand without checking the translations?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {UNDERSTANDING_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              disabled={pending}
              onClick={() => choose(option.value)}
              aria-pressed={answer === option.value}
              className={`py-3 px-3 text-sm font-semibold rounded-xl border-2 transition-all disabled:opacity-70 ${
                answer === option.value
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 text-slate-600 hover:border-violet-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {saveFailed && (
          <p className="mt-3 text-sm font-medium text-rose-600">That didn&apos;t save. Please try again.</p>
        )}
        {answer && !saveFailed && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />Saved
            </p>
            <Link
              href={nextSlug ? `/stories/${nextSlug}` : "/stories"}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition"
            >
              {nextSlug ? "Next story →" : "All stories →"}
            </Link>
          </div>
        )}
      </section>
    </>
  )
}
