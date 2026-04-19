import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { logoutAction } from "@/app/actions"

const languageLabel = { sr: "Serbian", hr: "Croatian" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const lang = languageLabel[session.user.language as "sr" | "hr"] ?? session.user.language

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Serbian & Croatian Learner</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{session.user.email}</span>
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Admin
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900">
            Ready to practice {lang}?
          </h1>
          <p className="text-slate-500 mt-1">Choose a training mode below. Each session is 10 items.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/study/words"
            className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">📖</div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Train Words
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Practice vocabulary — translate individual words between English and {lang}.
            </p>
          </Link>

          <Link
            href="/study/sentences"
            className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">💬</div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Train Sentences
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Practice full sentences — build fluency with common phrases in {lang}.
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
