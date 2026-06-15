"use client"

import { useState, useEffect } from "react"

// ── Serbian number words ──────────────────────────────────────────────────────

const SR_ONES  = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"]
const SR_TEENS = ["deset", "jedanaest", "dvanaest", "trinaest", "četrnaest", "petnaest",
                  "šesnaest", "sedamnaest", "osamnaest", "devetnaest"]
const SR_TENS  = ["", "deset", "dvadeset", "trideset", "četrdeset", "pedeset"]

function srNum(n: number): string {
  if (n === 0) return "nula"
  if (n < 10)  return SR_ONES[n]
  if (n < 20)  return SR_TEENS[n - 10]
  const t = Math.floor(n / 10), o = n % 10
  return o === 0 ? SR_TENS[t] : `${SR_TENS[t]} ${SR_ONES[o]}`
}

// ── English number words ──────────────────────────────────────────────────────

const EN_HOURS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
const EN_ONES  = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
                  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
                  "sixteen", "seventeen", "eighteen", "nineteen"]
const EN_TENS  = ["", "", "twenty", "thirty", "forty", "fifty"]

function enMinute(m: number): string {
  if (m < 20) return EN_ONES[m]
  const t = Math.floor(m / 10), o = m % 10
  return o === 0 ? EN_TENS[t] : `${EN_TENS[t]}-${EN_ONES[o]}`
}

// ── Time string builders ──────────────────────────────────────────────────────

function pad2(n: number) { return n.toString().padStart(2, "0") }

/** Spelled-out English: "It is ten seven PM" */
function enSpelled(h12: number, m: number, ampm: string): string {
  if (m === 0) return `It is ${EN_HOURS[h12]} o'clock ${ampm}`
  return `It is ${EN_HOURS[h12]} ${enMinute(m)} ${ampm}`
}

/** Simple numeric English: "It is 10:07 PM" */
function enSimple(h12: number, m: number, ampm: string): string {
  return `It is ${h12}:${pad2(m)} ${ampm}`
}

/** Spelled-out Serbian: "Sada je deset i sedam minuta." */
function srSpelled(h: number, m: number): string {
  return m === 0
    ? `Sada je ${srNum(h)} sati tačno.`
    : `Sada je ${srNum(h)} i ${srNum(m)} minuta.`
}

/** Simple numeric Serbian: "Sada je 10:07" */
function srSimple(h: number, m: number): string {
  return `Sada je ${pad2(h)}:${pad2(m)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CurrentTime({ studyDirection = "to_slavic" }: { studyDirection?: string }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  if (!now) {
    return (
      <div className="flex flex-col gap-1.5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded-full w-4/5" />
        <div className="h-3 bg-slate-100 rounded-full w-1/3" />
      </div>
    )
  }

  const h    = now.getHours()
  const m    = now.getMinutes()
  const h12  = h % 12 || 12
  const ampm = h < 12 ? "AM" : "PM"

  const isEnglishLearner = studyDirection === "to_english"

  // Learning language = spelled out (primary, bold)
  // Reference language = simple numeric (secondary, small grey)
  const primary   = isEnglishLearner ? enSpelled(h12, m, ampm) : srSpelled(h, m)
  const secondary = isEnglishLearner ? srSimple(h, m)          : enSimple(h12, m, ampm)

  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-semibold text-slate-800 leading-snug">{primary}</p>
      <p className="text-xs text-slate-400">{secondary}</p>
    </div>
  )
}
