import { NextResponse } from "next/server"
import { db } from "@/db"
import { users, emailWelcomeSteps, emailSendLog, emailWelcomeEnrollments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/resend"
import { parseBlocks, renderEmail } from "@/lib/email-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const steps = await db.select().from(emailWelcomeSteps)
    .where(eq(emailWelcomeSteps.active, true)).all()

  if (!steps.length) return NextResponse.json({ sent: 0, skipped: 0 })

  const allUsers = (await db.select({
    id: users.id, email: users.email, firstName: users.firstName, createdAt: users.createdAt,
    newsletterEnabled: users.newsletterEnabled,
  }).from(users).all()).filter(u => u.newsletterEnabled !== false)

  // Build a map of userId → flow start date from manual enrollments
  const enrollments = await db.select({
    userId: emailWelcomeEnrollments.userId,
    startedAt: emailWelcomeEnrollments.startedAt,
  }).from(emailWelcomeEnrollments).all()
  const enrollmentMap = new Map(enrollments.map(e => [e.userId, e.startedAt]))

  const sentPairs = new Set(
    (await db.select({ userId: emailSendLog.userId, referenceId: emailSendLog.referenceId })
      .from(emailSendLog).where(eq(emailSendLog.type, "welcome")).all())
      .map(r => `${r.userId}:${r.referenceId}`)
  )

  const now = new Date()
  let sent = 0, skipped = 0

  for (const step of steps) {
    for (const user of allUsers) {
      if (!enrollmentMap.has(user.id)) { skipped++; continue }  // only send to enrolled users

      if (sentPairs.has(`${user.id}:${step.id}`)) { skipped++; continue }

      const baselineStr = enrollmentMap.get(user.id)!
      const baseline = new Date(baselineStr)

      const daysSinceBaseline = (now.getTime() - baseline.getTime()) / 86_400_000
      if (daysSinceBaseline < step.delayDays) { skipped++; continue }

      try {
        const blocks = parseBlocks(step.body)
        const html   = renderEmail(step.subject, blocks)
        await sendEmail({ to: user.email, subject: step.subject, html })
        await db.insert(emailSendLog).values({
          userId: user.id, type: "welcome", referenceId: step.id, sentAt: now.toISOString(),
        })
        sent++
      } catch (err) {
        console.error(`email-welcome: failed step ${step.id} user ${user.id}`, err)
      }
    }
  }

  return NextResponse.json({ sent, skipped })
}
