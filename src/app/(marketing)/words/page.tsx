import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import { words, categories } from "@/db/schema"
import { asc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Serbian & Croatian Vocabulary | Čujemo se",
  description:
    "Browse Serbian and Croatian vocabulary — hundreds of words across everyday categories. Learn with spaced repetition on Čujemo se.",
}

const CATEGORY_COLORS: Record<string, string> = {
  Family:       "bg-rose-100 text-rose-700",
  Food:         "bg-orange-100 text-orange-700",
  Travel:       "bg-sky-100 text-sky-700",
  Numbers:      "bg-amber-100 text-amber-700",
  Time:         "bg-violet-100 text-violet-700",
  Body:         "bg-pink-100 text-pink-700",
  Nature:       "bg-emerald-100 text-emerald-700",
  People:       "bg-indigo-100 text-indigo-700",
  Emotions:     "bg-fuchsia-100 text-fuchsia-700",
  Everyday:     "bg-teal-100 text-teal-700",
}

export default async function WordsPage() {
  const session = await auth()

  const [allWords, allCategories] = await Promise.all([
    db.select().from(words).orderBy(asc(words.id)).limit(60),
    db.select().from(categories),
  ])

  const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]))

  // Group words by category for display
  const grouped = new Map<string, typeof allWords>()
  for (const word of allWords) {
    const catName = word.categoryId ? (categoryMap.get(word.categoryId) ?? "Other") : "Other"
    if (!grouped.has(catName)) grouped.set(catName, [])
    grouped.get(catName)!.push(word)
  }

  const totalWords = allWords.length

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Serbian &amp; Croatian Vocabulary
        </h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Building a strong vocabulary is the foundation of any language. Our word list covers
          everyday Serbian and Croatian — two closely related languages that share the vast majority
          of their core vocabulary. Use spaced repetition in the app to remember words long-term, not
          just for the day.
        </p>
      </div>

      {/* Words table */}
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
            {allWords.map((word) => {
              const catName = word.categoryId ? (categoryMap.get(word.categoryId) ?? null) : null
              return (
                <tr key={word.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-slate-700">{word.english}</td>
                  <td className="px-6 py-3 font-semibold text-violet-700">{word.serbian}</td>
                  <td className="px-6 py-3 hidden sm:table-cell">
                    {catName && (
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[catName] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {catName}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-400 text-center">
        Showing {totalWords} words. Sign up to practise all of them with spaced repetition.
      </p>

      {/* CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-12 text-center shadow-md">
        <h2 className="text-2xl font-extrabold text-white mb-2">Practise these words in the app</h2>
        <p className="text-violet-200 text-sm mb-6">
          Spaced repetition means you review each word exactly when you&apos;re about to forget it.
        </p>
        <Link
          href={session ? "/dashboard" : "/register"}
          className="inline-flex items-center px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
        >
          {session ? "Go to dashboard →" : "Start practising free →"}
        </Link>
      </div>
    </div>
  )
}
