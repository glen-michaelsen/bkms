/**
 * Renders the designed blog covers to public/blog/<slug>-cover.jpg.
 * Add a post to COVERS, run `npm run blog:covers`, then point the post's
 * `cover:` frontmatter at the generated file. Requires Google Chrome (macOS)
 * and network access for the Plus Jakarta Sans web font.
 */
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const OUT_DIR = join(process.cwd(), "public", "blog")
const V = "#7F22FE"

const rings = `<circle cx="740" cy="230" r="170" fill="#fff" fill-opacity=".08"/><circle cx="740" cy="230" r="120" fill="#fff" fill-opacity=".12"/><circle cx="740" cy="230" r="70" fill="#fff"/>`

const pill = (x, y, w, t) =>
  `<rect x="${x}" y="${y}" width="${w}" height="34" rx="17" fill="#fff" fill-opacity=".18"/><text x="${x + w / 2}" y="${y + 23}" text-anchor="middle" class="b" font-size="15" fill="#fff">${t}</text>`

const titleOnly = ({ category, pillWidth, title, subtitle }) =>
  pill(500 - pillWidth / 2, 130, pillWidth, category) +
  `<text x="500" y="260" text-anchor="middle" class="h" font-size="84" fill="#fff">${title}</text>` +
  `<text x="500" y="320" text-anchor="middle" class="m" font-size="25" fill="#E4D9FF">${subtitle}</text>`

const figure = ({ lines, art }) =>
  rings + art +
  `<text x="70" y="225" class="h" font-size="92" fill="#fff">${lines[0]}</text>` +
  `<text x="70" y="325" class="h" font-size="92" fill="#fff">${lines[1]}</text>`

const phraseCard = ({ category, pillWidth, lines, phrase, translation, bar }) =>
  pill(70, 150, pillWidth, category) +
  `<text x="70" y="262" class="h" font-size="68" fill="#fff">${lines[0]}</text>` +
  `<text x="70" y="336" class="h" font-size="68" fill="#fff">${lines[1]}</text>` +
  `<rect x="540" y="135" width="390" height="230" rx="28" fill="#fff"/>` +
  `<text x="575" y="222" class="h" font-size="34" fill="${V}">${phrase}</text>` +
  `<text x="575" y="266" class="m" font-size="21" fill="#64748B">${translation}</text>` +
  `<rect x="575" y="305" width="320" height="6" rx="3" fill="${V}" fill-opacity=".15"/>` +
  `<rect x="575" y="305" width="${bar}" height="6" rx="3" fill="${V}"/>`

const phraseHeadline = ({ topic, pillWidth, phrase, translation }) =>
  pill(500 - pillWidth / 2, 125, pillWidth, topic) +
  `<text x="500" y="270" text-anchor="middle" class="h" font-size="100" fill="#fff">${phrase}</text>` +
  `<text x="500" y="335" text-anchor="middle" class="m" font-size="28" fill="#E4D9FF">${translation}</text>`

const COVERS = {
  "balkan-summer": figure({
    lines: ["Balkan", "summer"],
    art: `<path d="M570 400 q42.5 -32 85 0 t85 0 t85 0 t85 0" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  }),
  "football-world-cup": phraseCard({
    category: "Culture", pillWidth: 90, lines: ["World Cup", "football"],
    phrase: "Kakva utakmica!", translation: "What a match!", bar: 190,
  }),
  "the-alphabet": titleOnly({
    category: "Alphabet", pillWidth: 104, title: "The alphabet",
    subtitle: "Two scripts, one sound for every letter",
  }),
  "understanding-cases": phraseHeadline({
    topic: "Seven cases", pillWidth: 140,
    phrase: "Živim u gradu", translation: "I live in the city",
  }),
  "the-number-system": phraseCard({
    category: "Numbers", pillWidth: 104, lines: ["Number", "system"],
    phrase: "Jedan, dva, tri", translation: "One, two, three", bar: 230,
  }),
}

const page = (inner) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;800&display=block&subset=latin-ext" rel="stylesheet">
<style>html,body{margin:0;background:${V}}svg{display:block;width:100vw;height:100vh}text{font-family:'Plus Jakarta Sans',sans-serif}
.h{font-weight:800;letter-spacing:-.025em}.m{font-weight:500}.b{font-weight:600}</style></head><body>
<svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice"><defs>
<radialGradient id="tr" cx="100%" cy="0%" r="75%"><stop offset="0" stop-color="#a78bfa" stop-opacity=".5"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
<radialGradient id="bl" cx="0%" cy="100%" r="75%"><stop offset="0" stop-color="#ec4899" stop-opacity=".3"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
</defs><rect width="1000" height="500" fill="${V}"/><rect width="1000" height="500" fill="url(#tr)"/><rect width="1000" height="500" fill="url(#bl)"/>${inner}</svg></body></html>`

const tmp = mkdtempSync(join(tmpdir(), "blog-covers-"))
try {
  for (const [slug, inner] of Object.entries(COVERS)) {
    const html = join(tmp, `${slug}.html`)
    const png = join(tmp, `${slug}.png`)
    const jpg = join(OUT_DIR, `${slug}-cover.jpg`)
    writeFileSync(html, page(inner))
    execFileSync(CHROME, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=2", "--window-size=1000,500",
      "--virtual-time-budget=8000", `--screenshot=${png}`, `file://${html}`,
    ], { stdio: "ignore" })
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", png, "--out", jpg], { stdio: "ignore" })
    console.log(`${slug}-cover.jpg  ${Math.round(statSync(jpg).size / 1024)} KB`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
