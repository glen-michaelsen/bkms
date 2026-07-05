import { NextResponse } from "next/server"
import { auth } from "@/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Diagnostic: reports what THIS deployment sees for email config. Add ?send=1 to
// attempt a real Brevo transactional send to your own (admin) address and return
// Brevo's exact HTTP status + response body — the quickest way to see why a send
// is rejected (unverified sender, bad key, etc.).
export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const info = {
    effectiveProvider: (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase(),
    emailProviderRaw: process.env.EMAIL_PROVIDER ?? null,
    brevoKeyPresent: !!process.env.BREVO_API_KEY,
    resendKeyPresent: !!process.env.RESEND_API_KEY,
  }

  const url = new URL(req.url)
  if (!url.searchParams.get("send")) return NextResponse.json(info)

  const to = session.user.email
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Čujemo se", email: "zdravo@cujemose.com" },
      to: [{ email: to }],
      subject: "Brevo test — Čujemo se",
      htmlContent: "<p>Brevo test send from the diagnostic endpoint.</p>",
    }),
  })
  const body = await res.text().catch(() => "")
  return NextResponse.json({
    ...info,
    brevoTest: { to, status: res.status, ok: res.ok, response: body.slice(0, 1200) },
  })
}
