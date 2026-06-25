import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, emailWelcomeSteps, emailSendLog, emailWelcomeEnrollments } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [steps, allUsers, enrollments, sentLog] = await Promise.all([
    db.select().from(emailWelcomeSteps).all(),
    db.select({ id: users.id, email: users.email, firstName: users.firstName, createdAt: users.createdAt })
      .from(users).all(),
    db.select({ userId: emailWelcomeEnrollments.userId, startedAt: emailWelcomeEnrollments.startedAt })
      .from(emailWelcomeEnrollments).all(),
    db.select({ userId: emailSendLog.userId, referenceId: emailSendLog.referenceId })
      .from(emailSendLog).where(eq(emailSendLog.type, "welcome")).all(),
  ])

  const enrollmentMap = new Map(enrollments.map(e => [e.userId, e.startedAt]))
  const sentPairs = new Set(sentLog.map(r => `${r.userId}:${r.referenceId}`))
  const now = new Date()

  // Sort steps by delay so we can find "previous step" for each
  const sorted = [...steps].sort((a, b) => a.delayDays - b.delayDays)

  const result = sorted.map((step, idx) => {
    const prevStep = idx > 0 ? sorted[idx - 1] : null
    const waiting: { id: number; email: string; firstName: string | null; enrolledAt: string }[] = []

    for (const user of allUsers) {
      if (!enrollmentMap.has(user.id)) continue  // only count explicitly enrolled users

      if (sentPairs.has(`${user.id}:${step.id}`)) continue  // already received this step

      // Sequential: must have actually received the previous step
      if (prevStep && !sentPairs.has(`${user.id}:${prevStep.id}`)) continue

      const enrolledAt = enrollmentMap.get(user.id)!
      const baseline = new Date(enrolledAt)
      const daysSince = (now.getTime() - baseline.getTime()) / 86_400_000

      if (daysSince >= step.delayDays) continue  // already eligible — cron will send it shortly

      waiting.push({ id: user.id, email: user.email, firstName: user.firstName, enrolledAt })
    }

    return { stepId: step.id, waiting }
  })

  return NextResponse.json(result)
}
