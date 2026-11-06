import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { and, asc, eq, ne } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import {
  categories, levels, stories, storyLines, userItemProgress, userStoryProgress, verbs, words,
} from "@/db/schema"
import { StoryReader } from "@/components/StoryReader"
import {
  findKeyWords, readingMinutes, readingPair, storyImageSrcSet, storyImageUrl, type Language, type StudyDirection, type Understanding,
} from "@/lib/stories"

export const metadata: Metadata = { title: "Story | Čujemo se" }

/** The next unread story at the same difficulty, for the end-of-story link. */
async function nextStorySlug(currentId: number, levelId: number, userId: number): Promise<string | null> {
  const rows = await db.select({ slug: stories.slug, read: userStoryProgress.id })
    .from(stories)
    .leftJoin(userStoryProgress, and(
      eq(userStoryProgress.storyId, stories.id),
      eq(userStoryProgress.userId, userId),
    ))
    .where(and(eq(stories.levelId, levelId), eq(stories.published, true), ne(stories.id, currentId)))
  return rows.find(r => r.read === null)?.slug ?? null
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) redirect("/login")

  const { slug } = await params
  const story = await db.select().from(stories).where(eq(stories.slug, slug)).get()
  if (!story || (!story.published && session.user.role !== "admin")) notFound()

  const userId = parseInt(session.user.id)
  const language = session.user.language as Language
  const direction = (session.user.studyDirection ?? "to_slavic") as StudyDirection

  const [lineRows, level, category, wordRows, verbRows, progress, nextSlug] = await Promise.all([
    db.select().from(storyLines).where(eq(storyLines.storyId, story.id)).orderBy(asc(storyLines.position)),
    db.select().from(levels).where(eq(levels.id, story.levelId)).get(),
    db.select().from(categories).where(eq(categories.id, story.categoryId)).get(),
    db.select({
      serbian: words.serbian, croatian: words.croatian, english: words.english,
      serbianFemale: words.serbianFemale, croatianFemale: words.croatianFemale,
      correctCount: userItemProgress.correctCount,
      incorrectCount: userItemProgress.incorrectCount,
      streak: userItemProgress.streak,
    }).from(words).leftJoin(userItemProgress, and(
      eq(userItemProgress.itemId, words.id),
      eq(userItemProgress.itemType, "word"),
      eq(userItemProgress.userId, userId),
    )),
    db.select().from(verbs),
    db.select().from(userStoryProgress)
      .where(and(eq(userStoryProgress.storyId, story.id), eq(userStoryProgress.userId, userId))).get(),
    nextStorySlug(story.id, story.levelId, userId),
  ])

  const lines = lineRows.map(l => readingPair(l, language, direction))
  const targets = lines.map(l => l.target)
  const title = readingPair(
    { serbian: story.titleSr, croatian: story.titleHr, english: story.titleEn }, language, direction,
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/stories" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Stories
          </Link>
          <span className="text-sm text-slate-400">{readingMinutes(targets)} min read</span>
        </div>
      </nav>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-10">
        {story.imageVersion && (
          <img
            src={storyImageUrl(story.id, story.imageVersion, 480)}
            srcSet={storyImageSrcSet(story.id, story.imageVersion)}
            sizes="(max-width: 512px) 100vw, 472px"
            alt=""
            width={472}
            height={472}
            className="w-full aspect-square rounded-3xl object-cover mb-7"
          />
        )}
        <p className="text-xs font-semibold text-violet-600">{level?.name} · {category?.name}</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{title.target}</h1>
        <p className="text-slate-500 mt-1">{title.translation}</p>
        {!story.published && (
          <p className="mt-3 text-sm font-semibold text-amber-700">Draft: only admins can see this.</p>
        )}

        <StoryReader
          storyId={story.id}
          lines={lines}
          keyWords={findKeyWords(targets, wordRows, verbRows, language, direction)}
          initialUnderstanding={(progress?.understanding as Understanding | undefined) ?? null}
          nextSlug={nextSlug}
        />
      </main>
    </div>
  )
}
