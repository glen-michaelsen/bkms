"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { Exercise } from "@/app/api/study/route"

type Phase = "loading" | "exercise" | "feedback" | "results"

export function StudySession({ type }: { type: "words" | "sentences" }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")
  const [results, setResults] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)

  // Type-in state
  const [inputValue, setInputValue] = useState("")
  // Multiple choice state
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/study?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
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
      setResults((r) => [...r, correct])
      setPhase("feedback")
    },
    [exercise]
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
    if (current + 1 >= exercises.length) {
      setPhase("results")
    } else {
      setCurrent((c) => c + 1)
      setPhase("exercise")
      setInputValue("")
      setSelectedOption(null)
      setIsCorrect(null)
    }
  }, [current, exercises.length])

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="text-center py-16 text-slate-500">Loading session…</div>
    )
  }

  if (phase === "results") {
    const score = results.filter(Boolean).length
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{score >= 8 ? "🎉" : score >= 5 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {score} / {results.length} correct
        </h2>
        <p className="text-slate-500 mb-8">
          {score >= 8
            ? "Excellent work!"
            : score >= 5
            ? "Good job, keep it up!"
            : "Keep practising — you'll get there!"}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/study/${type}`}
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const progress = ((current) / exercises.length) * 100

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>
            {current + 1} / {exercises.length}
          </span>
          <span>{exercise.exerciseType === "multiple_choice" ? "Choose the answer" : "Type the answer"}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Translate to {type === "words" ? "the word" : "the sentence"}</p>
        <p className="text-xl font-semibold text-slate-900">{exercise.english}</p>
      </div>

      {/* Exercise */}
      {exercise.exerciseType === "multiple_choice" ? (
        <div className="space-y-3">
          {exercise.options!.map((option) => {
            let btnClass =
              "w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all "

            if (phase === "feedback") {
              if (option === exercise.correctAnswer) {
                btnClass += "border-green-500 bg-green-50 text-green-800"
              } else if (option === selectedOption && !isCorrect) {
                btnClass += "border-red-400 bg-red-50 text-red-700"
              } else {
                btnClass += "border-slate-200 text-slate-400"
              }
            } else {
              btnClass +=
                option === selectedOption
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                  : "border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50"
            }

            return (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={phase === "feedback"}
                className={btnClass}
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
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 disabled:bg-slate-50"
          />
          {phase === "exercise" && (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Check
            </button>
          )}
        </form>
      )}

      {/* Feedback */}
      {phase === "feedback" && (
        <div
          className={`mt-4 p-4 rounded-xl ${
            isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          <p className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
            {isCorrect ? "Correct!" : "Not quite"}
          </p>
          {!isCorrect && (
            <p className="text-sm mt-1 text-slate-600">
              Correct answer: <span className="font-medium">{exercise.correctAnswer}</span>
            </p>
          )}
          <button
            onClick={handleNext}
            className="mt-3 w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            {current + 1 >= exercises.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </div>
  )
}
