import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { EmailAdmin } from "@/components/EmailAdmin"

export default async function EmailAdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Admin
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Email</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome flows · campaigns · scheduling</p>
        </div>
        <EmailAdmin adminEmail={session.user.email!} />
      </main>
    </div>
  )
}
