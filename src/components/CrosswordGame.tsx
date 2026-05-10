"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { saveCrosswordProgressAction } from "@/app/actions"
import { AlertCircle, Grid3x3, Sparkles } from "lucide-react"
import type { GeneratedPuzzle, PuzzleWord } from "@/lib/crossword-generator"

// ── Types ─────────────────────────────────────────────────────────────────────

type Direction = "across" | "down"

interface CellInfo {
  letter: string
  wordIds: number[]
  number?: number
}

// ── Build cell map ────────────────────────────────────────────────────────────

function buildGrid(words: PuzzleWord[]): Map<string, CellInfo> {
  const map = new Map<string, CellInfo>()

  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const row = w.direction === "across" ? w.row : w.row + i
      const col = w.direction === "across" ? w.col + i : w.col
      const key = `${row},${col}`
      const existing = map.get(key)
      if (existing) {
        existing.wordIds.push(w.id)
      } else {
        map.set(key, { letter: w.answer[i], wordIds: [w.id] })
      }
    }
  }

  // Assign clue numbers in reading order (top-to-bottom, left-to-right)
  let num = 1
  const sorted = [...words].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
  const numbered = new Map<string, number>()
  for (const w of sorted) {
    const key = `${w.row},${w.col}`
    if (!numbered.has(key)) {
      numbered.set(key, num++)
      const cell = map.get(key)
      if (cell) cell.number = numbered.get(key)
    }
  }

  return map
}

function buildWordNumMap(words: PuzzleWord[]): Map<number, number> {
  const m = new Map<number, number>()
  const sorted = [...words].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
  let n = 1
  const seen = new Map<string, number>()
  for (const w of sorted) {
    const k = `${w.row},${w.col}`
    if (!seen.has(k)) seen.set(k, n++)
    m.set(w.id, seen.get(k)!)
  }
  return m
}

// ── No-puzzle fallback ────────────────────────────────────────────────────────

function NoPuzzle() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Dashboard</Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4"><AlertCircle className="w-7 h-7" /></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No puzzle today</h2>
          <p className="text-slate-500 text-sm">Not enough words in the database to generate a crossword. Add more words in the admin panel.</p>
        </div>
      </main>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const CELL_MAX = 44  // px — max cell size (desktop)
const CELL_MIN = 30  // px — minimum usable tap size
const SAVE_DEBOUNCE_MS = 800
const SPECIAL_CHARS = ["Č", "Ć", "Š", "Đ", "Ž"]

interface CrosswordGameProps {
  puzzle: GeneratedPuzzle | null
  date: string
  initialInput: Record<string, string>
  initialSolvedAt: string | null
}

export function CrosswordGame({ puzzle, date, initialInput, initialSolvedAt }: CrosswordGameProps) {
  if (!puzzle) return <NoPuzzle />

  return <CrosswordBoard puzzle={puzzle} date={date} initialInput={initialInput} initialSolvedAt={initialSolvedAt} />
}

function CrosswordBoard({ puzzle, date, initialInput, initialSolvedAt }: Required<CrosswordGameProps> & { puzzle: GeneratedPuzzle }) {
  const { words, gridRows, gridCols } = puzzle
  const grid       = buildGrid(words)
  const wordNumMap = buildWordNumMap(words)

  // ── State ──────────────────────────────────────────────────────────────────
  const [input, setInput]       = useState<Map<string, string>>(() => new Map(Object.entries(initialInput)))
  const [selected, setSelected] = useState<{ row: number; col: number; dir: Direction } | null>(null)
  const [solved, setSolved]     = useState<boolean>(initialSolvedAt !== null)
  const [cellSize, setCellSize] = useState(CELL_MAX)
  const inputRef  = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Responsive cell size ───────────────────────────────────────────────────
  useEffect(() => {
    function update() {
      const hPad = 40 // matches px-5 (20px) × 2
      const available = window.innerWidth - hPad
      const ideal = Math.floor(available / gridCols)
      setCellSize(Math.max(CELL_MIN, Math.min(CELL_MAX, ideal)))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [gridCols])

  // ── Auto-save (debounced) ──────────────────────────────────────────────────
  const saveProgress = useCallback((currentInput: Map<string, string>, isSolved: boolean) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const record: Record<string, string> = {}
      currentInput.forEach((v, k) => { record[k] = v })
      saveCrosswordProgressAction(date, JSON.stringify(record), isSolved)
    }, SAVE_DEBOUNCE_MS)
  }, [date])

  // ── Solve check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (solved) return
    let allCorrect = true
    for (const [key, cell] of grid.entries()) {
      if (input.get(key)?.toUpperCase() !== cell.letter) { allCorrect = false; break }
    }
    if (allCorrect && input.size > 0) {
      setSolved(true)
      // Save immediately (not debounced) so solvedAt is set right away
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const record: Record<string, string> = {}
      input.forEach((v, k) => { record[k] = v })
      saveCrosswordProgressAction(date, JSON.stringify(record), true)
    }
  }, [input, grid, solved, date])

  // ── Active word / cells ────────────────────────────────────────────────────
  const activeWord = selected
    ? words.find(w => {
        if (w.direction !== selected.dir) return false
        if (w.direction === "across") return w.row === selected.row && selected.col >= w.col && selected.col < w.col + w.answer.length
        return w.col === selected.col && selected.row >= w.row && selected.row < w.row + w.answer.length
      }) ?? null
    : null

  const activeCells = new Set<string>()
  if (activeWord) {
    for (let i = 0; i < activeWord.answer.length; i++) {
      const r = activeWord.direction === "across" ? activeWord.row : activeWord.row + i
      const c = activeWord.direction === "across" ? activeWord.col + i : activeWord.col
      activeCells.add(`${r},${c}`)
    }
  }

  // ── Interaction ────────────────────────────────────────────────────────────
  function handleCellClick(row: number, col: number) {
    const key = `${row},${col}`
    if (!grid.has(key)) return

    if (selected?.row === row && selected?.col === col) {
      const otherDir: Direction = selected.dir === "across" ? "down" : "across"
      const hasOther = words.some(w => {
        if (w.direction !== otherDir) return false
        if (otherDir === "across") return w.row === row && col >= w.col && col < w.col + w.answer.length
        return w.col === col && row >= w.row && row < w.row + w.answer.length
      })
      if (hasOther) { setSelected({ row, col, dir: otherDir }); return }
    }

    const w = words.find(w => {
      if (w.direction === "across") return w.row === row && col >= w.col && col < w.col + w.answer.length
      return w.col === col && row >= w.row && row < w.row + w.answer.length
    })
    if (w) setSelected({ row, col, dir: w.direction })
    inputRef.current?.focus()
  }

  const moveToNext = useCallback((row: number, col: number, dir: Direction) => {
    const nr = dir === "across" ? row : row + 1
    const nc = dir === "across" ? col + 1 : col
    if (grid.has(`${nr},${nc}`)) setSelected({ row: nr, col: nc, dir })
  }, [grid])

  const moveToPrev = useCallback((row: number, col: number, dir: Direction) => {
    const nr = dir === "across" ? row : row - 1
    const nc = dir === "across" ? col - 1 : col
    if (grid.has(`${nr},${nc}`)) setSelected({ row: nr, col: nc, dir })
  }, [grid])

  function handleKey(e: React.KeyboardEvent) {
    if (!selected) return
    const { row, col, dir } = selected

    if (e.key === "Backspace") {
      e.preventDefault()
      const key = `${row},${col}`
      if (input.get(key)) {
        setInput(prev => {
          const m = new Map(prev)
          m.delete(key)
          saveProgress(m, false)
          return m
        })
      } else {
        moveToPrev(row, col, dir)
      }
      return
    }

    if (e.key === "ArrowRight") { setSelected({ row, col: Math.min(col + 1, gridCols - 1), dir: "across" }); return }
    if (e.key === "ArrowLeft")  { setSelected({ row, col: Math.max(col - 1, 0), dir: "across" }); return }
    if (e.key === "ArrowDown")  { setSelected({ row: Math.min(row + 1, gridRows - 1), col, dir: "down" }); return }
    if (e.key === "ArrowUp")    { setSelected({ row: Math.max(row - 1, 0), col, dir: "down" }); return }

    const letter = e.key.toUpperCase()
    if (letter.length === 1 && /[A-ZČĆĐŠŽ]/.test(letter)) {
      e.preventDefault()
      insertLetter(letter)
    }
  }

  function insertLetter(letter: string) {
    if (!selected || solved) return
    const { row, col, dir } = selected
    const key = `${row},${col}`
    if (!grid.has(key)) return
    setInput(prev => {
      const m = new Map(prev)
      m.set(key, letter)
      saveProgress(m, false)
      return m
    })
    moveToNext(row, col, dir)
  }

  // ── Clue lists ─────────────────────────────────────────────────────────────
  const acrossClues = words.filter(w => w.direction === "across")
    .sort((a, b) => (wordNumMap.get(a.id) ?? 0) - (wordNumMap.get(b.id) ?? 0))
  const downClues = words.filter(w => w.direction === "down")
    .sort((a, b) => (wordNumMap.get(a.id) ?? 0) - (wordNumMap.get(b.id) ?? 0))

  // ── Date display ───────────────────────────────────────────────────────────
  const displayDate = new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "long"
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Dashboard</Link>
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-slate-600" />
            <span className="font-bold text-slate-900">Daily Crossword</span>
          </div>
          <div className="text-xs font-medium text-slate-400">{displayDate}</div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-8">

        {/* Active clue banner */}
        <div className="h-12 mb-5 flex items-center">
          {activeWord ? (
            <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm w-full">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider whitespace-nowrap">
                {wordNumMap.get(activeWord.id)} {activeWord.direction === "across" ? "Across" : "Down"}
              </span>
              <span className="text-sm font-semibold text-slate-800">{activeWord.clue}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400 px-1">
              {solved ? "Puzzle solved!" : "Click a cell to start"}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Grid */}
          <div className="flex-shrink-0">
            {/*
              Input must be visible to the browser (not sr-only / display:none)
              for iOS to show the keyboard. We keep it on-screen but invisible.
              readOnly removed so mobile keyboards activate.
              onChange handles mobile character input; onKeyDown handles desktop.
            */}
            <input
              ref={inputRef}
              className="fixed opacity-0 top-1/2 left-1/2 w-px h-px pointer-events-none"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              onKeyDown={handleKey}
              onChange={e => {
                const raw = e.target.value
                if (!raw) return
                const letter = raw.slice(-1).toUpperCase()
                if (/[A-ZČĆĐŠŽ]/.test(letter)) insertLetter(letter)
                // Reset so next keypress is always a fresh single character
                if (inputRef.current) inputRef.current.value = ""
              }}
            />
            <div
              className="inline-grid gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              style={{ gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)` }}
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length: gridRows }, (_, r) =>
                Array.from({ length: gridCols }, (_, c) => {
                  const key = `${r},${c}`
                  const cell = grid.get(key)
                  const typed = input.get(key) ?? ""
                  const isSelected = selected?.row === r && selected?.col === c
                  const isActive   = activeCells.has(key)
                  const isCorrect  = typed && typed.toUpperCase() === cell?.letter
                  const isWrong    = typed && typed.toUpperCase() !== cell?.letter
                  const numPx = Math.max(7,  Math.round(cellSize * 9  / CELL_MAX))
                  const letPx = Math.max(11, Math.round(cellSize * 16 / CELL_MAX))

                  if (!cell) {
                    return (
                      <div
                        key={key}
                        style={{ width: cellSize, height: cellSize }}
                        className="bg-slate-800"
                      />
                    )
                  }

                  return (
                    <div
                      key={key}
                      style={{ width: cellSize, height: cellSize }}
                      onClick={() => !solved && handleCellClick(r, c)}
                      onTouchEnd={e => { if (!solved) { e.preventDefault(); handleCellClick(r, c); inputRef.current?.focus() } }}
                      className={`relative flex items-center justify-center select-none transition-colors
                        ${solved ? "cursor-default" : "cursor-pointer"}
                        ${isSelected ? "bg-violet-400"
                          : isActive  ? "bg-violet-100"
                          : solved    ? "bg-emerald-50"
                          : "bg-white hover:bg-slate-50"}`}
                    >
                      {cell.number && (
                        <span style={{ fontSize: numPx }} className="absolute top-0.5 left-0.5 font-bold text-slate-500 leading-none">
                          {cell.number}
                        </span>
                      )}
                      <span style={{ fontSize: letPx }} className={`font-bold leading-none
                        ${isSelected ? "text-white"
                          : solved    ? "text-emerald-700"
                          : isCorrect ? "text-emerald-600"
                          : isWrong   ? "text-rose-500"
                          : "text-slate-900"}`}>
                        {solved ? cell.letter : (typed || "")}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Clue lists */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Special character buttons */}
            {!solved && (
              <div className="flex flex-wrap gap-2">
                {SPECIAL_CHARS.map(ch => (
                  <button
                    key={ch}
                    onMouseDown={e => { e.preventDefault(); insertLetter(ch) }}
                    disabled={!selected}
                    className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-700 shadow-sm transition-colors hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
            {[
              { label: "Across", clues: acrossClues },
              { label: "Down",   clues: downClues },
            ].map(({ label, clues }) => (
              <div key={label}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</h3>
                <div className="space-y-1">
                  {clues.map(w => {
                    const n = wordNumMap.get(w.id)
                    const isActiveClue = activeWord?.id === w.id
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          if (!solved) {
                            setSelected({ row: w.row, col: w.col, dir: w.direction })
                            inputRef.current?.focus()
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors
                          ${isActiveClue
                            ? "bg-violet-100 text-violet-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-100"}`}
                      >
                        <span className="font-bold mr-2 text-slate-400">{n}</span>
                        {w.clue}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Solved overlay — shown once when just solved, not when loading already-solved */}
      {solved && !initialSolvedAt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
            <div className="w-16 h-16 bg-violet-100 rounded-3xl flex items-center justify-center text-violet-500 mx-auto mb-4"><Sparkles className="w-8 h-8" /></div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Odlično!</h2>
            <p className="text-slate-500 mb-6">You solved today's crossword!</p>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
