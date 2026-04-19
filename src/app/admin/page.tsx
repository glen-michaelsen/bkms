import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words, sentences } from "@/db/schema"
import { AddItemForm } from "@/components/AddItemForm"

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  const [allWords, allSentences] = await Promise.all([
    db.select().from(words).orderBy(words.createdAt),
    db.select().from(sentences).orderBy(sentences.createdAt),
  ])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            ← Dashboard
          </Link>
          <span className="font-extrabold text-violet-600 text-lg tracking-tight">
            Nauči · Admin
          </span>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-14">
        {/* Add section */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Add content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AddItemForm type="words" />
            <AddItemForm type="sentences" />
          </div>
        </section>

        {/* Words */}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allWords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                      No words yet — add some above
                    </td>
                  </tr>
                ) : (
                  allWords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{w.english}</td>
                      <td className="px-5 py-3.5 text-slate-600">{w.serbian}</td>
                      <td className="px-5 py-3.5 text-slate-600">{w.croatian}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sentences */}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSentences.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                      No sentences yet — add some above
                    </td>
                  </tr>
                ) : (
                  allSentences.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{s.english}</td>
                      <td className="px-5 py-3.5 text-slate-600">{s.serbian}</td>
                      <td className="px-5 py-3.5 text-slate-600">{s.croatian}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
