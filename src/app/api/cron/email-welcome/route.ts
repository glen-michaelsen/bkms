import { NextResponse } from "next/server"
import { db } from "@/db"
import { users, emailWelcomeSteps, emailSendLog } from "@/db/schema"
import { eq, and } from "drizzle-orm"
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

  const allUsers = await db.select({
    id: users.id, email: users.email, firstName: users.firstName, createdAt: users.createdAt,
  }).from(users).all()

  const sentPairs = new Set(
    (await db.select({ userId: emailSendLog.userId, referenceId: emailSendLog.referenceId })
      .from(emailSendLog).where(eq(emailSendLog.type, "welcome")).all())
      .map(r => `${r.userId}:${r.referenceId}`)
  )

  const now = new Date()
  let sent = 0, skipped = 0

  for (const step of steps) {
    for (const user of allUsers) {
      if (sentPairs.has(`${user.id}:${step.id}`)) { skipped++; continue }

      const signupDate = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt ?? 0)
      const daysSinceSignup = (now.getTime() - signupDate.getTime()) / 86_400_000
      if (daysSinceSignup < step.delayDays) { skipped++; continue }

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
