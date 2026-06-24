import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailCampaigns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/resend"
import { parseBlocks, renderEmail } from "@/lib/email-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function adminOnly() {
  const session = await auth()
  if (!session || session.user.role !== "admin") return null
  return session
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminOnly()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const { testEmail } = await req.json()

  const to = testEmail || session.user.email
  if (!to) return NextResponse.json({ error: "No email address" }, { status: 400 })

  const campaign = await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.id, parseInt(id))).get()
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const blocks = parseBlocks(campaign.body)
  const html   = renderEmail(campaign.subject, blocks)

  await sendEmail({ to, subject: `[TEST] ${campaign.subject}`, html })
  return NextResponse.json({ ok: true, sentTo: to })
}
