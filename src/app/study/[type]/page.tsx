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

  const label = type === "words" ? "Words" : "Sentences"

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
            ← Dashboard
          </Link>
          <span className="font-semibold text-slate-700">Training {label}</span>
          <div className="w-16" />
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <StudySession type={type as "words" | "sentences"} />
      </main>
    </div>
  )
}
