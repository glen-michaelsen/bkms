import { findCountry } from "./countries"
import { STUDY_LEVELS } from "./job-titles"
import { toCardinal, toDayOrdinal } from "./number-words"

export type ProfileData = {
  firstName?: string | null
  birthday?: string | null      // YYYY-MM-DD
  jobStatus?: string | null
  jobTitle?: string | null
  studyLevel?: string | null
  city?: string | null
  country?: string | null
  countryOfOrigin?: string | null
}

// ── Age ───────────────────────────────────────────────────────────────────────

function calcAge(birthday: string): number {
  const today = new Date()
  const b = new Date(birthday)
  let age = today.getFullYear() - b.getFullYear()
  if (
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())
  ) age--
  return age
}

// Serbian/Croatian age suffix — same rules for both
function ageSuffix(age: number): string {
  const last2 = age % 100
  const last1 = age % 10
  if (last2 >= 11 && last2 <= 19) return "godina"
  if (last1 === 1) return "godinu"
  if (last1 >= 2 && last1 <= 4) return "godine"
  return "godina"
}

// ── Birthday formatting ───────────────────────────────────────────────────────

const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const SR_MONTHS_GEN = ["januara","februara","marta","aprila","maja","juna","jula","avgusta","septembra","oktobra","novembra","decembra"]
const HR_MONTHS_GEN = ["siječnja","veljače","ožujka","travnja","svibnja","lipnja","srpnja","kolovoza","rujna","listopada","studenoga","prosinca"]

function ordinal(n: number): string {
  const v = n % 100
  const s = n + (["th","st","nd","rd"][(v - 20) % 10] ?? ["th","st","nd","rd"][v] ?? "th")
  return s
}

// ── Sentence builders ─────────────────────────────────────────────────────────

export type BilingualIntro = {
  english: string
  target: string   // Serbian or Croatian
}

export function buildIntro(profile: ProfileData, language: "sr" | "hr"): BilingualIntro {
  const parts = { en: [] as string[], tg: [] as string[] }

  // Greeting + name
  const name = profile.firstName?.trim() || null
  if (name) {
    parts.en.push(`Hi, my name is ${name}.`)
    parts.tg.push(`Zdravo, moje ime je ${name}.`)
  } else {
    parts.en.push("Hi!")
    parts.tg.push("Zdravo!")
  }

  // Age + birthday
  if (profile.birthday) {
    const age = calcAge(profile.birthday)
    const b = new Date(profile.birthday)
    const day = b.getUTCDate()
    const monthIdx = b.getUTCMonth()
    const year = b.getUTCFullYear()

    parts.en.push(`I am ${age} years old and my birthday is the ${ordinal(day)} of ${EN_MONTHS[monthIdx]} ${year}.`)

    const ageWords  = toCardinal(age, language)
    const dayWords  = toDayOrdinal(day)
    const yearWords = toCardinal(year, language)

    if (language === "sr") {
      parts.tg.push(`Imam ${age} (${ageWords}) ${ageSuffix(age)} i moj rođendan je ${day}. (${dayWords}) ${SR_MONTHS_GEN[monthIdx]} ${year}. (${yearWords}) godine.`)
    } else {
      parts.tg.push(`Imam ${age} (${ageWords}) ${ageSuffix(age)} i moj rođendan je ${day}. (${dayWords}) ${HR_MONTHS_GEN[monthIdx]} ${year}. (${yearWords})`)
    }
  }

  // Job / study status
  if (profile.jobStatus === "working" && profile.jobTitle) {
    parts.en.push(`I work as a ${profile.jobTitle}.`)
    parts.tg.push(`Radim kao ${profile.jobTitle}.`)
  } else if (profile.jobStatus === "studying" && profile.studyLevel) {
    const level = STUDY_LEVELS.find((l) => l.value === profile.studyLevel)
    const levelLabel = level ? (language === "sr" ? level.sr : level.hr) : profile.studyLevel
    const enLabel = level?.label ?? profile.studyLevel
    parts.en.push(`I am currently studying (${enLabel}).`)
    parts.tg.push(`Trenutno studiram (${levelLabel}).`)
  } else if (profile.jobStatus === "between_jobs") {
    parts.en.push("I am currently between jobs.")
    parts.tg.push("Trenutno ne radim.")
  } else if (profile.jobStatus === "retired") {
    parts.en.push("I am retired.")
    parts.tg.push(language === "sr" ? "U penziji sam." : "U mirovini sam.")
  }

  // Location: city + country
  if (profile.city || profile.country) {
    const country = findCountry(profile.country)
    if (profile.city && country) {
      parts.en.push(`I live in ${profile.city}, ${profile.country}.`)
      parts.tg.push(`Živim u ${profile.city}, u ${language === "sr" ? country.srIn : country.hrIn}.`)
    } else if (profile.city) {
      parts.en.push(`I live in ${profile.city}.`)
      parts.tg.push(`Živim u ${profile.city}.`)
    } else if (country) {
      parts.en.push(`I live in ${profile.country}.`)
      parts.tg.push(`Živim u ${language === "sr" ? country.srIn : country.hrIn}.`)
    }
  }

  // Country of origin
  if (profile.countryOfOrigin) {
    const origin = findCountry(profile.countryOfOrigin)
    if (origin) {
      parts.en.push(`I am from ${profile.countryOfOrigin}.`)
      if (language === "sr") {
        parts.tg.push(`Porijeklom sam iz ${origin.srFrom}.`)
      } else {
        parts.tg.push(`Podrijetlom sam iz ${origin.hrFrom}.`)
      }
    } else {
      parts.en.push(`I am from ${profile.countryOfOrigin}.`)
      parts.tg.push(`Porijeklom sam iz ${profile.countryOfOrigin}.`)
    }
  }

  return {
    english: parts.en.join(" "),
    target: parts.tg.join(" "),
  }
}

export function isProfileComplete(profile: ProfileData): boolean {
  return !!(profile.birthday || profile.jobStatus || profile.city || profile.country || profile.countryOfOrigin)
}
