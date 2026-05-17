import type { Metadata } from "next"
import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import { db } from "@/db"
import { words, categories } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Serbian & Croatian Words | Čujemo se",
  description:
    "Build your Serbian and Croatian vocabulary one category at a time. From first-day essentials to everyday life — all the words you need, ready to practise.",
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
    "The first words in any Serbian or Croatian conversation. Master these from day one — they open doors and immediately show you're making the effort.",
  "People and family":
    "Family vocabulary is personal and comes up constantly. Serbian and Croatian have rich, specific terms for family relationships that are worth learning early.",
  "Numbers and counting":
    "Numbers unlock everyday life — shopping, telling the time, giving your age. Once you learn the patterns, counting comes naturally.",
  "Time and dates":
    "Days, months, and time expressions are woven into almost every conversation. These are words you'll use from your very first week.",
  "Colors":
    "Simple, visual, and immediately useful. Colors help you describe the world around you and are great for building early confidence.",
}

export default async function WordsPage() {
  const [session, allCategories] = await Promise.all([auth(), db.select().from(categories)])

  const featuredCategories = FEATURED_NAMES.map((name) =>
    allCategories.find((c) => c.name === name)
  ).filter(Boolean) as (typeof allCategories)[number][]

  const featuredIds = featuredCategories.map((c) => c.id)

  const featuredWords =
    featuredIds.length > 0
      ? await db.select().from(words).where(inArray(words.categoryId, featuredIds))
      : []

  const wordsByCategory = new Map<number, typeof featuredWords>()
  for (const word of featuredWords) {
    if (word.categoryId == null) continue
    if (!wordsByCategory.has(word.categoryId)) wordsByCategory.set(word.categoryId, [])
    wordsByCategory.get(word.categoryId)!.push(word)
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
            Vocabulary
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Serbian &amp; Croatian Words
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed">
            Build your vocabulary one category at a time. From first-day essentials to everyday life
            — all the words you need, ready to practise.
          </p>
        </section>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-5 py-16 space-y-20">
        {/* Featured category sections */}
        {featuredCategories.map((cat) => {
          const catWords = (wordsByCategory.get(cat.id) ?? []).slice(0, 6)
          return (
            <section key={cat.id}>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">{cat.name}</h2>
              <p className="text-sm text-slate-500 mb-5">{INTROS[cat.name]}</p>
              {catWords.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catWords.map((word) => (
                    <div
                      key={word.id}
                      className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm"
                    >
                      <p className="text-xs text-slate-400 font-medium mb-1">{word.english}</p>
                      <p className="text-lg font-bold text-violet-700">{word.serbian}</p>
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
              <span
                key={cat.id}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full"
              >
                {cat.name}
              </span>
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
