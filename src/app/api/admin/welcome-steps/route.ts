import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailWelcomeSteps } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function adminOnly() {
  const session = await auth()
  if (!session || session.user.role !== "admin") return null
  return session
}

export async function GET() {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const steps = await db.select().from(emailWelcomeSteps).all()
  return NextResponse.json(steps)
}

export async function POST(req: Request) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { stepNumber, delayDays, subject, body } = await req.json()
  const now = new Date().toISOString()
  const [step] = await db.insert(emailWelcomeSteps).values({
    stepNumber, delayDays, subject, body, active: true, createdAt: now,
  }).returning()
  return NextResponse.json(step)
}

export async function PUT(req: Request) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id, stepNumber, delayDays, subject, body, active } = await req.json()
  const [step] = await db.update(emailWelcomeSteps)
    .set({ stepNumber, delayDays, subject, body, active })
    .where(eq(emailWelcomeSteps.id, id))
    .returning()
  return NextResponse.json(step)
}

export async function DELETE(req: Request) {
  if (!await adminOnly()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await req.json()
  await db.delete(emailWelcomeSteps).where(eq(emailWelcomeSteps.id, id))
  return NextResponse.json({ ok: true })
}
