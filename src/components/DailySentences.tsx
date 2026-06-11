"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { CurrentTime } from "./CurrentTime"

const DAYS_SR = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"]
const DAYS_HR = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"]
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

const MONTHS_HR = [
  "", "siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj",
  "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac",
]

const MONTHS_EN = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getSeason(month: number): { sr: string; hr: string; en: string } {
  if (month >= 3 && month <= 5) return { sr: "proleće",  hr: "proljeće", en: "spring" }
  if (month >= 6 && month <= 8) return { sr: "leto",     hr: "ljeto",    en: "summer" }
  if (month >= 9 && month <= 11) return { sr: "jesen",   hr: "jesen",    en: "autumn" }
  return                                { sr: "zima",    hr: "zima",     en: "winter" }
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

export function DailySentences({
  studyDirection = "to_slavic",
  language = "sr",
}: {
  studyDirection?: string
  language?: "sr" | "hr"
}) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  if (!now) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-4 text-violet-600"><Calendar className="w-6 h-6" /></div>
        <Skeleton />
      </div>
    )
  }

  const isEnglishLearner = studyDirection === "to_english"
  const dow    = now.getDay()
  const day    = now.getDate()
  const month  = now.getMonth() + 1
  const season = getSeason(month)

  const slavicDay   = language === "hr" ? DAYS_HR[dow]   : DAYS_SR[dow]
  const slavicMonth = language === "hr" ? MONTHS_HR[month] : MONTHS_SR[month]
  const slavicSeason = language === "hr" ? season.hr : season.sr
  const slavicOrdinal = ORDINALS_SR[day]  // ordinals same structure both languages

  const srSentences = [
    { slavic: `Danas je ${slavicDay}.`,                         en: `Today is ${DAYS_EN[dow]}` },
    { slavic: `Datum je ${slavicOrdinal} ${slavicMonth}.`,      en: `The date is ${MONTHS_EN[month]} ${ORDINALS_EN[day]}` },
    { slavic: `Godišnje doba je ${slavicSeason}.`,              en: `The season is ${season.en}` },
  ]

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
      <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-4 text-violet-600">
        <Calendar className="w-6 h-6" />
      </div>

      <div className="space-y-4 flex-1">
        <CurrentTime studyDirection={studyDirection} />
        {srSentences.map(({ slavic, en }, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {isEnglishLearner ? (
              <>
                <p className="font-semibold text-slate-800 leading-snug">{en}</p>
                <p className="text-xs text-slate-400">{slavic}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-800 leading-snug">{slavic}</p>
                <p className="text-xs text-slate-400">{en}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
