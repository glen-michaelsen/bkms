import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences, categories, levels, verbs } from "@/db/schema"
import { eq, max } from "drizzle-orm"

type Row = {
  english: string
  serbian: string
  croatian: string
  category?: string
  level?: string
}

type VerbRow = {
  infinitive: string
  translation: string
  ja: string
  ti: string
  on_ona: string
  mi: string
  vi: string
  oni: string
  infinitive_hr?: string
  ja_hr?: string
  ti_hr?: string
  on_ona_hr?: string
  mi_hr?: string
  vi_hr?: string
  oni_hr?: string
  examples: { serbian: string; croatian?: string; english: string }[]
}

async function findOrCreate(
  table: typeof categories | typeof levels,
  name: string
): Promise<number> {
  const existing = await db.select().from(table).where(eq(table.name, name)).get()
  if (existing) return existing.id
  const [created] = await db.insert(table).values({ name }).returning()
  return created.id
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { type, rows } = body as { type: string; rows: Row[] }

  if (type !== "words" && type !== "sentences" && type !== "verbs") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  // ── Verbs ──────────────────────────────────────────────────────────────────
  if (type === "verbs") {
    const verbRows = (rows as unknown) as VerbRow[]
    let imported = 0
    const errors: string[] = []
    const maxRow = await db.select({ m: max(verbs.sortOrder) }).from(verbs).get()
    let nextOrder = (maxRow?.m ?? 0) + 1

    for (let i = 0; i < verbRows.length; i++) {
      const r = verbRows[i]
      if (!r.infinitive?.trim() || !r.translation?.trim() || !r.ja?.trim()) {
        errors.push(`Row ${i + 1}: missing required fields`)
        continue
      }
      const nullIfEmpty = (v?: string) => v?.trim() || null
      try {
        await db.insert(verbs).values({
          infinitive:   r.infinitive.trim(),
          translation:  r.translation.trim(),
          ja:           r.ja.trim(),
          ti:           r.ti.trim(),
          onOna:        r.on_ona.trim(),
          mi:           r.mi.trim(),
          vi:           r.vi.trim(),
          oni:          r.oni.trim(),
          infinitiveHr: nullIfEmpty(r.infinitive_hr),
          jaHr:         nullIfEmpty(r.ja_hr),
          tiHr:         nullIfEmpty(r.ti_hr),
          onOnaHr:      nullIfEmpty(r.on_ona_hr),
          miHr:         nullIfEmpty(r.mi_hr),
          viHr:         nullIfEmpty(r.vi_hr),
          oniHr:        nullIfEmpty(r.oni_hr),
          examplesJson: JSON.stringify(r.examples ?? []),
          sortOrder:    nextOrder++,
        })
        imported++
      } catch {
        errors.push(`Row ${i + 1}: failed to insert`)
      }
    }
    return NextResponse.json({ imported, errors })
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 })
  }

  let imported = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const { english, serbian, croatian, category, level } = rows[i]

    if (!english?.trim() || !serbian?.trim() || !croatian?.trim()) {
      errors.push(`Row ${i + 1}: missing english, serbian, or croatian`)
      continue
    }

    try {
      const categoryId = category?.trim()
        ? await findOrCreate(categories, category.trim())
        : null

      if (type === "words") {
        await db.insert(words).values({
          english: english.trim(),
          serbian: serbian.trim(),
          croatian: croatian.trim(),
          categoryId,
        })
      } else {
        const levelId = level?.trim()
          ? await findOrCreate(levels, level.trim())
          : null
        await db.insert(sentences).values({
          english: english.trim(),
          serbian: serbian.trim(),
          croatian: croatian.trim(),
          categoryId,
          levelId,
        })
      }
      imported++
    } catch {
      errors.push(`Row ${i + 1}: failed to insert`)
    }
  }

  return NextResponse.json({ imported, errors })
}
