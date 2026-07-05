import { NextResponse } from "next/server"
import { auth } from "@/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin diagnostic: reports what THIS deployment sees for email config, so you
// can confirm which provider is active and whether the API keys reached the
// running build. Read-only — no secrets are returned, only presence booleans.
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({
    effectiveProvider: (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase(),
    emailProviderRaw: process.env.EMAIL_PROVIDER ?? null,
    brevoKeyPresent: !!process.env.BREVO_API_KEY,
    resendKeyPresent: !!process.env.RESEND_API_KEY,
  })
}
