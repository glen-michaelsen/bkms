"use client"

import { useState, useEffect } from "react"

const ONES  = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"]
const TEENS = ["deset", "jedanaest", "dvanaest", "trinaest", "četrnaest", "petnaest",
               "šesnaest", "sedamnaest", "osamnaest", "devetnaest"]
const TENS  = ["", "deset", "dvadeset", "trideset", "četrdeset", "pedeset"]

function srNum(n: number): string {
  if (n === 0) return "nula"
  if (n < 10)  return ONES[n]
  if (n < 20)  return TEENS[n - 10]
  const t = Math.floor(n / 10), o = n % 10
  return o === 0 ? TENS[t] : `${TENS[t]} ${ONES[o]}`
}

function pad2(n: number) { return n.toString().padStart(2, "0") }

export function CurrentTime() {
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

  const h = now.getHours()
  const m = now.getMinutes()
  const h12 = h % 12 || 12
  const ampm = h < 12 ? "AM" : "PM"

  const sr = m === 0
    ? `Sada je ${srNum(h)} sati tačno.`
    : `Sada je ${srNum(h)} i ${srNum(m)} minuta.`

  const en = m === 0
    ? `It is ${h12}:00 ${ampm} exactly`
    : `It is ${h12}:${pad2(m)} ${ampm}`

  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-semibold text-slate-800 leading-snug">{sr}</p>
      <p className="text-xs text-slate-400">{en}</p>
    </div>
  )
}
