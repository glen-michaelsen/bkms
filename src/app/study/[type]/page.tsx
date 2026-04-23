import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { StudySession } from "@/components/StudySession"

export default async function StudyPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { type } = await params
  if (type !== "words" && type !== "sentences") redirect("/dashboard")

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
        <StudySession type={type as "words" | "sentences"} />
      </main>
    </div>
  )
}
