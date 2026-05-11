import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

// Lazy singleton — client is only created on first actual use (request time),
// never at module-import time, so Next.js build analysis doesn't need the env vars.
type DB = ReturnType<typeof drizzle<typeof schema>>

let _db: DB | undefined

function getDb(): DB {
  if (!_db) {
    _db = drizzle(
      createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
      { schema },
    )
  }
  return _db
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver)
  },
})
