/**
 * Idempotently provisions the password_reset_tokens table.
 * Run against whatever DB .env.local points to:  npm run db:password-reset
 * (Migrations aren't version-controlled in this project, so tables are created
 *  directly — same pattern as scripts/blog-sync.ts.)
 */
import { createClient } from "@libsql/client"

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

  await client.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id    integer NOT NULL,
      token_hash text NOT NULL UNIQUE,
      expires_at integer NOT NULL,
      used_at    integer,
      created_at integer NOT NULL
    )
  `)

  console.log(`password_reset_tokens ready on ${url.replace(/^libsql:\/\//, "").split(".")[0]}`)
  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
