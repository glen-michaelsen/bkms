import { NextResponse } from "next/server"
import { db } from "@/db"
import { emailCampaigns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { dispatchCampaign } from "@/lib/email-dispatch"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date().toISOString()
  const scheduled = await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.status, "scheduled")).all()

  const due = scheduled.filter(c => c.scheduledAt && c.scheduledAt <= now)
  if (!due.length) return NextResponse.json({ triggered: 0 })

  let sent = 0
  for (const campaign of due) {
    const result = await dispatchCampaign(campaign.id)
    sent += result.sent
  }

  return NextResponse.json({ triggered: due.length, sent })
}
