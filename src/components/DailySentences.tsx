"use client"

import { useState, useEffect } from "react"
import { CurrentTime } from "./CurrentTime"

const DAYS_SR = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"]
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const ORDINALS_SR = [
  "", "prvi", "drugi", "treći", "četvrti", "peti", "šesti", "sedmi", "osmi", "deveti",
  "deseti", "jedanaesti", "dvanaesti", "trinaesti", "četrnaesti", "petnaesti",
  "šesnaesti", "sedamnaesti", "osamnaesti", "devetnaesti", "dvadeseti",
  "dvadeset prvi", "dvadeset drugi", "dvadeset treći", "dvadeset četvrti",
  "dvadeset peti", "dvadeset šesti", "dvadeset sedmi", "dvadeset osmi",
  "dvadeset deveti", "trideseti", "trideset prvi",
]

const ORDINALS_EN = [
  "", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th",
  "10th", "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th",
  "20th", "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th",
  "30th", "31st",
]

const MONTHS_SR = [
  "", "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
]

const MONTHS_EN = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getSeason(month: number): { sr: string; en: string } {
  if (month >= 3 && month <= 5) return { sr: "proleće", en: "spring" }
  if (month >= 6 && month <= 8) return { sr: "leto", en: "summer" }
  if (month >= 9 && month <= 11) return { sr: "jesen", en: "autumn" }
  return { sr: "zima", en: "winter" }
}

function Skeleton() {
  return (
    <div className="space-y-4 flex-1 animate-pulse">
      {[72, 56, 64, 48].map((w, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className={`h-4 bg-slate-100 rounded-full`} style={{ width: `${w}%` }} />
          <div className="h-3 bg-slate-100 rounded-full w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function DailySentences() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  if (!now) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mb-4">📅</div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-1">Danas</h3>
        <p className="text-sm text-slate-400 mb-5">Today's phrases in Serbian</p>
        <Skeleton />
      </div>
    )
  }

  const dow    = now.getDay()
  const day    = now.getDate()
  const month  = now.getMonth() + 1
  const season = getSeason(month)

  const sentences = [
    { sr: `Danas je ${DAYS_SR[dow]}.`,              en: `Today is ${DAYS_EN[dow]}` },
    { sr: `Datum je ${ORDINALS_SR[day]} ${MONTHS_SR[month]}.`, en: `The date is ${MONTHS_EN[month]} ${ORDINALS_EN[day]}` },
    { sr: `Godišnje doba je ${season.sr}.`,          en: `The season is ${season.en}` },
  ]

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
      <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mb-4">
        📅
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-1">Danas</h3>
      <p className="text-sm text-slate-400 mb-5">Today's phrases in Serbian</p>

      <div className="space-y-4 flex-1">
        {sentences.map(({ sr, en }, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <p className="font-semibold text-slate-800 leading-snug">{sr}</p>
            <p className="text-xs text-slate-400">{en}</p>
          </div>
        ))}
        <CurrentTime />
      </div>
    </div>
  )
}
