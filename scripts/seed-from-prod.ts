/**
 * One-time script: copy content tables from the production Turso DB into the
 * local SQLite file (local.db).
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/seed-from-prod.ts
 *
 * The script reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from the env for the
 * prod connection, and writes to file:./local.db.
 */

import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "../src/db/schema"

// Delete order respects FK constraints (children before parents)
const DELETE_ORDER  = ["sentences", "words", "verbs", "categories", "levels"] as const
const INSERT_ORDER  = ["levels", "categories", "verbs", "words", "sentences"] as const

async function main() {
  const prodUrl = process.env.TURSO_DATABASE_URL
  if (!prodUrl || prodUrl.startsWith("file:")) {
    console.error("TURSO_DATABASE_URL must point to the remote Turso DB, not a local file.")
    process.exit(1)
  }

  const prodClient = createClient({ url: prodUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  const localClient = createClient({ url: "file:./local.db" })

  const prod  = drizzle(prodClient,  { schema })
  const local = drizzle(localClient, { schema })

  // Read all content from prod first
  const data: Record<string, any[]> = {}
  for (const table of INSERT_ORDER) {
    data[table] = await (prod.select().from(schema[table]) as any).all()
    console.log(`  ${table}: ${data[table].length} rows fetched from prod`)
  }

  // Wipe local in FK-safe order
  await localClient.execute("PRAGMA foreign_keys = OFF")
  for (const table of DELETE_ORDER) {
    await (local.delete(schema[table]) as any)
  }

  // Insert in FK-safe order, batching to stay within SQLite variable limits
  const BATCH = 50
  for (const table of INSERT_ORDER) {
    const rows = data[table]
    if (rows.length === 0) {
      console.log(`  ${table}: empty, skipping`)
      continue
    }
    for (let i = 0; i < rows.length; i += BATCH) {
      await (local.insert(schema[table]) as any).values(rows.slice(i, i + BATCH))
    }
    console.log(`  ${table}: inserted ${rows.length} rows`)
  }

  await localClient.execute("PRAGMA foreign_keys = ON")
  console.log("Done.")
}

main().catch((err) => { console.error(err); process.exit(1) })
