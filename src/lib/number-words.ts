// Serbian / Croatian number-to-words
// Covers: cardinals 0–9999 (ages + years), ordinals 1–31 (days)

const ONES = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"]
const TEENS = ["deset", "jedanaest", "dvanaest", "trinaest", "četrnaest", "petnaest", "šesnaest", "sedamnaest", "osamnaest", "devetnaest"]
const TENS  = ["", "deset", "dvadeset", "trideset", "četrdeset", "pedeset", "šezdeset", "sedamdeset", "osamdeset", "devedeset"]

// Masculine nominative ordinals (used for days: "deveti", "dvadeset deveti", …)
const ORD_ONES  = ["", "prvi", "drugi", "treći", "četvrti", "peti", "šesti", "sedmi", "osmi", "deveti"]
const ORD_TEENS = ["deseti", "jedanaesti", "dvanaesti", "trinaesti", "četrnaesti", "petnaesti", "šesnaesti", "sedamnaesti", "osamnaesti", "devetnaesti"]
const ORD_TENS  = ["", "deseti", "dvadeseti", "trideseti", "četrdeseti", "pedeseti", "šezdeseti", "sedamdeseti", "osamdeseti", "devedeseti"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function under100(n: number): string {
  if (n === 0) return ""
  if (n < 10)  return ONES[n]
  if (n < 20)  return TEENS[n - 10]
  const o = ONES[n % 10]
  return o ? `${TENS[Math.floor(n / 10)]} ${o}` : TENS[Math.floor(n / 10)]
}

function under1000(n: number, lang: "sr" | "hr"): string {
  if (n < 100) return under100(n)
  const h    = Math.floor(n / 100)
  const rest = n % 100
  const HUNDREDS: Record<number, string> = {
    1: "sto",
    2: lang === "hr" ? "dvjesto" : "dvesta",
    3: "tristo",
    4: "četiristo",
    5: "petsto",
    6: "šesto",
    7: "sedamsto",
    8: "osamsto",
    9: "devetsto",
  }
  const hStr = HUNDREDS[h]
  return rest === 0 ? hStr : `${hStr} ${under100(rest)}`
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Cardinal number words for n (0–9999). Works for ages and years. */
export function toCardinal(n: number, lang: "sr" | "hr"): string {
  if (n === 0) return "nula"
  if (n < 1000) return under1000(n, lang)

  const thousands = Math.floor(n / 1000)
  const rest      = n % 1000

  let tStr: string
  if (thousands === 1) {
    tStr = lang === "hr" ? "tisuću" : "hiljadu"
  } else if (thousands === 2) {
    tStr = lang === "hr" ? "dvije tisuće" : "dve hiljade"
  } else if (thousands === 3 || thousands === 4) {
    tStr = lang === "hr" ? `${ONES[thousands]} tisuće` : `${ONES[thousands]} hiljade`
  } else {
    tStr = lang === "hr"
      ? `${under100(thousands)} tisuća`
      : `${under100(thousands)} hiljada`
  }

  return rest === 0 ? tStr : `${tStr} ${under1000(rest, lang)}`
}

/** Ordinal (masculine nominative) for day numbers 1–31. Same in SR and HR. */
export function toDayOrdinal(n: number): string {
  if (n < 1 || n > 31) return String(n)
  if (n < 10)  return ORD_ONES[n]
  if (n < 20)  return ORD_TEENS[n - 10]
  const o = n % 10
  if (o === 0) return ORD_TENS[Math.floor(n / 10)]
  // Compound: cardinal tens + ordinal ones, e.g. "dvadeset deveti"
  return `${TENS[Math.floor(n / 10)]} ${ORD_ONES[o]}`
}
