import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { sentences } from "../src/db/schema"

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)
  const all = await db.select({ id: sentences.id, english: sentences.english, serbian: sentences.serbian, croatian: sentences.croatian }).from(sentences)
  console.log(JSON.stringify(all))
  client.close()
}
main().catch(console.error)
