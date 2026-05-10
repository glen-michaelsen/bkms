import { NextResponse } from "next/server"
import { db } from "@/db"
import { users, verbs } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { sendVerbOfDay, localHour, localDateString } from "@/lib/resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SEND_HOUR = 8 // 8 AM in user's local timezone

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allVerbs = await db
    .select()
    .from(verbs)
    .orderBy(asc(verbs.sortOrder), asc(verbs.id))
    .all()

  if (allVerbs.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, reason: "no verbs" })
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      language: users.language,
      timezone: users.timezone,
      verbOfDayEnabledAt: users.verbOfDayEnabledAt,
      verbMailLastSentDate: users.verbMailLastSentDate,
    })
    .from(users)
    .where(eq(users.verbOfDayEnabled, true))
    .all()

  let sent = 0
  let skipped = 0

  for (const user of allUsers) {
    try {
      const tz = user.timezone ?? "Europe/Belgrade"
      const userLocalHour = localHour(tz)
      const userLocalDate = localDateString(tz)

      // Only send at 8 AM local time
      if (userLocalHour !== SEND_HOUR) { skipped++; continue }
      // Don't send twice on the same day
      if (user.verbMailLastSentDate === userLocalDate) { skipped++; continue }

      // Compute which verb they're on
      const startDate = user.verbOfDayEnabledAt ?? userLocalDate
      const dayIndex = Math.max(0, daysBetween(startDate, userLocalDate))
      const verbIndex = dayIndex % allVerbs.length
      const verb = allVerbs[verbIndex]
      const verbNumber = verbIndex + 1

      await sendVerbOfDay({ to: user.email, firstName: user.firstName, verb, verbNumber, language: user.language })
      await db
        .update(users)
        .set({ verbMailLastSentDate: userLocalDate })
        .where(eq(users.id, user.id))
      sent++
    } catch (err) {
      console.error(`verb-of-day: failed for user ${user.id}`, err)
    }
  }

  return NextResponse.json({ sent, skipped })
}
