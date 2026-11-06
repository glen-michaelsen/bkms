"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db"
import { categories, levels, stories, storyLines, userStoryProgress } from "@/db/schema"
import { toSlug, UNDERSTANDING_OPTIONS, type StoryText, type Understanding } from "@/lib/stories"

export async function saveUnderstandingAction(storyId: number, understanding: Understanding): Promise<void> {
  const session = await auth()
  if (!session) return
  if (!UNDERSTANDING_OPTIONS.some(o => o.value === understanding)) return
  const readAt = new Date()
  await db.insert(userStoryProgress)
    .values({ userId: parseInt(session.user.id), storyId, understanding, readAt })
    .onConflictDoUpdate({
      target: [userStoryProgress.userId, userStoryProgress.storyId],
      set: { understanding, readAt },
    })
  revalidatePath("/stories")
}

export type StoryInput = {
  id?: number
  titleSr: string; titleHr: string; titleEn: string
  levelId: number; categoryId: number
  published: boolean
  lines: StoryText[]
}

function refreshStoryPages() {
  revalidatePath("/stories", "layout")
  revalidatePath("/admin")
}

export async function saveStoryAction(input: StoryInput): Promise<{ error?: string; id?: number }> {
  const session = await auth()
  if (session?.user.role !== "admin") return { error: "Not authorized" }

  const titleSr = input.titleSr.trim()
  const titleHr = input.titleHr.trim()
  const titleEn = input.titleEn.trim()
  if (!titleSr || !titleHr || !titleEn) return { error: "Add the title in all three languages" }

  const lines = input.lines.map(l => ({
    serbian: l.serbian.trim(), croatian: l.croatian.trim(), english: l.english.trim(),
  }))
  if (lines.length === 0) return { error: "Add at least one line" }
  const incomplete = lines.findIndex(l => !l.serbian || !l.croatian || !l.english)
  if (incomplete >= 0) return { error: `Line ${incomplete + 1} needs all three languages` }

  const [level, category] = await Promise.all([
    db.select({ id: levels.id }).from(levels).where(eq(levels.id, input.levelId)).get(),
    db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).get(),
  ])
  if (!level) return { error: "Choose a difficulty" }
  if (!category) return { error: "Choose a category" }

  const fields = {
    titleSr, titleHr, titleEn, levelId: level.id, categoryId: category.id, published: input.published,
  }

  if (input.id) {
    const id = input.id
    await db.batch([
      db.update(stories).set(fields).where(eq(stories.id, id)),
      db.delete(storyLines).where(eq(storyLines.storyId, id)),
      db.insert(storyLines).values(lines.map((l, position) => ({ ...l, storyId: id, position }))),
    ])
    refreshStoryPages()
    return { id }
  }

  const slug = await uniqueSlug(toSlug(titleEn))
  const [created] = await db.insert(stories).values({ ...fields, slug }).returning({ id: stories.id })
  await db.insert(storyLines).values(lines.map((l, position) => ({ ...l, storyId: created.id, position })))
  refreshStoryPages()
  return { id: created.id }
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  for (let n = 2; await db.select({ id: stories.id }).from(stories).where(eq(stories.slug, slug)).get(); n++) {
    slug = `${base}-${n}`
  }
  return slug
}

export async function deleteStoryAction(id: number): Promise<{ error?: string }> {
  const session = await auth()
  if (session?.user.role !== "admin") return { error: "Not authorized" }
  await db.batch([
    db.delete(userStoryProgress).where(eq(userStoryProgress.storyId, id)),
    db.delete(storyLines).where(eq(storyLines.storyId, id)),
    db.delete(stories).where(eq(stories.id, id)),
  ])
  refreshStoryPages()
  return {}
}
