import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, sentences, categories, levels } from "@/db/schema"
import { eq } from "drizzle-orm"

type Row = {
  english: string
  serbian: string
  croatian: string
  category?: string
  level?: string
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

  if (type !== "words" && type !== "sentences") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
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
