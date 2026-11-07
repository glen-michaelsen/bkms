import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { and, asc, eq } from "drizzle-orm"
import { BookText, Check } from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/db"
import { categories, levels, stories, storyLines, userStoryProgress } from "@/db/schema"
import {
  readingMinutes, readingPair, storyImageSrcSet, storyImageUrl, understandingLabel, type Language, type StudyDirection,
} from "@/lib/stories"

export const metadata: Metadata = { title: "Stories | Čujemo se" }

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`px-3.5 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
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
    }).from(storyLines)
      .innerJoin(stories, and(eq(storyLines.storyId, stories.id), eq(stories.published, true)))
      .orderBy(asc(storyLines.position)),
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
  const levelName = new Map(levelRows.map(l => [l.id, l.name]))
  const categoryName = new Map(categoryRows.map(c => [c.id, c.name]))
  const understood = new Map(progress.map(p => [p.storyId, p.understanding]))

  const visible = storyRows
    .filter(s => (!levelId || s.levelId === levelId) && (!categoryId || s.categoryId === categoryId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-12">
        <header className="max-w-2xl">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Stories</h1>
          <p className="text-lg text-slate-500 mt-3">
            Short reads you can finish in a few minutes. Tap a line if you get stuck.
          </p>
        </header>

        {usedLevels.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip href={hrefWith({ level: null })} active={!levelId}>All levels</Chip>
              {usedLevels.map(l => (
                <Chip key={l.id} href={hrefWith({ level: l.id })} active={levelId === l.id}>{l.name}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip href={hrefWith({ category: null })} active={!categoryId}>All topics</Chip>
              {usedCategories.map(c => (
                <Chip key={c.id} href={hrefWith({ category: c.id })} active={categoryId === c.id}>{c.name}</Chip>
              ))}
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-slate-500 py-20 text-center">
            {storyRows.length === 0 ? "The first stories are on their way." : "No stories match these filters yet."}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
            {visible.map(story => {
              const lines = lineRows
                .filter(l => l.storyId === story.id)
                .map(l => readingPair(l, language, direction).target)
              const title = readingPair(
                { serbian: story.titleSr, croatian: story.titleHr, english: story.titleEn }, language, direction,
              )
              const result = understood.get(story.id)
              return (
                <Link key={story.id} href={`/stories/${story.slug}`} className="group flex flex-col">
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-violet-600">
                    {story.imageVersion ? (
                      <img
                        src={storyImageUrl(story.id, story.imageVersion, 480)}
                        srcSet={storyImageSrcSet(story.id, story.imageVersion)}
                        sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
                        alt=""
                        width={480}
                        height={480}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />
                        <BookText className="absolute inset-0 m-auto w-14 h-14 text-white/90" />
                      </>
                    )}
                    {result && (
                      <span className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full bg-white text-emerald-700 shadow-sm">
                        <Check className="w-3.5 h-3.5" />{understandingLabel(result)}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-semibold text-violet-600">
                    {levelName.get(story.levelId)} · {categoryName.get(story.categoryId)}
                  </p>
                  <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-violet-700 transition-colors">
                    {title.target}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">{title.translation}</p>
                  <p className="mt-2.5 text-slate-600 leading-relaxed line-clamp-2">{lines.slice(0, 3).join(" ")}</p>
                  <p className="mt-3 text-xs text-slate-400">{readingMinutes(lines)} min read</p>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
