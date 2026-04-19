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
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
            ← Dashboard
          </Link>
          <span className="font-semibold text-slate-700">Admin Panel</span>
          <div className="w-16" />
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-12">
        {/* Add items */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Add Content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AddItemForm type="words" />
            <AddItemForm type="sentences" />
          </div>
        </section>

        {/* Words table */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Words <span className="text-slate-400 font-normal text-base">({allWords.length})</span>
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">English</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Serbian</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Croatian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allWords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      No words yet
                    </td>
                  </tr>
                ) : (
                  allWords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{w.english}</td>
                      <td className="px-4 py-3 text-slate-600">{w.serbian}</td>
                      <td className="px-4 py-3 text-slate-600">{w.croatian}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sentences table */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Sentences <span className="text-slate-400 font-normal text-base">({allSentences.length})</span>
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">English</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Serbian</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Croatian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSentences.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      No sentences yet
                    </td>
                  </tr>
                ) : (
                  allSentences.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{s.english}</td>
                      <td className="px-4 py-3 text-slate-600">{s.serbian}</td>
                      <td className="px-4 py-3 text-slate-600">{s.croatian}</td>
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
