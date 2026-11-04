/**
 * Idempotently provisions the OAuth tables behind the MCP server.
 * Runs against whatever DB .env.local points to:  npm run db:mcp
 */
import { createClient } from "@libsql/client"

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS oauth_clients (
    id            integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    client_id     text NOT NULL UNIQUE,
    name          text NOT NULL,
    redirect_uris text NOT NULL,
    created_at    integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_codes (
    id             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    code_hash      text NOT NULL UNIQUE,
    client_id      text NOT NULL,
    user_id        integer NOT NULL REFERENCES users(id),
    family_id      text NOT NULL,
    redirect_uri   text NOT NULL,
    code_challenge text NOT NULL,
    resource       text,
    expires_at     integer NOT NULL,
    used_at        integer
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_tokens (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    token_hash text NOT NULL UNIQUE,
    kind       text NOT NULL,
    client_id  text NOT NULL,
    user_id    integer NOT NULL REFERENCES users(id),
    family_id  text NOT NULL,
    resource   text,
    expires_at integer NOT NULL,
    used_at    integer,
    revoked_at integer,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS oauth_tokens_user_idx ON oauth_tokens (user_id)`,
  `CREATE INDEX IF NOT EXISTS oauth_tokens_family_idx ON oauth_tokens (family_id)`,
]

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  for (const sql of STATEMENTS) await client.execute(sql)
  console.log(`MCP OAuth tables ready on ${url.replace(/^libsql:\/\//, "").split(".")[0]}`)
  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
