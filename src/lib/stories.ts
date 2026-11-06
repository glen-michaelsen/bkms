import { getItemStatus, type KnowledgeStatus } from "@/lib/progress"

export type Language = "sr" | "hr"
export type StudyDirection = "to_slavic" | "to_english"
export type StoryText = { serbian: string; croatian: string; english: string }
export type Understanding = "few_words" | "some" | "most" | "all"

export const UNDERSTANDING_OPTIONS: { value: Understanding; label: string }[] = [
  { value: "few_words", label: "Only a few words" },
  { value: "some",      label: "Some of it" },
  { value: "most",      label: "Most of it" },
  { value: "all",       label: "All of it" },
]

export const understandingLabel = (value: string) =>
  UNDERSTANDING_OPTIONS.find(o => o.value === value)?.label ?? value

const slavicOf = (t: StoryText, language: Language) => (language === "sr" ? t.serbian : t.croatian)

/** The text a learner reads, and the text they can reveal to check it. */
export function readingPair(t: StoryText, language: Language, direction: StudyDirection) {
  return direction === "to_english"
    ? { target: t.english, translation: slavicOf(t, language) }
    : { target: slavicOf(t, language), translation: t.english }
}

/** Slow learner pace, so the 2-3 minute goal holds for beginners too. */
export const LEARNER_WORDS_PER_MINUTE = 60
export const MAX_STORY_WORDS = 3 * LEARNER_WORDS_PER_MINUTE

const tokensOf = (text: string) => text.toLowerCase().match(/\p{L}+/gu) ?? []

export const countWords = (lines: string[]) => lines.reduce((sum, line) => sum + tokensOf(line).length, 0)

export const readingMinutes = (lines: string[]) =>
  Math.max(1, Math.round(countWords(lines) / LEARNER_WORDS_PER_MINUTE))

// Case and gender endings. The text says "kapu" and the dictionary says "kapa",
// so a dictionary word matches when only one of these separates them. A closed
// list keeps "most" from matching "moskva", which a prefix check alone would allow.
const SLAVIC_ENDINGS = new Set([
  "a", "e", "i", "o", "u", "om", "em", "og", "eg", "oj", "ej", "im", "ih", "ama", "ima",
  "ega", "oga", "emu", "omu", "ju", "ovi", "evi", "ove", "eve", "ova", "eva",
])
const ENGLISH_ENDINGS = new Set(["s", "es", "ed", "d", "ing"])

function matchesInflected(token: string, word: string, direction: StudyDirection): boolean {
  if (token === word) return true
  if (word.length < 4) return false
  if (direction === "to_english") {
    return token.startsWith(word) && ENGLISH_ENDINGS.has(token.slice(word.length))
  }
  const stems = /[aeiou]$/.test(word) ? [word, word.slice(0, -1)] : [word]
  return stems.some(stem => token.startsWith(stem) && SLAVIC_ENDINGS.has(token.slice(stem.length)))
}

export type DictionaryWord = StoryText & {
  serbianFemale: string | null
  croatianFemale: string | null
  correctCount: number | null
  incorrectCount: number | null
  streak: number | null
}

export type DictionaryVerb = {
  translation: string
  infinitive: string; ja: string; ti: string; onOna: string; mi: string; vi: string; oni: string
  infinitiveHr: string | null; jaHr: string | null; tiHr: string | null; onOnaHr: string | null
  miHr: string | null; viHr: string | null; oniHr: string | null
}

export type KeyWord = { target: string; translation: string; form?: string; status: KnowledgeStatus }

const MAX_KEY_WORDS = 8
const MAX_KEY_VERBS = 4
const STATUS_ORDER: KnowledgeStatus[] = ["new", "learning", "familiar"]
// "sam", "je" and "ću" are everywhere and teach nothing about this particular story.
const AUXILIARY_VERBS = new Set(["biti", "hteti", "htjeti"])

/**
 * Picks the words worth learning before reading: dictionary words found in the
 * story, skipping any the learner already knows, least-known first. Conjugated
 * verbs match exactly, because the verbs table lists every form.
 */
export function findKeyWords(
  lines: string[],
  words: DictionaryWord[],
  verbs: DictionaryVerb[],
  language: Language,
  direction: StudyDirection,
): KeyWord[] {
  const tokens = lines.flatMap(tokensOf)
  const uniqueTokens = [...new Set(tokens)]
  const paddedText = ` ${tokens.join(" ")} `
  const firstIndex = (token: string) => tokens.indexOf(token)

  const found: (KeyWord & { order: number })[] = []
  const seen = new Set<string>()

  for (const word of words) {
    const { target, translation } = readingPair(word, language, direction)
    const key = target.toLowerCase().trim()
    if (seen.has(key)) continue

    const female = direction === "to_english" ? null : language === "sr" ? word.serbianFemale : word.croatianFemale
    const forms = [key, female?.toLowerCase().trim()].filter((f): f is string => !!f)

    let order = -1
    for (const form of forms) {
      const parts = tokensOf(form)
      if (parts.length > 1) {
        const at = paddedText.indexOf(` ${parts.join(" ")} `)
        if (at >= 0) order = paddedText.slice(0, at).split(" ").length
      } else if (parts.length === 1 && parts[0].length >= 3) {
        const hit = uniqueTokens.find(token => matchesInflected(token, parts[0], direction))
        if (hit) order = firstIndex(hit)
      }
      if (order >= 0) break
    }
    if (order < 0) continue

    const status: KnowledgeStatus = word.correctCount === null
      ? "new"
      : getItemStatus({
          correctCount: word.correctCount,
          incorrectCount: word.incorrectCount ?? 0,
          streak: word.streak ?? 0,
        })
    if (status === "known") continue

    seen.add(key)
    found.push({ target, translation, status, order })
  }

  const byPriority = (a: { status: KnowledgeStatus; order: number }, b: { status: KnowledgeStatus; order: number }) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.order - b.order
  const keyWords: KeyWord[] = found.sort(byPriority).slice(0, MAX_KEY_WORDS)

  if (direction === "to_english") return keyWords

  const hr = language === "hr"
  const verbMatches: (KeyWord & { order: number })[] = []
  for (const verb of verbs) {
    const infinitive = (hr && verb.infinitiveHr?.trim()) || verb.infinitive
    if (AUXILIARY_VERBS.has(infinitive.toLowerCase()) || seen.has(infinitive.toLowerCase())) continue
    const forms = [
      infinitive,
      (hr && verb.jaHr) || verb.ja, (hr && verb.tiHr) || verb.ti, (hr && verb.onOnaHr) || verb.onOna,
      (hr && verb.miHr) || verb.mi, (hr && verb.viHr) || verb.vi, (hr && verb.oniHr) || verb.oni,
    ].map(f => f.toLowerCase().trim())
    const hit = forms.find(form => uniqueTokens.includes(form))
    if (!hit) continue
    verbMatches.push({
      target: infinitive,
      translation: verb.translation,
      form: hit === infinitive.toLowerCase() ? undefined : hit,
      status: "new",
      order: firstIndex(hit),
    })
  }
  return [...verbMatches.sort((a, b) => a.order - b.order).slice(0, MAX_KEY_VERBS), ...keyWords]
}

export const toSlug = (title: string) =>
  title.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story"
