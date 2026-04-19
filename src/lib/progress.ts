export type KnowledgeStatus = "new" | "learning" | "familiar" | "known"

// Thresholds: streak >= 3 = known, any correct = familiar, seen but 0 correct = learning
export function getItemStatus(p: {
  correctCount: number
  incorrectCount: number
  streak: number
}): KnowledgeStatus {
  if (p.streak >= 3) return "known"
  if (p.correctCount >= 1) return "familiar"
  return "learning"
}

export type ItemStats = {
  total: number
  known: number
  familiar: number
  learning: number
  unseen: number
}

export function buildStats(
  allIds: number[],
  progress: { itemId: number; correctCount: number; incorrectCount: number; streak: number }[]
): ItemStats {
  const map = new Map(progress.map((p) => [p.itemId, p]))
  let known = 0, familiar = 0, learning = 0, unseen = 0

  for (const id of allIds) {
    const p = map.get(id)
    if (!p) { unseen++; continue }
    const s = getItemStatus(p)
    if (s === "known") known++
    else if (s === "familiar") familiar++
    else learning++
  }

  return { total: allIds.length, known, familiar, learning, unseen }
}

export const STATUS_META: Record<
  KnowledgeStatus,
  { label: string; color: string; bg: string; bar: string }
> = {
  known:    { label: "Known",    color: "text-emerald-700", bg: "bg-emerald-100", bar: "bg-emerald-500" },
  familiar: { label: "Familiar", color: "text-blue-700",    bg: "bg-blue-100",    bar: "bg-blue-400"    },
  learning: { label: "Learning", color: "text-amber-700",   bg: "bg-amber-100",   bar: "bg-amber-400"   },
  new:      { label: "New",      color: "text-slate-500",   bg: "bg-slate-100",   bar: "bg-slate-300"   },
}
