import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SettingsForm } from "@/components/SettingsForm"
import { db } from "@/db"
import { levels, userLevelConfig } from "@/db/schema"
import { eq } from "drizzle-orm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [allLevels, levelConfig] = await Promise.all([
    db.select().from(levels).orderBy(levels.id),
    db
      .select()
      .from(userLevelConfig)
      .where(eq(userLevelConfig.userId, parseInt(session.user.id))),
  ])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Dashboard
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and preferences</p>
        </div>

        <SettingsForm
          initialFirstName={session.user.firstName ?? ""}
          initialEmail={session.user.email}
          initialLanguage={session.user.language}
          initialGender={session.user.gender}
          levels={allLevels.map((l) => ({ id: l.id, name: l.name }))}
          levelConfig={levelConfig.map((c) => ({ levelId: c.levelId, percentage: c.percentage }))}
        />
      </main>
    </div>
  )
}
