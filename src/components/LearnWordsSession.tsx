"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, ChevronRight, RefreshCw } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type LearnWord = {
  id: number
  english: string
  serbian: string
  croatian: string
  serbianFemale: string | null
  croatianFemale: string | null
  categoryId: number | null
  categoryName: string | null
}

type Props = {
  words: LearnWord[]
  allWords: LearnWord[]
  language: "sr" | "hr"
  isFemale: boolean
  isEnglishLearner: boolean
}

type Stage = "present" | "mc" | "type" | "results"

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

const LETTER_RE = /[a-zA-ZčćđšžČĆĐŠŽЀ-ӿ0-9 ]/
function normalize(s: string) {
  return s.toLowerCase().split("").filter(c => LETTER_RE.test(c)).join("").replace(/\s+/g, " ").trim()
}

function resolveSlav(w: LearnWord, language: "sr" | "hr", isFemale: boolean): string {
  const base   = language === "sr" ? w.serbian : w.croatian
  const female = language === "sr" ? w.serbianFemale : w.croatianFemale
  return (isFemale && female) ? female : base
}

function getPromptAnswer(w: LearnWord, language: "sr" | "hr", isFemale: boolean, isEnglishLearner: boolean) {
  const slav = resolveSlav(w, language, isFemale)
  return isEnglishLearner
    ? { prompt: slav, answer: w.english }
    : { prompt: w.english, answer: slav }
}

function buildOptions(
  correct: LearnWord,
  pool: LearnWord[],
  language: "sr" | "hr",
  isFemale: boolean,
  isEnglishLearner: boolean,
  excludeAnswers: string[],
): string[] {
  const ans = (w: LearnWord) => getPromptAnswer(w, language, isFemale, isEnglishLearner).answer
  const correctAns = ans(correct)

  const valid = (w: LearnWord) => {
    const a = ans(w)
    return w.id !== correct.id && a !== correctAns && !excludeAnswers.includes(a)
  }

  const sameCat = shuffle(pool.filter(w => valid(w) && w.categoryId === correct.categoryId))
  const full    = shuffle(pool.filter(valid))
  const source  = sameCat.length >= 3 ? sameCat : full

  const seen = new Set<string>()
  const distractors: string[] = []
  for (const w of source) {
    const a = ans(w)
    if (!seen.has(a)) { seen.add(a); distractors.push(a) }
    if (distractors.length === 3) break
  }

  return shuffle([correctAns, ...distractors])
}

// ── Component ─────────────────────────────────────────────────────────────────

const HINTS = [
  "Say the word out loud a few times",
  "Cover the translation and try to recall it",
  "Notice the sounds — does it remind you of anything?",
  "Picture the meaning as a vivid image",
]

export function LearnWordsSession({ words, allWords, language, isFemale, isEnglishLearner }: Props) {
  const [wordIdx,        setWordIdx]        = useState(0)
  const [stage,          setStage]          = useState<Stage>("present")
  const [mcOptions,      setMCOptions]      = useState<string[]>([])
  const [mcPicked,       setMCPicked]       = useState<string | null>(null)
  const [usedDistractors, setUsedDistractors] = useState<string[]>([])
  const [typeInput,      setTypeInput]      = useState("")
  const [typeResult,     setTypeResult]     = useState<"idle" | "wrong" | "correct">("idle")
  const typeRef = useRef<HTMLInputElement>(null)

  const currentWord                   = words[wordIdx]
  const { prompt, answer }            = getPromptAnswer(currentWord, language, isFemale, isEnglishLearner)
  const langName                      = isEnglishLearner ? "English" : language === "hr" ? "Croatian" : "Serbian"
  const promptLang                    = isEnglishLearner ? (language === "hr" ? "Croatian" : "Serbian") : "English"
  const stageIndex                    = stage === "present" ? 0 : stage === "mc" ? 1 : stage === "type" ? 2 : 3
  const progressFraction              = Math.min((wordIdx * 3 + stageIndex) / (words.length * 3), 1)

  useEffect(() => {
    if (stage === "type") setTimeout(() => typeRef.current?.focus(), 80)
  }, [stage])

  function goToMC() {
    const opts = buildOptions(currentWord, allWords, language, isFemale, isEnglishLearner, [])
    setMCOptions(opts)
    setMCPicked(null)
    setUsedDistractors(opts.filter(o => o !== answer))
    setStage("mc")
  }

  function handleMCPick(option: string) {
    if (mcPicked !== null) return
    setMCPicked(option)
    if (option === answer) {
      setTimeout(() => {
        setTypeInput("")
        setTypeResult("idle")
        setStage("type")
      }, 900)
    }
    // Wrong: user sees feedback + "Try again" button
  }

  function regenerateMC() {
    const opts = buildOptions(currentWord, allWords, language, isFemale, isEnglishLearner, usedDistractors)
    setMCOptions(opts)
    setMCPicked(null)
    setUsedDistractors(prev => [...prev, ...opts.filter(o => o !== answer)])
  }

  function handleTypeCheck() {
    if (normalize(typeInput) === normalize(answer)) {
      setTypeResult("correct")
      fetch("/api/study/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: currentWord.id, itemType: "word", isCorrect: true }),
      })
      setTimeout(advanceWord, 900)
    } else {
      setTypeResult("wrong")
    }
  }

  function advanceWord() {
    if (wordIdx + 1 >= words.length) {
      setStage("results")
    } else {
      setWordIdx(i => i + 1)
      setStage("present")
      setMCPicked(null)
      setUsedDistractors([])
      setTypeInput("")
      setTypeResult("idle")
    }
  }

  // ── Results ──────────────────────────────────────────────────────────────

  if (stage === "results") {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Well done!</h2>
        <p className="text-slate-500 text-sm mb-8">You learned {words.length} new {words.length === 1 ? "word" : "words"}.</p>

        <div className="space-y-2 mb-8 text-left">
          {words.map(w => {
            const { prompt: p, answer: a } = getPromptAnswer(w, language, isFemale, isEnglishLearner)
            return (
              <div key={w.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-800">{a}</span>
                <span className="text-slate-300">—</span>
                <span className="text-slate-500 text-sm">{p}</span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Back to dashboard
          </Link>
          <Link href="/study/words" className="px-5 py-2.5 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 transition">
            Keep practising →
          </Link>
        </div>
      </div>
    )
  }

  // ── Progress bar ─────────────────────────────────────────────────────────

  const STAGE_LABELS = ["Read", "Choose", "Type"]

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Word {wordIdx + 1} of {words.length}</span>
          <div className="flex items-center gap-3">
            {STAGE_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-semibold transition-colors ${
                  i === stageIndex ? "text-violet-600" : i < stageIndex ? "text-emerald-500" : "text-slate-300"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progressFraction * 100}%` }}
          />
        </div>
      </div>

      {/* ── Stage: Present ─────────────────────────────────────────────────── */}

      {stage === "present" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">{promptLang}</p>
            <p className="text-2xl font-semibold text-slate-400 mb-4">{prompt}</p>
            <div className="w-10 h-px bg-slate-200 mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{langName}</p>
            <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{answer}</p>
            {currentWord.categoryName && (
              <span className="inline-block mt-5 px-3 py-1 bg-violet-50 text-violet-600 text-xs font-semibold rounded-full">
                {currentWord.categoryName}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Before you continue</p>
            {HINTS.map((hint, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-slate-300 text-lg leading-none mt-0.5">·</span>
                <p className="text-sm text-slate-600 leading-relaxed">{hint}</p>
              </div>
            ))}
          </div>

          <button
            onClick={goToMC}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition flex items-center justify-center gap-2"
          >
            Ready — test me <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stage: Multiple choice ──────────────────────────────────────────── */}

      {stage === "mc" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Which is the {langName} word for
            </p>
            <p className="text-3xl font-extrabold text-slate-900">{prompt}</p>
          </div>

          {mcPicked && mcPicked !== answer && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  Not quite! The correct answer is <span className="font-bold">{answer}</span>
                </p>
                <p className="text-xs text-rose-400 mt-0.5">Try again with new options below.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {mcOptions.map(option => {
              const isCorrect = option === answer
              const isPicked  = option === mcPicked
              let cls = "border-2 border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50"
              if (isPicked && isCorrect)  cls = "border-2 border-emerald-300 bg-emerald-50 text-emerald-800"
              if (isPicked && !isCorrect) cls = "border-2 border-rose-300 bg-rose-50 text-rose-800"
              if (!isPicked && mcPicked && isCorrect) cls = "border-2 border-emerald-300 bg-emerald-50 text-emerald-800"
              return (
                <button
                  key={option}
                  onClick={() => handleMCPick(option)}
                  disabled={mcPicked !== null}
                  className={`py-4 px-4 rounded-2xl text-sm font-semibold transition-all disabled:cursor-default ${cls}`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {mcPicked && mcPicked !== answer && (
            <button
              onClick={regenerateMC}
              className="w-full py-3 rounded-2xl border-2 border-violet-200 text-violet-600 font-semibold text-sm hover:bg-violet-50 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again with new options
            </button>
          )}
        </div>
      )}

      {/* ── Stage: Type it ─────────────────────────────────────────────────── */}

      {stage === "type" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Type the {langName} word for
            </p>
            <p className="text-3xl font-extrabold text-slate-900">{prompt}</p>
          </div>

          <div className="space-y-3">
            <input
              ref={typeRef}
              type="text"
              value={typeInput}
              onChange={e => {
                setTypeInput(e.target.value)
                if (typeResult !== "idle") setTypeResult("idle")
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && typeInput.trim() && typeResult !== "correct") handleTypeCheck()
              }}
              placeholder={`Type in ${langName}…`}
              disabled={typeResult === "correct"}
              className={`w-full px-5 py-4 text-lg font-semibold rounded-2xl border-2 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 ${
                typeResult === "correct" ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : typeResult === "wrong"   ? "border-rose-300 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-white focus:border-violet-400"
              }`}
            />

            {typeResult === "wrong" && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-rose-700">
                    Not quite! The correct word is <span className="font-bold">{answer}</span>
                  </p>
                  <button
                    onClick={() => { setTypeInput(""); setTypeResult("idle"); typeRef.current?.focus() }}
                    className="text-rose-500 underline mt-1 text-xs"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {typeResult === "correct" && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">
                  {wordIdx + 1 < words.length ? "Correct! On to the next word…" : "Correct! Great work!"}
                </p>
              </div>
            )}

            {typeResult !== "correct" && (
              <button
                onClick={handleTypeCheck}
                disabled={!typeInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Check
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
