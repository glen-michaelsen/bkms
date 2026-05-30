/**
 * populate-female-forms.ts
 *
 * Uses the Claude API to identify words and sentences that have a gender-specific
 * feminine form in Serbian/Croatian, then stores those forms in the
 * serbian_female / croatian_female columns.
 *
 * Run with:
 *   dotenv -e .env.local -- tsx scripts/populate-female-forms.ts
 *
 * The script is idempotent — it skips rows that already have a female form filled in.
 * Pass --force to re-evaluate and overwrite existing values.
 * Pass --type words|sentences to limit to one table.
 */

import Anthropic from "@anthropic-ai/sdk"
import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { words, sentences } from "../src/db/schema"
import { eq, isNull, or } from "drizzle-orm"

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const force = args.includes("--force")
const typeFilter = args.includes("--type")
  ? args[args.indexOf("--type") + 1]
  : null // "words" | "sentences" | null = both

// ── DB + AI clients ─────────────────────────────────────────────────────────
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const db = drizzle(client)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Types ────────────────────────────────────────────────────────────────────
type ItemRow = { id: number; english: string; serbian: string; croatian: string }
type FemaleResult = {
  id: number
  serbian_female: string | null
  croatian_female: string | null
}

// ── Batch prompt ─────────────────────────────────────────────────────────────
/**
 * Ask Claude to find feminine forms for a batch of items.
 * Returns structured JSON — one entry per input item.
 */
async function getFemineForms(
  batch: ItemRow[],
  itemType: "words" | "sentences"
): Promise<FemaleResult[]> {
  const itemLabel = itemType === "words" ? "word/phrase" : "sentence"

  const prompt = `You are a Serbian and Croatian language expert.

I will give you a list of ${itemLabel}s in English, Serbian, and Croatian.
For each item, determine whether the ${itemLabel} contains a masculine-only form that has a distinct feminine version in Serbian or Croatian.

Rules:
- Adjectives like "umoran" (masc) → "umorna" (fem): YES, provide the feminine form.
- Nouns referring to a person where a feminine form exists: YES (e.g. "student" → "studentkinja", "učenik" → "učenica").
- Verbs conjugated as l-participle: "bio" → "bila", "htio" → "htjela".
- Neutral words, nouns for things, greetings, numbers, colours, fixed phrases: NO feminine form (return null for both).
- If Serbian and Croatian differ for the feminine form, provide each separately.
- If the feminine form is identical to the masculine (already gender-neutral), return null.
- For sentences: rewrite the whole sentence with all masculine forms replaced by feminine. If nothing changes, return null.

Respond with a JSON array — one object per input item — with this shape:
{ "id": <number>, "serbian_female": <string|null>, "croatian_female": <string|null> }

Input items:
${JSON.stringify(batch, null, 2)}

Respond with ONLY the JSON array, no explanation.`

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  // Strip optional markdown code fences
  const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

  try {
    return JSON.parse(json) as FemaleResult[]
  } catch {
    console.error("Failed to parse Claude response:", text)
    throw new Error("Claude returned non-JSON output")
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function processTable(
  table: typeof words | typeof sentences,
  tableName: "words" | "sentences"
) {
  console.log(`\n── ${tableName} ────────────────────────────────────`)

  // Fetch rows that need processing
  const rows: ItemRow[] = force
    ? await db.select({ id: table.id, english: table.english, serbian: table.serbian, croatian: table.croatian }).from(table)
    : await db
        .select({ id: table.id, english: table.english, serbian: table.serbian, croatian: table.croatian })
        .from(table)
        .where(or(isNull(table.serbianFemale), isNull(table.croatianFemale)))

  console.log(`Found ${rows.length} rows to process`)
  if (rows.length === 0) return

  // Process in batches of 30
  const BATCH_SIZE = 30
  let updated = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)…`)

    let results: FemaleResult[]
    try {
      results = await getFemineForms(batch, tableName)
    } catch (err) {
      console.error("  Skipping batch due to error:", err)
      continue
    }

    // Write back to DB
    for (const result of results) {
      // Skip if Claude says no feminine form for either language
      if (result.serbian_female === null && result.croatian_female === null) {
        skipped++
        continue
      }

      await db
        .update(table)
        .set({
          serbianFemale: result.serbian_female ?? null,
          croatianFemale: result.croatian_female ?? null,
        })
        .where(eq(table.id, result.id))

      updated++
      const row = batch.find((r) => r.id === result.id)
      console.log(
        `    ✓ #${result.id} "${row?.serbian}" → sr:"${result.serbian_female}" / hr:"${result.croatian_female}"`
      )
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < rows.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`  Done. Updated: ${updated}, no female form needed: ${skipped}`)
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set")
  }

  if (!typeFilter || typeFilter === "words") {
    await processTable(words, "words")
  }
  if (!typeFilter || typeFilter === "sentences") {
    await processTable(sentences, "sentences")
  }

  client.close()
  console.log("\nAll done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
