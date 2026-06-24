import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, emailWelcomeEnrollments } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET — return enrollment stats
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [allUsers, enrolled] = await Promise.all([
    db.select({ id: users.id, email: users.email, firstName: users.firstName })
      .from(users).all(),
    db.select({ userId: emailWelcomeEnrollments.userId })
      .from(emailWelcomeEnrollments).all(),
  ])

  const enrolledSet = new Set(enrolled.map(e => e.userId))

  return NextResponse.json({
    total: allUsers.length,
    enrolled: enrolledSet.size,
    unenrolled: allUsers.filter(u => !enrolledSet.has(u.id)),
  })
}

// POST — enroll users (idempotent — UNIQUE on userId, duplicate inserts silently ignored)
// Body: { userIds: number[] } | { all: true } | { email: string }
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const startedAt = new Date().toISOString()
  const enrolledBy = session.user.email ?? "admin"

  // Single-email enroll
  if (body.email) {
    const [user] = await db.select({ id: users.id })
      .from(users).where(eq(users.email, body.email.trim().toLowerCase())).all()
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const result = await db.insert(emailWelcomeEnrollments)
      .values({ userId: user.id, startedAt, enrolledBy })
      .onConflictDoNothing()

    const wasAlreadyEnrolled = (result as { rowsAffected?: number }).rowsAffected === 0
    return NextResponse.json({ enrolled: wasAlreadyEnrolled ? 0 : 1, alreadyEnrolled: wasAlreadyEnrolled })
  }

  let targetIds: number[]

  if (body.all) {
    const allUsers = await db.select({ id: users.id }).from(users).all()
    targetIds = allUsers.map(u => u.id)
  } else {
    targetIds = body.userIds as number[]
  }

  if (!targetIds.length) return NextResponse.json({ enrolled: 0 })

  let enrolled = 0
  for (const userId of targetIds) {
    await db.insert(emailWelcomeEnrollments)
      .values({ userId, startedAt, enrolledBy })
      .onConflictDoNothing()
    enrolled++
  }

  return NextResponse.json({ enrolled })
}
