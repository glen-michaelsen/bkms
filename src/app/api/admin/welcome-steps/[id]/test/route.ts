import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailWelcomeSteps } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/resend"
import { parseBlocks, renderEmail } from "@/lib/email-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { testEmail } = await req.json()
  const to = testEmail || session.user.email!

  const [step] = await db.select().from(emailWelcomeSteps)
    .where(eq(emailWelcomeSteps.id, parseInt(id))).all()

  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const blocks = parseBlocks(step.body)
  const html   = renderEmail(step.subject, blocks)

  await sendEmail({ to, subject: `[TEST] ${step.subject}`, html })

  return NextResponse.json({ ok: true })
}
