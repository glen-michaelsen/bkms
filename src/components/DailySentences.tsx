// DailySentences is a server component; CurrentTime is a client component for local time
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

export function DailySentences() {
  const now = new Date()
  const dow   = now.getUTCDay()          // 0 = Sunday
  const day   = now.getUTCDate()         // 1–31
  const month = now.getUTCMonth() + 1    // 1–12
  const season = getSeason(month)

  const sentences = [
    {
      sr: `Danas je ${DAYS_SR[dow]}.`,
      en: `Today is ${DAYS_EN[dow]}`,
    },
    {
      sr: `Datum je ${ORDINALS_SR[day]} ${MONTHS_SR[month]}.`,
      en: `The date is ${MONTHS_EN[month]} ${ORDINALS_EN[day]}`,
    },
    {
      sr: `Godišnje doba je ${season.sr}.`,
      en: `The season is ${season.en}`,
    },
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
