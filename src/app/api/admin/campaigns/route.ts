import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailCampaigns } from "@/db/schema"
import { desc } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function adminOnly() {
  const session = await auth()
  if (!session || session.user.role !== "admin") return null
  return session
}

export async function GET() {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const campaigns = await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)).all()
  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { name, subject, body, scheduledAt, filters } = await req.json()
  const now = new Date().toISOString()
  const [campaign] = await db.insert(emailCampaigns).values({
    name,
    subject,
    body: body ?? "[]",
    status: scheduledAt ? "scheduled" : "draft",
    scheduledAt: scheduledAt ?? null,
    filters: filters ? JSON.stringify(filters) : "{}",
    createdAt: now,
  }).returning()
  return NextResponse.json(campaign)
}
