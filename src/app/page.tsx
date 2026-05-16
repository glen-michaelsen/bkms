import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import MarketingNav from "@/components/MarketingNav"
import { BookOpen, MessageSquare, List, Gamepad2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Learn Serbian & Croatian | Čujemo se",
  description:
    "Free app to learn Serbian and Croatian — vocabulary, sentences, grammar cases, and daily practice games.",
}

const SAMPLE_WORDS = [
  { english: "mother",  word: "mama",       category: "Family" },
  { english: "father",  word: "tata",       category: "Family" },
  { english: "brother", word: "brat",       category: "Family" },
  { english: "sister",  word: "sestra",     category: "Family" },
  { english: "water",   word: "voda",       category: "Essentials" },
  { english: "school",  word: "škola",      category: "Essentials" },
  { english: "car",     word: "auto",       category: "Everyday" },
  { english: "friend",  word: "prijatelj",  category: "People" },
  { english: "house",   word: "kuća",       category: "Everyday" },
  { english: "day",     word: "dan",        category: "Time" },
  { english: "night",   word: "noć",        category: "Time" },
  { english: "thank you", word: "hvala",    category: "Essentials" },
]

const FEATURES = [
  {
    icon: BookOpen,
    title: "Vocabulary Training",
    description:
      "Learn words with spaced repetition. The app tracks what you know and revisits what you're still learning.",
  },
  {
    icon: MessageSquare,
    title: "Sentence Practice",
    description:
      "Move beyond single words. Practise real phrases and sentences to build natural fluency.",
  },
  {
    icon: List,
    title: "Grammatical Cases",
    description:
      "Master all 7 cases with clear explanations, endings tables, and example sentences.",
  },
  {
    icon: Gamepad2,
    title: "Daily Games",
    description:
      "A new crossword and word-match puzzle every day to keep your streak alive and learning fun.",
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Family:     "bg-rose-100 text-rose-700",
  Essentials: "bg-emerald-100 text-emerald-700",
  Everyday:   "bg-sky-100 text-sky-700",
  People:     "bg-amber-100 text-amber-700",
  Time:       "bg-violet-100 text-violet-700",
}

export default async function HomePage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <main>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-5 py-24 text-center">
          {/* Badge */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-6">
            Free to use
          </span>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Learn Serbian &amp; Croatian
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
            Build real vocabulary, master grammar, and practise daily — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Go to dashboard →
                </Link>
                <Link
                  href="/words"
                  className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-full hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Explore words
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Start learning free →
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-4 py-3"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <section className="border-y border-slate-100 bg-slate-50">
          <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-3 divide-x divide-slate-200">
            {[
              { value: "7", label: "Grammatical cases" },
              { value: "Daily", label: "Practice sessions" },
              { value: "2 languages", label: "Serbian & Croatian" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-6">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards ──────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">
            Everything you need to learn
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample words table ─────────────────────────────────────── */}
        <section className="bg-slate-50 border-y border-slate-100 py-20">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              A taste of the vocabulary
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Serbian and Croatian share most everyday vocabulary. Here are some common words to get you started.
            </p>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 font-semibold text-slate-500">English</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-500">
                      Serbian &amp; Croatian
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-500 hidden sm:table-cell">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {SAMPLE_WORDS.map(({ english, word, category }) => (
                    <tr key={word} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-700">{english}</td>
                      <td className="px-6 py-3 font-semibold text-violet-700">{word}</td>
                      <td className="px-6 py-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            CATEGORY_COLORS[category] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center mt-5 text-sm text-slate-400">
              Hundreds more words waiting for you in the app.{" "}
              <Link href="/words" className="text-violet-600 font-medium hover:underline">
                Browse the vocabulary →
              </Link>
            </p>
          </div>
        </section>

        {/* ── CTA banner ─────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-5 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-14 text-center shadow-lg">
            <h2 className="text-3xl font-extrabold text-white mb-3">Ready to start?</h2>
            <p className="text-violet-200 mb-8 text-base">
              Create a free account and begin your first practice session in minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center px-7 py-3.5 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
            >
              Join for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
        Čujemo se · cujemose.com
      </footer>
    </div>
  )
}
