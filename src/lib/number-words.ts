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

// ── English number words ──────────────────────────────────────────────────────

const EN_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
                 "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
                 "sixteen", "seventeen", "eighteen", "nineteen"]
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

function enUnder100(n: number): string {
  if (n < 20) return EN_ONES[n]
  const o = n % 10
  return o === 0 ? EN_TENS[Math.floor(n / 10)] : `${EN_TENS[Math.floor(n / 10)]}-${EN_ONES[o]}`
}

/** English cardinal for ages (0–99). */
export function toEnCardinal(n: number): string {
  if (n === 0) return "zero"
  if (n < 100) return enUnder100(n)
  // Fallback for larger numbers (not expected for ages)
  return String(n)
}

/** English year as spoken: "nineteen eighty-eight", "two thousand", "twenty twenty-four". */
export function toEnYear(y: number): string {
  if (y === 2000) return "two thousand"
  if (y >= 2001 && y <= 2009) return `two thousand ${EN_ONES[y % 10]}`
  if (y >= 2010 && y <= 2099) return `twenty ${enUnder100(y % 100)}`
  if (y >= 1000 && y <= 1999) {
    const high = Math.floor(y / 100)   // e.g. 19 for 1988
    const low  = y % 100               // e.g. 88 for 1988
    if (low === 0) return `${enUnder100(high)} hundred`
    return `${enUnder100(high)} ${enUnder100(low)}`
  }
  return String(y)
}

const EN_ORD_ONES = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
                     "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth",
                     "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth"]
const EN_ORD_TENS  = ["", "", "twentieth", "thirtieth"]
const EN_CARD_TENS = ["", "", "twenty", "thirty"]

/** English ordinal for day numbers 1–31: "first", "twenty-ninth", "thirty-first". */
export function toEnDayOrdinal(n: number): string {
  if (n < 1 || n > 31) return String(n)
  if (n < 20) return EN_ORD_ONES[n]
  const t = Math.floor(n / 10)
  const o = n % 10
  if (o === 0) return EN_ORD_TENS[t]
  return `${EN_CARD_TENS[t]}-${EN_ORD_ONES[o]}`
}
