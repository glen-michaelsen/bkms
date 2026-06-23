// ── Block types ───────────────────────────────────────────────────────────────

export type Block =
  | { type: "heading";   text: string }
  | { type: "paragraph"; text: string }
  | { type: "image";     url: string; alt?: string }
  | { type: "button";    label: string; url: string }

export type CampaignFilters = {
  languages?:              string[]   // ["sr", "hr"] — based on user.language
  studyDirections?:        string[]   // ["to_slavic", "to_english"]
  lastActiveBefore?:       string     // ISO date
  lastActiveAfter?:        string     // ISO date
  createdAfter?:           string     // ISO date
  createdBefore?:          string     // ISO date
  excludeActiveWelcomeFlow?: boolean
}

export function parseBlocks(json: string): Block[] {
  try { return JSON.parse(json) as Block[] } catch { return [] }
}

export function parseFilters(json: string): CampaignFilters {
  try { return JSON.parse(json) as CampaignFilters } catch { return {} }
}

// ── Block → HTML ──────────────────────────────────────────────────────────────

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function blockToHtml(block: Block): string {
  switch (block.type) {
    case "heading":
      return `<h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:800;line-height:1.3;">${escape(block.text)}</h2>`

    case "paragraph":
      // Support simple **bold** inline markers
      const pText = escape(block.text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      return `<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">${pText}</p>`

    case "image":
      return `<img src="${escape(block.url)}" alt="${escape(block.alt ?? "")}" style="display:block;width:100%;max-width:440px;border-radius:12px;margin:0 auto 20px;" />`

    case "button":
      return `
<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
  <tr>
    <td align="center">
      <a href="${escape(block.url)}"
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:14px;">
        ${escape(block.label)}
      </a>
    </td>
  </tr>
</table>`
  }
}

// ── Email wrapper — matches existing streak/verb-of-day layout ────────────────

export function wrapEmailHtml({
  title,
  preheader,
  bodyHtml,
}: {
  title: string
  preheader?: string
  bodyHtml: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${preheader ? `<title>${escape(preheader)}</title>` : ""}
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">${escape(title)}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 24px;">
            ${bodyHtml}
            <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
              <a href="https://cujemose.com/settings" style="color:#7c3aed;text-decoration:none;">Unsubscribe or manage preferences</a>
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
</html>`
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(blockToHtml).join("\n")
}

export function renderEmail(subject: string, blocks: Block[]): string {
  return wrapEmailHtml({ title: subject, bodyHtml: blocksToHtml(blocks) })
}
