import type { Metadata } from "next"
import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import { db } from "@/db"
import { sentences, categories } from "@/db/schema"
import { inArray } from "drizzle-orm"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Serbian & Croatian Sentences | Čujemo se",
  description:
    "Real phrases from everyday situations. Learn how words combine in context and start speaking with confidence sooner than you think.",
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const FEATURED_NAMES = [
  "Greetings",
  "People and family",
  "Numbers and counting",
  "Time and dates",
  "Colors",
]

const INTROS: Record<string, string> = {
  "Greetings":
    "How every Serbian and Croatian conversation begins and ends. These are the first phrases to get comfortable with — they show effort and open real exchanges.",
  "People and family":
    "Introducing yourself and talking about the people in your life. These sentences give you the building blocks for genuine personal conversations.",
  "Numbers and counting":
    "From shopping to making plans, number-based sentences come up everywhere. Understanding them in context is far more useful than just memorising a list.",
  "Time and dates":
    "Arranging meetings, talking about your schedule, describing when things happen — time expressions are essential in almost every conversation.",
  "Colors":
    "Describing what you see, what you're wearing, or what you want. Short, memorable sentences that build confidence quickly.",
}

export default async function SentencesPage() {
  const [session, allCategories] = await Promise.all([auth(), db.select().from(categories)])

  const featuredCategories = FEATURED_NAMES.map((name) =>
    allCategories.find((c) => c.name === name)
  ).filter(Boolean) as (typeof allCategories)[number][]

  const featuredIds = featuredCategories.map((c) => c.id)

  const featuredSentences =
    featuredIds.length > 0
      ? await db.select().from(sentences).where(inArray(sentences.categoryId, featuredIds))
      : []

  const sentencesByCategory = new Map<number, typeof featuredSentences>()
  for (const sentence of featuredSentences) {
    if (sentence.categoryId == null) continue
    if (!sentencesByCategory.has(sentence.categoryId))
      sentencesByCategory.set(sentence.categoryId, [])
    sentencesByCategory.get(sentence.categoryId)!.push(sentence)
  }

  const otherCategories = allCategories.filter((c) => !FEATURED_NAMES.includes(c.name))

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero (gradient panel) ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-violet-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />

        <div className="relative z-10">
          <MarketingNav variant="dark" />
        </div>

        <section className="relative z-10 max-w-5xl mx-auto px-5 pt-16 pb-28 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white mb-6">
            Phrases &amp; sentences
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Serbian &amp; Croatian Sentences
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed">
            Real phrases from everyday situations. Learn how words combine in context and start
            speaking with confidence sooner than you think.
          </p>
        </section>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-5 py-16 space-y-20">
        {/* Featured category sections */}
        {featuredCategories.map((cat) => {
          const catSentences = (sentencesByCategory.get(cat.id) ?? []).slice(0, 6)
          return (
            <section key={cat.id}>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                <Link href={`/categories/${toSlug(cat.name)}`} className="hover:text-violet-600 transition-colors">
                  {cat.name}
                </Link>
              </h2>
              <p className="text-sm text-slate-500 mb-5">{INTROS[cat.name]}</p>
              {catSentences.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catSentences.map((sentence) => (
                    <div
                      key={sentence.id}
                      className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm"
                    >
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        English
                      </p>
                      <p className="text-sm text-slate-700 mb-3">{sentence.english}</p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Serbian &amp; Croatian
                      </p>
                      <p className="text-base font-semibold text-violet-700">{sentence.serbian}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {/* More categories */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">More categories</h2>
          <p className="text-sm text-slate-500 mb-5">Sign up to practise all categories in the app.</p>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${toSlug(cat.name)}`}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full hover:bg-violet-100 hover:text-violet-700 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-14 text-center shadow-lg">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to practise?</h2>
          <p className="text-violet-200 mb-8 text-base">
            Create a free account and start your first session in minutes.
          </p>
          <Link
            href={session ? "/dashboard" : "/register"}
            className="inline-flex items-center px-7 py-3.5 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
          >
            {session ? "Go to dashboard →" : "Start learning free →"}
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
        Čujemo se · cujemose.com
      </footer>
    </div>
  )
}
