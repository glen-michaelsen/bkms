import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SettingsForm } from "@/components/SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            ← Dashboard
          </Link>
          <span className="font-extrabold text-violet-600 text-lg tracking-tight">Nauči</span>
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
        />
      </main>
    </div>
  )
}
