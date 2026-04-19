import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words, sentences, categories, levels } from "@/db/schema"
import { AddItemForm } from "@/components/AddItemForm"
import { AddNamedItem } from "@/components/AddNamedItem"
import { CsvUpload } from "@/components/CsvUpload"
import { addCategoryAction, addLevelAction, deleteCategoryAction } from "@/app/actions"
import { eq } from "drizzle-orm"

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  const [allCategories, allLevels, allWords, allSentences] = await Promise.all([
    db.select().from(categories).orderBy(categories.id),
    db.select().from(levels).orderBy(levels.id),
    db.select().from(words).orderBy(words.id),
    db.select().from(sentences).orderBy(sentences.id),
  ])

  // Enrich words with category names
  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]))
  const levelMap = Object.fromEntries(allLevels.map((l) => [l.id, l.name]))

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Dashboard
          </Link>
          <span className="font-extrabold text-violet-600 text-lg tracking-tight">Nauči · Admin</span>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-14">

        {/* ── Categories & Levels ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Categories */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏷️</span>
              <h2 className="font-bold text-slate-900">Categories</h2>
              <span className="ml-auto text-sm text-slate-400">{allCategories.length}</span>
            </div>
            <AddNamedItem label="Category" placeholder="e.g. Food, Travel…" action={addCategoryAction} accent="violet" />
            {allCategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allCategories.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-violet-50 text-violet-700 text-sm font-medium rounded-full">
                    {c.name}
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-violet-200 text-violet-400 hover:text-violet-700 transition-colors text-xs leading-none"
                        title={`Delete ${c.name}`}
                      >
                        ×
                      </button>
                    </form>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Levels */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📊</span>
              <h2 className="font-bold text-slate-900">Levels</h2>
              <span className="ml-auto text-sm text-slate-400">{allLevels.length}</span>
            </div>
            <AddNamedItem label="Level" placeholder="e.g. Beginner, A1…" action={addLevelAction} accent="sky" />
            {allLevels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allLevels.map((l) => (
                  <span key={l.id} className="px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full">
                    {l.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Add content ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Add content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AddItemForm type="words" categories={allCategories} levels={allLevels} />
            <AddItemForm type="sentences" categories={allCategories} levels={allLevels} />
          </div>
        </section>

        {/* ── Bulk import ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Bulk import</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CsvUpload type="words" />
            <CsvUpload type="sentences" />
          </div>
        </section>

        {/* ── Words table ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">Words</h2>
            <span className="text-sm font-medium text-slate-400">{allWords.length} total</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allWords.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No words yet</td></tr>
                ) : allWords.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{w.english}</td>
                    <td className="px-5 py-3.5 text-slate-600">{w.serbian}</td>
                    <td className="px-5 py-3.5 text-slate-600">{w.croatian}</td>
                    <td className="px-5 py-3.5">
                      {w.categoryId ? (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                          {catMap[w.categoryId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Sentences table ───────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">Sentences</h2>
            <span className="text-sm font-medium text-slate-400">{allSentences.length} total</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">English</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Serbian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Croatian</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Category</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSentences.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No sentences yet</td></tr>
                ) : allSentences.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{s.english}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.serbian}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.croatian}</td>
                    <td className="px-5 py-3.5">
                      {s.categoryId ? (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                          {catMap[s.categoryId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.levelId ? (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-full">
                          {levelMap[s.levelId] ?? "—"}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
