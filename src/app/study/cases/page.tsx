import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CasesStudy } from "@/components/CasesStudy"

export default async function CasesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const language = session.user.language as "sr" | "hr"
  const langLabel = language === "hr" ? "Croatian" : "Serbian"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            ← Back
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Grammatical Cases</h1>
          <p className="text-slate-500 mt-1">All 7 {langLabel} cases — tap a tab to explore each one</p>
        </div>

        <CasesStudy language={language} />
      </main>
    </div>
  )
}
