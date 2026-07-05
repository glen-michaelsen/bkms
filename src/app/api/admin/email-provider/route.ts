import { NextResponse } from "next/server"
import { auth } from "@/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Diagnostic: reports what THIS deployment actually sees for email config, so we
// can tell whether EMAIL_PROVIDER / the API keys reached the running build.
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
