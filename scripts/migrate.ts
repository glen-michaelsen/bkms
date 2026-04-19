import { migrate } from "drizzle-orm/libsql/migrator"
import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const db = drizzle(client)
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("Migration complete")
  client.close()
}

main().catch(console.error)
