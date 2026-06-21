import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { words } from "@/db/schema"
import { AlphabetExercise } from "@/components/AlphabetExercise"

// Serbian / Croatian Latin alphabet (digraphs treated as single units)
export const SR_ALPHA = [
  "A","B","C","Č","Ć","D","DŽ","Đ","E","F","G","H",
  "I","J","K","L","LJ","M","N","NJ","O","P","R","S","Š","T","U","V","Z","Ž",
]
const EN_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

function matchesLetter(word: string, letter: string): boolean {
  return word.toLowerCase().startsWith(letter.toLowerCase())
}

/** Group words into { letter → words[] }, checking digraphs before single chars. */
function groupByLetter(
  items: { display: string; translation: string; id: number }[],
  alphabet: string[],
): Record<string, { id: number; display: string; translation: string }[]> {
  const map: Record<string, { id: number; display: string; translation: string }[]> = {}
  for (const letter of alphabet) map[letter] = []

  // Sort alphabet so longer (digraph) entries are checked first
  const sorted = [...alphabet].sort((a, b) => b.length - a.length)

  for (const item of items) {
    for (const letter of sorted) {
      if (matchesLetter(item.display, letter)) {
        // Make sure a digraph match isn't shadowed by its first single letter
        map[letter].push(item)
        break
      }
    }
  }
  return map
}

export default async function AlphabetPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const language        = (session.user.language ?? "sr") as "sr" | "hr"
  const isFemale        = session.user.gender === "female"
  const isEnglishLearner = (session.user.studyDirection ?? "to_slavic") === "to_english"

  const allWords = await db.select().from(words)

  const alphabet = isEnglishLearner ? EN_ALPHA : SR_ALPHA
  const langName = isEnglishLearner ? "English" : language === "hr" ? "Croatian" : "Serbian"

  const items = allWords.map(w => {
    let display: string
    if (isEnglishLearner) {
      display = w.english
    } else {
      const base   = language === "sr" ? w.serbian : w.croatian
      const female = language === "sr" ? w.serbianFemale : w.croatianFemale
      display = (isFemale && female) ? female : base
    }
    const translation = isEnglishLearner
      ? (() => { const b = language === "sr" ? w.serbian : w.croatian; const f = language === "sr" ? w.serbianFemale : w.croatianFemale; return (isFemale && f) ? f : b })()
      : w.english
    return { id: w.id, display, translation }
  })

  const letterMap = groupByLetter(items, alphabet)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Back
          </Link>
          <img src="/logo.svg" alt="Čujemo se" className="h-6" />
          <div className="w-14" />
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">The {langName} Alphabet</h1>
          <p className="text-sm text-slate-500 mt-1">{alphabet.length} letters · tap a letter to explore</p>
        </div>
        <AlphabetExercise letterMap={letterMap} alphabet={alphabet} langName={langName} />
      </main>
    </div>
  )
}
