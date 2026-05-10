import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { words, sentences } from "../src/db/schema"

function stripTrailingPeriods(text: string): string {
  // Remove one or more trailing periods, but leave ? and ! untouched
  return text.replace(/\.+$/, "").trim()
}

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)

  // ── Words ────────────────────────────────────────────────────────────────────
  const allWords = await db.select().from(words)
  let wordsFixed = 0

  for (const word of allWords) {
    const english  = stripTrailingPeriods(word.english)
    const serbian  = stripTrailingPeriods(word.serbian)
    const croatian = stripTrailingPeriods(word.croatian)

    if (english !== word.english || serbian !== word.serbian || croatian !== word.croatian) {
      await db.update(words)
        .set({ english, serbian, croatian })
        .where((await import("drizzle-orm")).eq(words.id, word.id))
      wordsFixed++
      console.log(`  word #${word.id}: "${word.english}" → "${english}" | "${word.serbian}" → "${serbian}"`)
    }
  }

  // ── Sentences ────────────────────────────────────────────────────────────────
  const allSentences = await db.select().from(sentences)
  let sentencesFixed = 0

  for (const sentence of allSentences) {
    const english  = stripTrailingPeriods(sentence.english)
    const serbian  = stripTrailingPeriods(sentence.serbian)
    const croatian = stripTrailingPeriods(sentence.croatian)

    if (english !== sentence.english || serbian !== sentence.serbian || croatian !== sentence.croatian) {
      await db.update(sentences)
        .set({ english, serbian, croatian })
        .where((await import("drizzle-orm")).eq(sentences.id, sentence.id))
      sentencesFixed++
      console.log(`  sentence #${sentence.id}: "${sentence.english}" → "${english}"`)
    }
  }

  console.log(`\nDone — ${wordsFixed} words and ${sentencesFixed} sentences cleaned.`)
  client.close()
}

main().catch(console.error)
