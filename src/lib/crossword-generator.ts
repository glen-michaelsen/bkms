// ── Types ─────────────────────────────────────────────────────────────────────

export type PuzzleWord = {
  id: number
  direction: "across" | "down"
  row: number
  col: number
  answer: string // uppercase
  clue: string   // English
}

export type GeneratedPuzzle = {
  words: PuzzleWord[]
  gridRows: number
  gridCols: number
}

type DbWord = { serbian: string; english: string }

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_SR = /^[A-ZČĆĐŠŽa-zčćđšž]+$/
const VALID_EN = /^[A-Za-z]+$/

function normalise(w: DbWord, flip = false): { answer: string; clue: string } | null {
  if (flip) {
    const answer = w.english.trim().toUpperCase()
    if (!VALID_EN.test(answer)) return null
    if (answer.length < 2 || answer.length > 9) return null
    return { answer, clue: w.serbian.trim() }
  }
  const answer = w.serbian.trim().toUpperCase()
  if (!VALID_SR.test(answer)) return null
  if (answer.length < 2 || answer.length > 9) return null
  return { answer, clue: w.english.trim() }
}

// ── Generator ─────────────────────────────────────────────────────────────────
//
// Layout: one vertical SPINE word, with an ACROSS word on every row.
// Across words alternate RIGHT (starts with spine letter) then LEFT (ends with
// spine letter) so no two adjacent rows share any column except the spine.
//
//   col: 0 1 2 [spine] 4 5 6
//   row A: . . . S T A N   → right (STAN[0] = S)
//   row B: . M I R . . .   ← left  (MIR[2]  = R)
//   row C: . . . E V R O   → right (EVRO[0] = E)
//   ...

export function generateDailyCrossword(dbWords: DbWord[], flip = false): GeneratedPuzzle | null {
  const pool = dbWords.flatMap(w => {
    const n = normalise(w, flip)
    return n ? [n] : []
  })

  if (pool.length < 8) return null

  // Shuffle for daily variety
  const shuffled = [...pool].sort(() => Math.random() - 0.5)

  // Try each candidate as the spine (4–7 letters)
  for (const spine of shuffled.filter(w => w.answer.length >= 4 && w.answer.length <= 7)) {
    const result = tryBuild(spine, pool)
    if (result) return result
  }

  return null
}

function tryBuild(
  spine: { answer: string; clue: string },
  pool: { answer: string; clue: string }[],
): GeneratedPuzzle | null {
  const used = new Set([spine.answer])
  type Slot = { answer: string; clue: string; goRight: boolean }
  const slots: Slot[] = []

  for (let i = 0; i < spine.answer.length; i++) {
    const letter = spine.answer[i]
    const goRight = i % 2 === 0

    const candidates = pool.filter(w => {
      if (used.has(w.answer)) return false
      return goRight
        ? w.answer[0] === letter
        : w.answer[w.answer.length - 1] === letter
    })

    if (candidates.length === 0) return null

    // Prefer length 3–5 for readability; fall back to any valid length
    const preferred = candidates.filter(c => c.answer.length >= 3 && c.answer.length <= 5)
    const bucket = preferred.length > 0 ? preferred : candidates
    const chosen = bucket[Math.floor(Math.random() * bucket.length)]

    used.add(chosen.answer)
    slots.push({ ...chosen, goRight })
  }

  // ── Compute grid dimensions ────────────────────────────────────────────────
  const maxLeft  = Math.max(0, ...slots.filter(s => !s.goRight).map(s => s.answer.length))
  const maxRight = Math.max(0, ...slots.filter(s =>  s.goRight).map(s => s.answer.length))

  const spineCol  = maxLeft          // spine sits right after the longest left-word
  const startRow  = 1                // one empty row at the top
  const gridRows  = startRow + spine.answer.length + 1
  const gridCols  = spineCol + maxRight

  // ── Assemble PuzzleWord list ───────────────────────────────────────────────
  const words: PuzzleWord[] = []
  let wid = 1

  // Spine (down)
  words.push({
    id: wid++,
    direction: "down",
    row: startRow,
    col: spineCol,
    answer: spine.answer,
    clue: spine.clue,
  })

  // Across words — one per spine row
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    words.push({
      id: wid++,
      direction: "across",
      row: startRow + i,
      col: s.goRight ? spineCol : spineCol - (s.answer.length - 1),
      answer: s.answer,
      clue: s.clue,
    })
  }

  return { words, gridRows, gridCols }
}
