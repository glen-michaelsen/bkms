import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { words } from "../src/db/schema"

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)
  const all = await db.select({ id: words.id, english: words.english, serbian: words.serbian, croatian: words.croatian }).from(words)
  console.log(JSON.stringify(all))
  client.close()
}
main().catch(console.error)
