import { Resend } from "resend"
import type { Verb } from "@/db/schema"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Čujemo se <zdravo@cujemose.com>"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the local YYYY-MM-DD date for a given IANA timezone */
export function localDateString(timezone: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(new Date())
}

/** Returns the current local hour (0–23) for a given IANA timezone */
export function localHour(timezone: string): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).format(new Date())
  const h = parseInt(s)
  return isNaN(h) ? new Date().getUTCHours() : h
}

// ── Email: Streak Reminder ─────────────────────────────────────────────────────

export async function sendStreakReminder({
  to,
  firstName,
  language = "sr",
}: {
  to: string
  firstName: string | null
  language?: string
}) {
  const name = firstName || "there"
  const langLabel = language === "hr" ? "Croatian" : "Serbian"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Don't break your streak!",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Don't lose your streak!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">
              Hey ${name}!
            </p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
              You haven't practised ${langLabel} today yet. A short session is all it takes to keep your streak alive — even just a few words!
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="https://cujemose.com/study/words"
                     style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:14px;">
                    Practice now
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
              You're receiving this because you enabled streak reminders in your settings.<br>
              <a href="https://cujemose.com/settings" style="color:#7c3aed;text-decoration:none;">Manage preferences</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;">Čujemo se · <a href="https://cujemose.com" style="color:#7c3aed;text-decoration:none;">cujemose.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

// ── Email: Verb of the Day ─────────────────────────────────────────────────────

type VerbExample = { serbian: string; croatian?: string; english: string }

/** Return the Croatian value if set, otherwise fall back to Serbian */
function hrOr(hrVal: string | null | undefined, srVal: string): string {
  return hrVal?.trim() || srVal
}

export async function sendVerbOfDay({
  to,
  firstName,
  verb,
  verbNumber,
  language = "sr",
}: {
  to: string
  firstName: string | null
  verb: Verb
  verbNumber: number
  language?: string
}) {
  const name = firstName || "there"
  const isCroatian = language === "hr"
  const examples: VerbExample[] = JSON.parse(verb.examplesJson || "[]")

  const infinitive = isCroatian ? hrOr(verb.infinitiveHr, verb.infinitive) : verb.infinitive

  const conjugationRows = [
    ["Ja",         isCroatian ? hrOr(verb.jaHr,    verb.ja)    : verb.ja],
    ["Ti",         isCroatian ? hrOr(verb.tiHr,    verb.ti)    : verb.ti],
    ["On / Ona",   isCroatian ? hrOr(verb.onOnaHr, verb.onOna) : verb.onOna],
    ["Mi",         isCroatian ? hrOr(verb.miHr,    verb.mi)    : verb.mi],
    ["Vi",         isCroatian ? hrOr(verb.viHr,    verb.vi)    : verb.vi],
    ["Oni / One",  isCroatian ? hrOr(verb.oniHr,   verb.oni)   : verb.oni],
  ]

  // All forms to search across (infinitive + all conjugations), deduped
  const verbForms = [
    ...new Set(
      [infinitive, ...conjugationRows.map(([, form]) => form)]
        .map((f) => (f as string).toLowerCase().trim())
        .filter(Boolean)
    ),
  ]
  const verbWordsParam = encodeURIComponent(verbForms.join(","))

  const conjugationHtml = conjugationRows.map(([pronoun, form]) => `
    <tr>
      <td style="padding:8px 12px;color:#64748b;font-size:14px;width:120px;">${pronoun}</td>
      <td style="padding:8px 12px;color:#1e293b;font-size:14px;font-weight:600;">${form}</td>
    </tr>`).join("")

  const examplesHtml = examples.length ? `
    <h3 style="margin:28px 0 12px;color:#1e293b;font-size:15px;font-weight:700;">Examples</h3>
    ${examples.map(ex => {
      const sentence = isCroatian ? (ex.croatian || ex.serbian) : ex.serbian
      return `
    <div style="margin-bottom:12px;padding:12px 16px;background:#f8fafc;border-radius:12px;border-left:3px solid #7c3aed;">
      <p style="margin:0 0 4px;color:#1e293b;font-size:14px;font-weight:600;">${sentence}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">${ex.english}</p>
    </div>`}).join("")}` : ""

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Verb of the day: ${infinitive} (${verb.translation})`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;">
            <p style="margin:0 0 4px;color:#ddd6fe;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">Verb #${verbNumber}</p>
            <h1 style="margin:0 0 4px;color:#ffffff;font-size:32px;font-weight:800;">${infinitive}</h1>
            <p style="margin:0;color:#ddd6fe;font-size:16px;">${verb.translation}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 24px;">
            <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">Good morning, ${name}! Here is today's verb.</p>
            <h3 style="margin:0 0 8px;color:#1e293b;font-size:15px;font-weight:700;">Conjugation</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">
              ${conjugationHtml}
            </table>
            ${examplesHtml}
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <a href="https://cujemose.com/study/sentences?wordTexts=${verbWordsParam}"
                     style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:14px;">
                    Practice sentences with this verb →
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <a href="https://cujemose.com/study/words"
                     style="display:inline-block;background:#ffffff;color:#7c3aed;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:14px;border:2px solid #e9d5ff;">
                    Practice words →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
              You're receiving this because you enabled Verb of the Day in your settings.<br>
              <a href="https://cujemose.com/settings" style="color:#7c3aed;text-decoration:none;">Manage preferences</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;">Čujemo se · <a href="https://cujemose.com" style="color:#7c3aed;text-decoration:none;">cujemose.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
