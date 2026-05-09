import { NextResponse } from "next/server"
import { db } from "@/db"
import { users, userDailyActivity } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendStreakReminder, localHour, localDateString } from "@/lib/resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      timezone: users.timezone,
      streakMailHour: users.streakMailHour,
      streakMailLastSentDate: users.streakMailLastSentDate,
    })
    .from(users)
    .where(eq(users.streakMailEnabled, true))
    .all()

  let sent = 0
  let skipped = 0

  for (const user of allUsers) {
    try {
      const tz = user.timezone ?? "Europe/Belgrade"
      const userLocalHour = localHour(tz)
      const userLocalDate = localDateString(tz)

      // Only send at the user's chosen hour
      if (userLocalHour !== user.streakMailHour) { skipped++; continue }
      // Don't send twice in the same day
      if (user.streakMailLastSentDate === userLocalDate) { skipped++; continue }

      // Check if they've already trained today (UTC date used for activity tracking)
      const todayUtc = new Date().toISOString().slice(0, 10)
      const activity = await db
        .select({ id: userDailyActivity.id })
        .from(userDailyActivity)
        .where(and(eq(userDailyActivity.userId, user.id), eq(userDailyActivity.date, todayUtc)))
        .get()

      if (activity) { skipped++; continue } // Already trained — no nudge needed

      await sendStreakReminder({ to: user.email, firstName: user.firstName })
      await db
        .update(users)
        .set({ streakMailLastSentDate: userLocalDate })
        .where(eq(users.id, user.id))
      sent++
    } catch (err) {
      console.error(`streak-mail: failed for user ${user.id}`, err)
    }
  }

  return NextResponse.json({ sent, skipped })
}
