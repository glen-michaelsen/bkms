"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { breakdown, KEY_NUMBERS, type Lang } from "@/lib/numbers"

type Props = {
  lang: Lang
  langName: string
}

function SegmentDisplay({ segments, written }: { segments: string[]; written: string }) {
  return (
    <div className="text-center">
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {segments.map((seg, i) => (
          <span
            key={i}
            className="bg-white/20 rounded-2xl px-5 py-2.5 text-white font-bold text-xl leading-tight"
          >
            {seg}
          </span>
        ))}
      </div>
      <p className="text-white/40 text-sm italic">{written}</p>
    </div>
  )
}

export function NumbersExercise({ lang, langName }: Props) {
  const [mode, setMode]       = useState<"browse" | "type">("browse")
  const [idx, setIdx]         = useState(0)
  const [typeValue, setTypeValue] = useState("")
  const chipRef  = useRef<HTMLButtonElement | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentNum = KEY_NUMBERS[idx]
  const browseBD   = breakdown(currentNum, lang)

  const typeNum = parseInt(typeValue, 10)
  const typeBD  = !isNaN(typeNum) && typeNum >= 1 && typeNum <= 10000
    ? breakdown(typeNum, lang)
    : null

  useEffect(() => {
    chipRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [idx])

  function prev() { setIdx(i => Math.max(0, i - 1)) }
  function next() { setIdx(i => Math.min(KEY_NUMBERS.length - 1, i + 1)) }

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm w-fit">
        {(["browse", "type"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === m
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {m === "browse" ? "Browse" : "Type a number"}
          </button>
        ))}
      </div>

      {mode === "browse" ? (
        <>
          {/* Chip strip */}
          <div
            ref={scrollRef}
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {KEY_NUMBERS.map((n, i) => (
              <button
                key={n}
                ref={i === idx ? chipRef : undefined}
                onClick={() => setIdx(i)}
                className={`shrink-0 px-2.5 h-9 rounded-xl text-sm font-bold transition-all ${
                  i === idx
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {n.toString()}
              </button>
            ))}
          </div>

          {/* Hero card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-8 pt-10 pb-10">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest text-center mb-6">
                {langName} numbers · {idx + 1} of {KEY_NUMBERS.length}
              </p>

              {/* Number + arrows */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={prev}
                  disabled={idx === 0}
                  className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <p
                  className="text-white font-extrabold leading-none text-center"
                  style={{ fontSize: "5rem" }}
                >
                  {currentNum.toString()}
                </p>

                <button
                  onClick={next}
                  disabled={idx === KEY_NUMBERS.length - 1}
                  className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Segments + written */}
              <SegmentDisplay segments={browseBD.segments} written={browseBD.written} />
            </div>
          </div>

          {/* Bottom prev/next */}
          <div className="flex gap-3">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              {idx > 0 ? KEY_NUMBERS[idx - 1].toString() : ""}
            </button>
            <button
              onClick={next}
              disabled={idx === KEY_NUMBERS.length - 1}
              className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
            >
              {idx < KEY_NUMBERS.length - 1 ? KEY_NUMBERS[idx + 1].toString() : ""}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        /* Type mode */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Enter a number (1 – 10 000)
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={typeValue}
              onChange={e => setTypeValue(e.target.value)}
              placeholder="e.g. 334"
              className="w-full text-4xl font-extrabold text-slate-900 placeholder:text-slate-200 outline-none border-b-2 border-slate-100 focus:border-violet-400 transition pb-2 bg-transparent"
              autoFocus
            />
          </div>

          {typeBD && typeBD.segments.length > 0 && (
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-8">
              <SegmentDisplay segments={typeBD.segments} written={typeBD.written} />
            </div>
          )}

          {typeValue && (!typeBD || typeBD.segments.length === 0) && (
            <div className="px-6 pb-6">
              <p className="text-sm text-slate-400">Enter a number between 1 and 10 000</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
