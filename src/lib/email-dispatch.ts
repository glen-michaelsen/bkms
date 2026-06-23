import { db } from "@/db"
import { emailCampaigns, emailSendLog, emailWelcomeSteps, users, userDailyActivity } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail } from "@/lib/resend"
import { parseBlocks, parseFilters, renderEmail, type CampaignFilters } from "@/lib/email-html"

// ── Campaign recipients ───────────────────────────────────────────────────────

export async function resolveRecipients(filters: CampaignFilters, campaignId: number) {
  const allUsers = await db.select().from(users).all()

  const alreadySent = new Set(
    (await db.select({ userId: emailSendLog.userId })
      .from(emailSendLog)
      .where(and(eq(emailSendLog.type, "campaign"), eq(emailSendLog.referenceId, campaignId)))
      .all()).map(r => r.userId)
  )

  let targets = allUsers.filter(u => !alreadySent.has(u.id))

  if (filters.languages?.length) {
    targets = targets.filter(u => {
      const lang = (u.studyDirection ?? "to_slavic") === "to_english"
        ? "en" : (u.language ?? "sr")
      return filters.languages!.includes(lang)
    })
  }

  if (filters.studyDirections?.length) {
    targets = targets.filter(u =>
      filters.studyDirections!.includes(u.studyDirection ?? "to_slavic")
    )
  }

  if (filters.createdAfter) {
    targets = targets.filter(u =>
      u.createdAt != null && u.createdAt.toISOString().slice(0, 10) >= filters.createdAfter!
    )
  }
  if (filters.createdBefore) {
    targets = targets.filter(u =>
      u.createdAt != null && u.createdAt.toISOString().slice(0, 10) <= filters.createdBefore!
    )
  }

  if (filters.lastActiveAfter || filters.lastActiveBefore) {
    const activity = await db.select({
      userId: userDailyActivity.userId, date: userDailyActivity.date,
    }).from(userDailyActivity).all()

    const latestActivity = new Map<number, string>()
    for (const a of activity) {
      const cur = latestActivity.get(a.userId)
      if (!cur || a.date > cur) latestActivity.set(a.userId, a.date)
    }
    if (filters.lastActiveAfter) {
      targets = targets.filter(u => (latestActivity.get(u.id) ?? "") >= filters.lastActiveAfter!)
    }
    if (filters.lastActiveBefore) {
      targets = targets.filter(u => (latestActivity.get(u.id) ?? "") <= filters.lastActiveBefore!)
    }
  }

  if (filters.excludeActiveWelcomeFlow) {
    const steps = await db.select().from(emailWelcomeSteps)
      .where(eq(emailWelcomeSteps.active, true)).all()
    const maxDelay = steps.reduce((m, s) => Math.max(m, s.delayDays), 0)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - maxDelay)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    targets = targets.filter(u =>
      u.createdAt != null && u.createdAt.toISOString().slice(0, 10) <= cutoffStr
    )
  }

  return targets
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

export async function dispatchCampaign(campaignId: number): Promise<{ sent: number }> {
  const campaign = await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId)).get()
  if (!campaign || campaign.status === "sent") return { sent: 0 }

  await db.update(emailCampaigns).set({ status: "sending" })
    .where(eq(emailCampaigns.id, campaignId))

  const filters = parseFilters(campaign.filters)
  const blocks  = parseBlocks(campaign.body)
  const html    = renderEmail(campaign.subject, blocks)
  const targets = await resolveRecipients(filters, campaignId)
  const now     = new Date().toISOString()
  let sent = 0

  for (const user of targets) {
    try {
      await sendEmail({ to: user.email, subject: campaign.subject, html })
      await db.insert(emailSendLog).values({
        userId: user.id, type: "campaign", referenceId: campaignId, sentAt: now,
      })
      sent++
    } catch (err) {
      console.error(`campaign ${campaignId}: failed for user ${user.id}`, err)
    }
  }

  await db.update(emailCampaigns)
    .set({ status: "sent", sentAt: now })
    .where(eq(emailCampaigns.id, campaignId))

  return { sent }
}
