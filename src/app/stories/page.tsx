import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { categories, levels, stories, storyLines, userStoryProgress } from "@/db/schema"
import {
  readingMinutes, readingPair, understandingLabel, type Language, type StudyDirection,
} from "@/lib/stories"

export const metadata: Metadata = { title: "Stories | Čujemo se" }

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
        active ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300"
      }`}
    >
      {children}
    </Link>
  )
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; category?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const params = await searchParams
  const userId = parseInt(session.user.id)
  const language = session.user.language as Language
  const direction = (session.user.studyDirection ?? "to_slavic") as StudyDirection

  const [storyRows, lineRows, levelRows, categoryRows, progress] = await Promise.all([
    db.select().from(stories).where(eq(stories.published, true)),
    db.select({
      storyId: storyLines.storyId, serbian: storyLines.serbian, croatian: storyLines.croatian, english: storyLines.english,
    }).from(storyLines).innerJoin(stories, and(eq(storyLines.storyId, stories.id), eq(stories.published, true))),
    db.select().from(levels).orderBy(levels.id),
    db.select().from(categories),
    db.select().from(userStoryProgress).where(eq(userStoryProgress.userId, userId)),
  ])

  const levelId = params.level ? parseInt(params.level) : null
  const categoryId = params.category ? parseInt(params.category) : null
  const hrefWith = (next: { level?: number | null; category?: number | null }) => {
    const level = "level" in next ? next.level : levelId
    const category = "category" in next ? next.category : categoryId
    const query = new URLSearchParams()
    if (level) query.set("level", String(level))
    if (category) query.set("category", String(category))
    const qs = query.toString()
    return qs ? `/stories?${qs}` : "/stories"
  }

  const usedLevels = levelRows.filter(l => storyRows.some(s => s.levelId === l.id))
  const usedCategories = categoryRows
    .filter(c => storyRows.some(s => s.categoryId === c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const levelOrder = new Map(levelRows.map((l, i) => [l.id, i]))
  const levelName = new Map(levelRows.map(l => [l.id, l.name]))
  const categoryName = new Map(categoryRows.map(c => [c.id, c.name]))
  const understood = new Map(progress.map(p => [p.storyId, p.understanding]))

  const visible = storyRows
    .filter(s => (!levelId || s.levelId === levelId) && (!categoryId || s.categoryId === categoryId))
    .sort((a, b) =>
      (levelOrder.get(a.levelId) ?? 0) - (levelOrder.get(b.levelId) ?? 0) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
    )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Dashboard
          </Link>
          <span className="font-bold text-slate-900">Stories</span>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Stories</h1>
        <p className="text-slate-500 mt-1">Short reads you can finish in a few minutes. Tap a line if you get stuck.</p>

        {usedLevels.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip href={hrefWith({ level: null })} active={!levelId}>All levels</Chip>
              {usedLevels.map(l => (
                <Chip key={l.id} href={hrefWith({ level: l.id })} active={levelId === l.id}>{l.name}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip href={hrefWith({ category: null })} active={!categoryId}>All categories</Chip>
              {usedCategories.map(c => (
                <Chip key={c.id} href={hrefWith({ category: c.id })} active={categoryId === c.id}>{c.name}</Chip>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {visible.length === 0 && (
            <p className="text-slate-500 py-10 text-center">
              {storyRows.length === 0 ? "The first stories are on their way." : "No stories match these filters yet."}
            </p>
          )}
          {visible.map(story => {
            const lines = lineRows
              .filter(l => l.storyId === story.id)
              .map(l => readingPair(l, language, direction).target)
            const title = readingPair(
              { serbian: story.titleSr, croatian: story.titleHr, english: story.titleEn }, language, direction,
            )
            const result = understood.get(story.id)
            return (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-violet-100 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                      {title.target}
                    </h2>
                    <p className="text-sm text-slate-500">{title.translation}</p>
                  </div>
                  {result && (
                    <span className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                      {understandingLabel(result)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {levelName.get(story.levelId)} · {categoryName.get(story.categoryId)} · {readingMinutes(lines)} min read
                </p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
