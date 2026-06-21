import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NumbersExercise } from "@/components/NumbersExercise"
import type { Lang } from "@/lib/numbers"

export default async function NumbersPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const language  = (session.user.language ?? "sr") as "sr" | "hr"
  const isEnglish = (session.user.studyDirection ?? "to_slavic") === "to_english"
  const lang: Lang = isEnglish ? "en" : language
  const langName   = isEnglish ? "English" : language === "hr" ? "Croatian" : "Serbian"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Back
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Numbers in {langName}</h1>
          <p className="text-sm text-slate-500 mt-1">Browse key numbers · or type any number to see it spelled out</p>
        </div>
        <NumbersExercise lang={lang} langName={langName} />
      </main>
    </div>
  )
}
