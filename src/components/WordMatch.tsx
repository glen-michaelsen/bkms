"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { saveWordMatchSolvedAction } from "@/app/actions"

// ── Types ─────────────────────────────────────────────────────────────────────

type Word = { id: number; serbian: string; english: string }

type Connection = {
  leftIdx: number   // index into `words`
  rightIdx: number  // index into `shuffled`
  correct: boolean
}

type DragState = {
  leftIdx: number
  x: number
  y: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seeded PRNG (mulberry32) — deterministic shuffle per date */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >> 17)) >>> 0
    s = (s ^ (s << 5)) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Convert YYYY-MM-DD to a stable integer seed */
function dateSeed(date: string): number {
  return date.split("-").reduce((acc, part) => acc * 10000 + parseInt(part), 0)
}

/** Build the full set of correct connections for a solved puzzle */
function buildSolvedConnections(words: Word[], shuffled: Word[]): Connection[] {
  return words.map((word, leftIdx) => {
    const rightIdx = shuffled.findIndex(s => s.id === word.id)
    return { leftIdx, rightIdx, correct: true }
  })
}

function rightEdge(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect()
  const c = container.getBoundingClientRect()
  return { x: r.right - c.left, y: r.top + r.height / 2 - c.top }
}

function leftEdge(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect()
  const c = container.getBoundingClientRect()
  return { x: r.left - c.left, y: r.top + r.height / 2 - c.top }
}

function hitTest(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect()
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
}

// ── SVG line ─────────────────────────────────────────────────────────────────

function Line({ x1, y1, x2, y2, color, opacity = 1, width = 2.5 }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; opacity?: number; width?: number
}) {
  const cx = (x1 + x2) / 2
  return (
    <path
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    />
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WordMatch({
  initialWords,
  date,
  initialSolved,
}: {
  initialWords: Word[]
  date: string
  initialSolved: boolean
}) {
  const [words]    = useState(initialWords)
  const [shuffled] = useState(() => seededShuffle(initialWords, dateSeed(date)))

  // If already solved, pre-fill all correct connections so the solution is visible
  const [connections, setConnections] = useState<Connection[]>(() =>
    initialSolved ? buildSolvedConnections(initialWords, seededShuffle(initialWords, dateSeed(date))) : []
  )
  const [drag, setDrag]             = useState<DragState | null>(null)
  const [solved, setSolved]         = useState(initialSolved)
  const [justSolved, setJustSolved] = useState(false) // triggers the win modal only on first solve
  const [, setTick]                 = useState(0)
  const savedRef                    = useRef(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const leftRefs     = useRef<(HTMLDivElement | null)[]>([])
  const rightRefs    = useRef<(HTMLDivElement | null)[]>([])

  // Force re-render on resize so SVG lines reposition
  useEffect(() => {
    const handler = () => setTick(t => t + 1)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // Check win condition (only for in-session solves, not revisits)
  useEffect(() => {
    if (
      !initialSolved &&
      !solved &&
      connections.length === words.length &&
      connections.every(c => c.correct)
    ) {
      setSolved(true)
      setJustSolved(true)
      if (!savedRef.current) {
        savedRef.current = true
        saveWordMatchSolvedAction(date)
      }
    }
  }, [connections, words.length, solved, initialSolved, date])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function pointerPos(e: React.PointerEvent | PointerEvent) {
    const c = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - c.left, y: e.clientY - c.top }
  }

  function startDrag(e: React.PointerEvent, leftIdx: number) {
    e.preventDefault()
    setConnections(prev => prev.filter(c => c.leftIdx !== leftIdx))
    const pos = pointerPos(e)
    setDrag({ leftIdx, x: pos.x, y: pos.y })
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return
    const pos = pointerPos(e)
    setDrag(d => d ? { ...d, x: pos.x, y: pos.y } : null)
  }, [drag]) // eslint-disable-line

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag) return

    let matched = -1
    for (let i = 0; i < rightRefs.current.length; i++) {
      const el = rightRefs.current[i]
      if (el && hitTest(el, e.clientX, e.clientY)) { matched = i; break }
    }

    if (matched >= 0) {
      const correct = words[drag.leftIdx].id === shuffled[matched].id
      setConnections(prev => {
        const filtered = prev.filter(c => c.rightIdx !== matched)
        return [...filtered, { leftIdx: drag.leftIdx, rightIdx: matched, correct }]
      })
    }

    setDrag(null)
  }, [drag, words, shuffled])

  // ── Compute SVG lines ──────────────────────────────────────────────────────

  const container = containerRef.current
  const connLines = container ? connections.map(c => {
    const l = leftRefs.current[c.leftIdx]
    const r = rightRefs.current[c.rightIdx]
    if (!l || !r) return null
    const start = rightEdge(l, container)
    const end   = leftEdge(r, container)
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, correct: c.correct }
  }).filter(Boolean) : []

  const dragLine = (() => {
    if (!drag || !container) return null
    const l = leftRefs.current[drag.leftIdx]
    if (!l) return null
    const start = rightEdge(l, container)
    return { x1: start.x, y1: start.y, x2: drag.x, y2: drag.y }
  })()

  const connectedLeft  = new Map(connections.map(c => [c.leftIdx,  c.correct]))
  const connectedRight = new Map(connections.map(c => [c.rightIdx, c.correct]))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Dashboard</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <span className="font-bold text-slate-900">Word Match</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">{date}</div>
        </div>
      </nav>

      {/* Already-solved banner */}
      {initialSolved && (
        <div className="bg-emerald-50 border-b border-emerald-100">
          <div className="max-w-2xl mx-auto px-5 py-2.5 flex items-center justify-center gap-2">
            <span className="text-emerald-500 text-sm">✓</span>
            <p className="text-sm font-medium text-emerald-700">
              You solved today's puzzle — come back tomorrow for a new one!
            </p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        {!initialSolved && (
          <p className="text-sm text-slate-500 text-center mb-8">
            Draw a line from each Serbian word to its English translation
          </p>
        )}

        {shuffled.length > 0 && (
          <div
            ref={containerRef}
            className="relative select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* SVG overlay for lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              {connLines.map((line, i) => line && (
                <Line key={i}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  color={line.correct ? "#10b981" : "#f43f5e"}
                />
              ))}
              {dragLine && (
                <Line
                  x1={dragLine.x1} y1={dragLine.y1} x2={dragLine.x2} y2={dragLine.y2}
                  color="#7c3aed" opacity={0.5} width={2}
                />
              )}
            </svg>

            {/* Word columns */}
            <div className="grid grid-cols-2 gap-x-12">

              {/* Left — Serbian */}
              <div className="space-y-3">
                {words.map((word, i) => {
                  const status = connectedLeft.get(i)
                  const isConnected = status !== undefined
                  const isDragging  = drag?.leftIdx === i
                  return (
                    <div
                      key={word.id}
                      ref={el => { leftRefs.current[i] = el }}
                      onPointerDown={e => !solved && startDrag(e, i)}
                      style={{ touchAction: "none" }}
                      className={`px-4 py-3 rounded-2xl border text-sm font-semibold transition-all
                        ${solved
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default"
                          : isDragging
                            ? "bg-violet-100 border-violet-400 text-violet-900 cursor-grabbing shadow-md scale-[1.02]"
                            : isConnected
                              ? status
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 cursor-grab"
                                : "bg-rose-50 border-rose-300 text-rose-800 cursor-grab"
                              : "bg-white border-slate-200 text-slate-800 cursor-grab hover:border-violet-300 hover:shadow-sm"
                        }`}
                    >
                      {word.serbian}
                    </div>
                  )
                })}
              </div>

              {/* Right — English */}
              <div className="space-y-3">
                {shuffled.map((word, i) => {
                  const status = connectedRight.get(i)
                  const isConnected = status !== undefined
                  return (
                    <div
                      key={word.id}
                      ref={el => { rightRefs.current[i] = el }}
                      className={`px-4 py-3 rounded-2xl border text-sm font-medium transition-all
                        ${solved
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                          : isConnected
                            ? status
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-rose-50 border-rose-300 text-rose-700"
                            : drag
                              ? "bg-violet-50/50 border-violet-200 text-slate-700"
                              : "bg-white border-slate-200 text-slate-600"
                        }`}
                    >
                      {word.english}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Progress bar while playing */}
        {!solved && connections.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-8">
            {connections.filter(c => c.correct).length} / {words.length} correct
          </p>
        )}
      </main>

      {/* Win modal — only shown the moment the puzzle is first solved */}
      {justSolved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Perfect match!</h2>
            <p className="text-slate-500 mb-6">
              You matched all {words.length} words correctly. Come back tomorrow for a new puzzle.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setJustSolved(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                See solution
              </button>
              <Link
                href="/dashboard"
                className="block w-full py-3 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
