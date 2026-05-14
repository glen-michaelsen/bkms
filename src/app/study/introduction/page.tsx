import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { users, userProfile } from "@/db/schema"
import { eq } from "drizzle-orm"
import { buildIntro, isProfileComplete } from "@/lib/intro-builder"

const LANG_LABELS: Record<string, string> = { sr: "Serbian", hr: "Croatian" }

export default async function IntroductionPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = parseInt(session.user.id)
  const language = session.user.language as "sr" | "hr"

  const [profile, userRow] = await Promise.all([
    db.select().from(userProfile).where(eq(userProfile.userId, userId)).get(),
    db.select({ firstName: users.firstName }).from(users).where(eq(users.id, userId)).get(),
  ])

  const profileData = {
    firstName: userRow?.firstName,
    ...profile,
  }

  const hasContent = profile && isProfileComplete(profile)
  const intro = hasContent ? buildIntro(profileData, language) : null

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
          <h1 className="text-3xl font-extrabold text-slate-900">My Introduction</h1>
          <p className="text-slate-500 mt-1">Practice introducing yourself in {LANG_LABELS[language] ?? language}</p>
        </div>

        {!hasContent ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <p className="text-slate-500 mb-4">Fill in your personal details in Settings to generate your introduction.</p>
            <Link
              href="/settings"
              className="inline-block px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition"
            >
              Go to Settings →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Target language — primary */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
                  {LANG_LABELS[language] ?? language}
                </span>
              </div>
              <div className="px-6 py-6">
                <p className="text-xl font-medium text-slate-900 leading-relaxed">{intro!.target}</p>
              </div>
            </div>

            {/* English — reference */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">English</span>
              </div>
              <div className="px-6 py-6">
                <p className="text-lg text-slate-600 leading-relaxed">{intro!.english}</p>
              </div>
            </div>

            {/* Practice tips */}
            <div className="bg-violet-50 rounded-3xl border border-violet-100 px-6 py-5">
              <h3 className="text-sm font-bold text-violet-800 mb-2">How to practice</h3>
              <ul className="text-sm text-violet-700 space-y-1 list-disc list-inside">
                <li>Read the {LANG_LABELS[language] ?? language} version aloud several times</li>
                <li>Cover it and try to say it from memory using the English as a prompt</li>
                <li>Record yourself and listen back</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Link
                href="/settings"
                className="text-sm text-slate-400 hover:text-slate-600 transition"
              >
                Edit your details →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
