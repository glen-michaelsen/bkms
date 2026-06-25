import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { users, userDailyActivity } from "@/db/schema"
import { desc } from "drizzle-orm"
import { AdminUserList } from "@/components/AdminUserList"

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function calcStreak(actMap: Map<string, number>, today: string): number {
  let d = actMap.has(today) ? today : prevDay(today)
  let streak = 0
  while ((actMap.get(d) ?? 0) > 0) { streak++; d = prevDay(d) }
  return streak
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  const today = new Date().toISOString().slice(0, 10)

  const [allUsers, allActivity] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(userDailyActivity),
  ])

  const userRows = allUsers.map(u => {
    const acts   = allActivity.filter(a => a.userId === u.id)
    const actMap = new Map(acts.map(a => [a.date, a.answersCount]))
    const total  = acts.reduce((s, a) => s + a.answersCount, 0)
    const last   = acts.length > 0 ? acts.reduce((mx, a) => a.date > mx ? a.date : mx, "") : null
    return {
      id:             u.id,
      email:          u.email,
      firstName:      u.firstName,
      language:       u.language,
      studyDirection: u.studyDirection,
      createdAt:      u.createdAt,
      lastActive:     last,
      streak:         calcStreak(actMap, today),
      totalAnswers:   total,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Admin
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Čujemo se" className="h-6" />
            <span className="text-slate-400 font-medium text-sm">· Users</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">All users</h1>
          <p className="text-sm text-slate-500 mt-1">{userRows.length} registered · click any column to sort</p>
        </div>
        <AdminUserList rows={userRows} />
      </main>
    </div>
  )
}
