import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import MarketingNav from "@/components/MarketingNav"
import { db } from "@/db"
import { words, sentences, categories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const CATEGORY_INTROS: Record<string, string> = {
  "Greetings": "The first words in any Serbian or Croatian conversation. Master these from day one — they open doors and immediately show you're making the effort.",
  "People and family": "Family vocabulary is personal and comes up constantly. Serbian and Croatian have rich, specific terms for family relationships worth learning early.",
  "Numbers and counting": "Numbers unlock everyday life — shopping, telling the time, giving your age. Once you learn the patterns, counting comes naturally.",
  "Time and dates": "Days, months, and time expressions are woven into almost every conversation. These are words you'll use from your very first week.",
  "Colors": "Simple, visual, and immediately useful. Colors help you describe the world around you and are great for building early confidence.",
  "Body and health": "Essential vocabulary for doctors, pharmacies, and everyday wellbeing. Knowing how to describe how you feel is invaluable.",
  "Clothes": "Whether you're shopping, packing, or just describing what you're wearing, clothes vocabulary is practical from day one.",
  "Common adjectives": "Adjectives bring language to life. These high-frequency descriptors are used in almost every sentence — learn them and everything becomes more expressive.",
  "Common verbs": "Verbs are the engine of every sentence. These core action words are the ones you'll reach for again and again in Serbian and Croatian.",
  "Daily routines": "The language of everyday life — waking up, eating, working, relaxing. Mastering these words makes your whole day feel more natural.",
  "Days, months, seasons": "Essential building blocks for talking about time and plans. You'll use these words every single day.",
  "Directions": "Getting around is much easier when you can ask for — and understand — directions. These words are lifesavers on the street.",
  "Emotions and feelings": "Language is about connection, and connection starts with feelings. These words help you express yourself and understand others on a deeper level.",
  "Food and drinks": "One of the most enjoyable categories to learn. Whether at a restaurant, a market, or a friend's kitchen, food vocabulary is endlessly useful.",
  "Hobbies and free time": "Talking about what you enjoy is a great way to connect. These words let you share your interests and ask about others'.",
  "Home and furniture": "Whether describing where you live or understanding a landlord, knowing your way around the home is practical from day one.",
  "Places": "Navigating a city, planning a trip, or simply knowing where things are — places vocabulary is essential for getting around.",
  "Pronouns and basics": "The foundation of every sentence. Pronouns and grammatical basics are the scaffolding that holds everything else together.",
  "Question words": "Questions are how you learn. Mastering question words lets you have real conversations even when your vocabulary is still growing.",
  "Shopping": "From markets to malls, shopping vocabulary is immediately practical. Prices, sizes, and common phrases make every transaction smoother.",
  "Technology": "Modern life runs on technology, and so does modern conversation. These words let you talk about the devices and apps that shape daily life.",
  "Transportation": "Getting from A to B is much smoother when you know the right words for transport, tickets, and timetables.",
  "Weather": "Weather is everyone's favourite small talk. Simple to learn and comes up in conversation more often than you'd think.",
  "Work and school": "Whether studying, working, or curious about someone's day, work and school vocabulary is central to everyday adult conversation.",
}

export async function generateStaticParams() {
  const allCats = await db.select({ name: categories.name }).from(categories)
  return allCats.map((c) => ({ slug: toSlug(c.name) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const allCats = await db.select().from(categories)
  const cat = allCats.find((c) => toSlug(c.name) === slug)
  if (!cat) return {}
  return { title: `Learn ${cat.name} in Serbian & Croatian | Čujemo se` }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const allCats = await db.select().from(categories)
  const cat = allCats.find((c) => toSlug(c.name) === slug)
  if (!cat) notFound()

  const [session, catWords, catSentences] = await Promise.all([
    auth(),
    db.select().from(words).where(eq(words.categoryId, cat.id)).limit(6),
    db.select().from(sentences).where(eq(sentences.categoryId, cat.id)).limit(6),
  ])

  const intro = CATEGORY_INTROS[cat.name] ?? "Explore this category to build your Serbian and Croatian vocabulary."

  return (
    <div className="min-h-screen bg-white">
      {/* ── Gradient hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-violet-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />

        <div className="relative z-10">
          <MarketingNav variant="dark" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-14 pb-24">
          <Link
            href="/words"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors mb-6"
          >
            ← All categories
          </Link>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Learn {cat.name} in Serbian &amp; Croatian
          </h1>
          <p className="mt-5 text-white/75 leading-relaxed max-w-2xl text-lg">{intro}</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-16 space-y-16">
        {/* Words section */}
        {catWords.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-5">Words</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catWords.map((word) => (
                <div key={word.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">{word.english}</p>
                  <p className="text-lg font-bold text-violet-700">{word.serbian}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sentences section */}
        {catSentences.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-5">Sentences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catSentences.map((sentence) => (
                <div key={sentence.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">English</p>
                  <p className="text-sm text-slate-700 mb-3">{sentence.english}</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Serbian &amp; Croatian</p>
                  <p className="text-base font-semibold text-violet-700">{sentence.serbian}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA banner */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-14 text-center shadow-lg">
          <h2 className="text-3xl font-extrabold text-white mb-3">Practise {cat.name} in the app</h2>
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
