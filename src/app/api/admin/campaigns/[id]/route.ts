import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailCampaigns } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function adminOnly() {
  const session = await auth()
  if (!session || session.user.role !== "admin") return null
  return session
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const { name, subject, body, scheduledAt, filters } = await req.json()
  const [campaign] = await db.update(emailCampaigns)
    .set({
      name,
      subject,
      body,
      scheduledAt: scheduledAt ?? null,
      status: scheduledAt ? "scheduled" : "draft",
      filters: filters ? JSON.stringify(filters) : "{}",
    })
    .where(eq(emailCampaigns.id, parseInt(id)))
    .returning()
  return NextResponse.json(campaign)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
