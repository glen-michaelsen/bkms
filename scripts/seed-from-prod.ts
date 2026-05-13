/**
 * One-time script: copy content tables from the production Turso DB into the
 * local SQLite file (local.db).
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/seed-from-prod.ts
 *
 * The script reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from the env for the
 * prod connection, and writes to file:./local.db.
 * Existing rows are replaced (INSERT OR REPLACE).
 */

import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "../src/db/schema"

const CONTENT_TABLES = ["categories", "levels", "words", "sentences", "verbs"] as const

async function main() {
  const prodUrl = process.env.TURSO_DATABASE_URL
  if (!prodUrl || prodUrl.startsWith("file:")) {
    console.error("TURSO_DATABASE_URL must point to the remote Turso DB, not a local file.")
    process.exit(1)
  }

  const prod = drizzle(
    createClient({ url: prodUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
    { schema },
  )

  const local = drizzle(
    createClient({ url: "file:./local.db" }),
    { schema },
  )

  for (const table of CONTENT_TABLES) {
    const rows = await (prod.select().from(schema[table]) as any).all()
    if (rows.length === 0) {
      console.log(`  ${table}: empty, skipping`)
      continue
    }
    await (local.delete(schema[table]) as any)
    // Insert in batches to stay within SQLite's variable limit
    const BATCH = 50
    for (let i = 0; i < rows.length; i += BATCH) {
      await (local.insert(schema[table]) as any).values(rows.slice(i, i + BATCH))
    }
    console.log(`  ${table}: copied ${rows.length} rows`)
  }

  console.log("Done.")
}

main().catch((err) => { console.error(err); process.exit(1) })
