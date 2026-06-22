export type Lang = "sr" | "hr" | "en"

export type NumberBreakdown = {
  segments: string[]
  written: string
}

// ── Serbian / Croatian ────────────────────────────────────────────────────────

const SR_ONES     = ["","jedan","dva","tri","četiri","pet","šest","sedam","osam","devet"]
const SR_TEENS    = ["deset","jedanaest","dvanaest","trinaest","četrnaest",
                     "petnaest","šesnaest","sedamnaest","osamnaest","devetnaest"]
const SR_TENS     = ["","deset","dvadeset","trideset","četrdeset",
                     "pedeset","šezdeset","sedamdeset","osamdeset","devedeset"]
const SR_HUNDREDS = ["","sto","dvesta","trista","četiristo",
                     "petsto","šesto","sedamsto","osamsto","devetsto"]

function srSub100(n: number): string[] {
  if (n <= 0) return []
  if (n < 10)  return [SR_ONES[n]]
  if (n < 20)  return [SR_TEENS[n - 10]]
  const t = SR_TENS[Math.floor(n / 10)]
  const o = n % 10
  return o ? [t, SR_ONES[o]] : [t]
}

function srSub1000(n: number): string[] {
  if (n <= 0) return []
  const h = Math.floor(n / 100)
  return [...(h ? [SR_HUNDREDS[h]] : []), ...srSub100(n % 100)]
}

function srThousands(k: number, lang: "sr" | "hr"): string {
  const lastTwo = k % 100
  const lastOne = k % 10

  // "two" has a feminine form before hiljade/tisuće (which are feminine)
  let prefix: string
  if      (k === 1) prefix = ""
  else if (k === 2) prefix = (lang === "hr" ? "dvije" : "dve") + " "
  else              prefix = srSub100(k).join(" ") + " "

  const [s1, s2_4, s5] = lang === "sr"
    ? ["hiljada", "hiljade", "hiljada"]
    : ["tisuća",  "tisuće",  "tisuća"]

  let suffix: string
  if      (lastTwo >= 11 && lastTwo <= 14) suffix = s5
  else if (lastOne === 1)                  suffix = s1
  else if (lastOne >= 2 && lastOne <= 4)   suffix = s2_4
  else                                     suffix = s5

  return `${prefix}${suffix}`.trim()
}

// ── English ───────────────────────────────────────────────────────────────────

const EN_ONES  = ["","one","two","three","four","five","six","seven","eight","nine"]
const EN_TEENS = ["ten","eleven","twelve","thirteen","fourteen",
                  "fifteen","sixteen","seventeen","eighteen","nineteen"]
const EN_TENS  = ["","ten","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"]

function enSub100(n: number): string[] {
  if (n <= 0) return []
  if (n < 10)  return [EN_ONES[n]]
  if (n < 20)  return [EN_TEENS[n - 10]]
  const t = EN_TENS[Math.floor(n / 10)]
  const o = n % 10
  // Tens+ones are hyphenated in English — one visual chunk
  return [o ? `${t}-${EN_ONES[o]}` : t]
}

function enSub1000(n: number): string[] {
  if (n <= 0) return []
  const h = Math.floor(n / 100)
  return [...(h ? [`${EN_ONES[h]} hundred`] : []), ...enSub100(n % 100)]
}

// ── Public API ────────────────────────────────────────────────────────────────

export function breakdown(n: number, lang: Lang): NumberBreakdown {
  if (n <= 0 || n > 10000) return { segments: [], written: "" }

  const k   = Math.floor(n / 1000)
  const rem = n % 1000

  if (lang === "en") {
    const kSeg = k > 0 ? [`${enSub100(k).join(" ")} thousand`] : []
    const segments = [...kSeg, ...enSub1000(rem)]
    // Add "and" between a "hundred" chunk and whatever follows it
    const len = segments.length
    const written = len >= 2 && segments[len - 2].endsWith("hundred")
      ? segments.slice(0, -1).join(" ") + " and " + segments[len - 1]
      : segments.join(" ")
    return { segments, written }
  }

  // SR or HR
  const kSeg = k > 0 ? [srThousands(k, lang)] : []
  const segments = [...kSeg, ...srSub1000(rem)]
  return { segments, written: segments.join(" ") }
}

// Numbers shown in browse mode — curated to teach the patterns
export const KEY_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  30, 40, 50, 60, 70, 80, 90,
  100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 2000, 3000, 4000, 5000, 10000,
]
