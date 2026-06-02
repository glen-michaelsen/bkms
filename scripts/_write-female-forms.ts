import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { words } from "../src/db/schema"
import { eq } from "drizzle-orm"

const FEMALE_FORMS: Array<{ id: number; serbianFemale: string; croatianFemale: string }> = [
  { id: 19,  serbianFemale: "prijateljica",  croatianFemale: "prijateljica" },
  { id: 29,  serbianFemale: "prva",          croatianFemale: "prva" },
  { id: 30,  serbianFemale: "druga",         croatianFemale: "druga" },
  { id: 61,  serbianFemale: "dobra",         croatianFemale: "dobra" },
  { id: 62,  serbianFemale: "loša",          croatianFemale: "loša" },
  { id: 63,  serbianFemale: "velika",        croatianFemale: "velika" },
  { id: 64,  serbianFemale: "mala",          croatianFemale: "mala" },
  { id: 65,  serbianFemale: "nova",          croatianFemale: "nova" },
  { id: 66,  serbianFemale: "stara",         croatianFemale: "stara" },
  { id: 67,  serbianFemale: "laka",          croatianFemale: "laka" },
  { id: 68,  serbianFemale: "teška",         croatianFemale: "teška" },
  { id: 69,  serbianFemale: "brza",          croatianFemale: "brza" },
  { id: 70,  serbianFemale: "spora",         croatianFemale: "spora" },
  { id: 148, serbianFemale: "jeftina",       croatianFemale: "jeftina" },
  { id: 149, serbianFemale: "skupa",         croatianFemale: "skupa" },
  { id: 166, serbianFemale: "doktorka",      croatianFemale: "liječnica" },
  { id: 199, serbianFemale: "vozačica",      croatianFemale: "vozačica" },
  { id: 204, serbianFemale: "nastavnica",    croatianFemale: "nastavnica" },
  { id: 205, serbianFemale: "studentkinja",  croatianFemale: "studentica" },
  { id: 231, serbianFemale: "srećna",        croatianFemale: "sretna" },
  { id: 232, serbianFemale: "tužna",         croatianFemale: "tužna" },
  { id: 233, serbianFemale: "ljuta",         croatianFemale: "ljuta" },
  { id: 234, serbianFemale: "umorna",        croatianFemale: "umorna" },
  { id: 235, serbianFemale: "uzbuđena",      croatianFemale: "uzbuđena" },
  { id: 236, serbianFemale: "mirna",         croatianFemale: "mirna" },
  { id: 237, serbianFemale: "uplašena",      croatianFemale: "uplašena" },
  { id: 238, serbianFemale: "iznenađena",    croatianFemale: "iznenađena" },
]

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)

  for (const row of FEMALE_FORMS) {
    await db.update(words)
      .set({ serbianFemale: row.serbianFemale, croatianFemale: row.croatianFemale })
      .where(eq(words.id, row.id))
    console.log(`✓ #${row.id}: sr=${row.serbianFemale}, hr=${row.croatianFemale}`)
  }

  console.log(`\nDone — ${FEMALE_FORMS.length} words updated.`)
  client.close()
}

main().catch(console.error)
