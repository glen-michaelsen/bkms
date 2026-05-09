"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"

// ── Static puzzle definition (mockup) ────────────────────────────────────────
//
// Grid is 9×9, 0-indexed [row][col].
// Words are placed manually to create overlapping intersections.
//
//   0123456789
// 0 ·····K····
// 1 ···VODA···
// 2 ·····U····
// 3 ·····Ć····
// 4 HLEB·A····
// 5 ·····S····
// 6 ···SREDA··
// 7 ·····T····
// 8 ·····A····

const GRID_ROWS = 9
const GRID_COLS = 9

type Direction = "across" | "down"

interface PuzzleWord {
  id: number
  direction: Direction
  row: number        // start row
  col: number        // start col
  answer: string     // uppercase Serbian
  clue: string       // English clue
}

const WORDS: PuzzleWord[] = [
  { id: 1, direction: "across", row: 1, col: 3, answer: "VODA",   clue: "Water" },
  { id: 2, direction: "across", row: 4, col: 0, answer: "HLEB",   clue: "Bread" },
  { id: 3, direction: "across", row: 6, col: 3, answer: "SREDA",  clue: "Wednesday" },
  { id: 4, direction: "down",   row: 0, col: 5, answer: "KUĆASTA", clue: "House (adj.)" },
  { id: 5, direction: "down",   row: 0, col: 5, answer: "KUKASTA", clue: "House (adj.)" },
]

// Simpler static word set that overlaps cleanly
const PUZZLE_WORDS: PuzzleWord[] = [
  { id: 1, direction: "across", row: 2, col: 1, answer: "VODA",   clue: "Water" },
  { id: 2, direction: "across", row: 4, col: 0, answer: "HLEB",   clue: "Bread" },
  { id: 3, direction: "across", row: 6, col: 2, answer: "SREDA",  clue: "Wednesday" },
  { id: 4, direction: "down",   row: 0, col: 3, answer: "KUĆA",   clue: "House" },
  { id: 5, direction: "down",   row: 2, col: 6, answer: "DAN",    clue: "Day" },
  { id: 6, direction: "down",   row: 4, col: 4, answer: "JEZIK",  clue: "Language / tongue" },
]

// ── Build cell map ────────────────────────────────────────────────────────────

interface CellInfo {
  letter: string          // correct letter
  wordIds: number[]       // which word IDs pass through this cell
  number?: number         // clue number to display in corner
}

function buildGrid(words: PuzzleWord[]): Map<string, CellInfo> {
  const map = new Map<string, CellInfo>()

  // Place all letters
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

  // Assign numbers to start cells
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

// ── Component ─────────────────────────────────────────────────────────────────

const CELL_SIZE = 44 // px

export function CrosswordGame() {
  const words = PUZZLE_WORDS
  const grid  = buildGrid(words)

  // Clue number map: word id → display number (computed once from word positions)
  const wordNumMap = (() => {
    const m = new Map<number, number>()
    const sortedW = [...words].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
    let n = 1
    const seen = new Map<string, number>()
    for (const w of sortedW) {
      const k = `${w.row},${w.col}`
      if (!seen.has(k)) { seen.set(k, n++); }
      m.set(w.id, seen.get(k)!)
    }
    return m
  })()

  // user input: key = "row,col", value = typed letter
  const [input, setInput]       = useState<Map<string, string>>(new Map())
  const [selected, setSelected] = useState<{ row: number; col: number; dir: Direction } | null>(null)
  const [solved, setSolved]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Which word is currently active
  const activeWord = selected
    ? words.find(w => {
        if (w.direction !== selected.dir) return false
        if (w.direction === "across") return w.row === selected.row && selected.col >= w.col && selected.col < w.col + w.answer.length
        return w.col === selected.col && selected.row >= w.row && selected.row < w.row + w.answer.length
      }) ?? null
    : null

  // cells belonging to active word
  const activeCells = new Set<string>()
  if (activeWord) {
    for (let i = 0; i < activeWord.answer.length; i++) {
      const r = activeWord.direction === "across" ? activeWord.row : activeWord.row + i
      const c = activeWord.direction === "across" ? activeWord.col + i : activeWord.col
      activeCells.add(`${r},${c}`)
    }
  }

  function handleCellClick(row: number, col: number) {
    const key = `${row},${col}`
    if (!grid.has(key)) return

    // If clicking same cell, toggle direction if possible
    if (selected?.row === row && selected?.col === col) {
      const otherDir: Direction = selected.dir === "across" ? "down" : "across"
      const hasOther = words.some(w => {
        if (w.direction !== otherDir) return false
        if (otherDir === "across") return w.row === row && col >= w.col && col < w.col + w.answer.length
        return w.col === col && row >= w.row && row < w.row + w.answer.length
      })
      if (hasOther) {
        setSelected({ row, col, dir: otherDir })
        return
      }
    }

    // Find a word that passes through this cell
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
    const key = `${nr},${nc}`
    if (grid.has(key)) setSelected({ row: nr, col: nc, dir })
  }, [grid])

  const moveToPrev = useCallback((row: number, col: number, dir: Direction) => {
    const nr = dir === "across" ? row : row - 1
    const nc = dir === "across" ? col - 1 : col
    const key = `${nr},${nc}`
    if (grid.has(key)) setSelected({ row: nr, col: nc, dir })
  }, [grid])

  function handleKey(e: React.KeyboardEvent) {
    if (!selected) return
    const { row, col, dir } = selected

    if (e.key === "Backspace") {
      e.preventDefault()
      const key = `${row},${col}`
      if (input.get(key)) {
        setInput(prev => { const m = new Map(prev); m.delete(key); return m })
      } else {
        moveToPrev(row, col, dir)
      }
      return
    }

    if (e.key === "ArrowRight") { setSelected({ row, col: Math.min(col + 1, GRID_COLS - 1), dir: "across" }); return }
    if (e.key === "ArrowLeft")  { setSelected({ row, col: Math.max(col - 1, 0), dir: "across" }); return }
    if (e.key === "ArrowDown")  { setSelected({ row: Math.min(row + 1, GRID_ROWS - 1), col, dir: "down" }); return }
    if (e.key === "ArrowUp")    { setSelected({ row: Math.max(row - 1, 0), col, dir: "down" }); return }

    // Letter input — handle Serbian special chars typed as base + diacritic or direct
    const letter = e.key.toUpperCase()
    if (letter.length === 1 && /[A-ZČĆĐŠŽ]/.test(letter)) {
      e.preventDefault()
      const key = `${row},${col}`
      setInput(prev => { const m = new Map(prev); m.set(key, letter); return m })
      moveToNext(row, col, dir)
    }
  }

  // Check if solved
  useEffect(() => {
    let allCorrect = true
    for (const [key, cell] of grid.entries()) {
      if (input.get(key)?.toUpperCase() !== cell.letter) { allCorrect = false; break }
    }
    if (allCorrect && input.size > 0) setSolved(true)
  }, [input, grid])

  // Clue lists
  const acrossClues = words.filter(w => w.direction === "across")
    .sort((a, b) => (wordNumMap.get(a.id) ?? 0) - (wordNumMap.get(b.id) ?? 0))
  const downClues   = words.filter(w => w.direction === "down")
    .sort((a, b) => (wordNumMap.get(a.id) ?? 0) - (wordNumMap.get(b.id) ?? 0))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Dashboard</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔤</span>
            <span className="font-bold text-slate-900">Daily Crossword</span>
          </div>
          <div className="text-xs font-medium text-slate-400">May 9</div>
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
            <p className="text-sm text-slate-400 px-1">Click a cell to start</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Grid */}
          <div className="flex-shrink-0">
            {/* Hidden input to capture keyboard on mobile */}
            <input
              ref={inputRef}
              className="sr-only"
              onKeyDown={handleKey}
              readOnly
            />
            <div
              className="inline-grid gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)` }}
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length: GRID_ROWS }, (_, r) =>
                Array.from({ length: GRID_COLS }, (_, c) => {
                  const key = `${r},${c}`
                  const cell = grid.get(key)
                  const typed = input.get(key) ?? ""
                  const isSelected = selected?.row === r && selected?.col === c
                  const isActive = activeCells.has(key)
                  const isCorrect = typed && typed.toUpperCase() === cell?.letter
                  const isWrong   = typed && typed.toUpperCase() !== cell?.letter

                  if (!cell) {
                    return (
                      <div
                        key={key}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        className="bg-slate-800"
                      />
                    )
                  }

                  return (
                    <div
                      key={key}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer select-none transition-colors
                        ${isSelected ? "bg-violet-400"
                          : isActive  ? "bg-violet-100"
                          : "bg-white hover:bg-slate-50"}`}
                    >
                      {cell.number && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-bold text-slate-500 leading-none">
                          {cell.number}
                        </span>
                      )}
                      <span className={`text-base font-bold leading-none
                        ${isSelected ? "text-white"
                          : isCorrect ? "text-emerald-600"
                          : isWrong   ? "text-rose-500"
                          : "text-slate-900"}`}>
                        {typed || ""}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Clue lists */}
          <div className="flex-1 space-y-6 min-w-0">
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
                        onClick={() => { setSelected({ row: w.row, col: w.col, dir: w.direction }); inputRef.current?.focus() }}
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

        {/* Solved banner */}
        {solved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
              <div className="text-5xl mb-4">🎉</div>
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
      </main>
    </div>
  )
}
