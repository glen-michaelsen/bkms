import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { logoutAction } from "@/app/actions"

const languageInfo = {
  sr: { label: "Serbian", flag: "🇷🇸", native: "Srpski" },
  hr: { label: "Croatian", flag: "🇭🇷", native: "Hrvatski" },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const lang = languageInfo[session.user.language as "sr" | "hr"] ?? {
    label: session.user.language,
    flag: "🌍",
    native: "",
  }
  const firstName = session.user.email.split("@")[0]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <span className="font-extrabold text-violet-600 text-lg tracking-tight">Nauči</span>
          <div className="flex items-center gap-5">
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-slate-400 hidden sm:block">{session.user.email}</span>
            <form action={logoutAction}>
              <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full mb-4">
            <span>{lang.flag}</span>
            <span>
              {lang.label} · {lang.native}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
            Hey {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            What would you like to practice today?
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/study/words"
            className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-violet-200 transition-colors">
                📖
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                Train Words
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Practise vocabulary — translate single words between English and {lang.label}.
              </p>
              <div className="mt-5 flex items-center text-violet-600 text-sm font-semibold">
                Start session
                <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/study/sentences"
            className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-fuchsia-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-fuchsia-200 transition-colors">
                💬
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                Train Sentences
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Build fluency with full phrases — common everyday sentences in {lang.label}.
              </p>
              <div className="mt-5 flex items-center text-fuchsia-600 text-sm font-semibold">
                Start session
                <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-slate-400 mt-10">
          Each session is 10 items — a mix of multiple choice and free typing.
        </p>
      </main>
    </div>
  )
}
