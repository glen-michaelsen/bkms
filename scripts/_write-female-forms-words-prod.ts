import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { words } from "../src/db/schema"
import { eq } from "drizzle-orm"

const FEMALE_FORMS: Array<{ id: number; serbianFemale: string | null; croatianFemale: string | null }> = [

  // ── Ordinals ─────────────────────────────────────────────────────────────────
  { id: 29,  serbianFemale: "prva",    croatianFemale: "prva" },
  { id: 30,  serbianFemale: "druga",   croatianFemale: "druga" },
  { id: 290, serbianFemale: "treća",   croatianFemale: "treća" },

  // ── Colors (base adjective form → feminine) ───────────────────────────────
  { id: 51, serbianFemale: "crvena",      croatianFemale: "crvena" },
  { id: 52, serbianFemale: "plava",       croatianFemale: "plava" },
  { id: 53, serbianFemale: "zelena",      croatianFemale: "zelena" },
  { id: 54, serbianFemale: "žuta",        croatianFemale: "žuta" },
  { id: 55, serbianFemale: "crna",        croatianFemale: "crna" },
  { id: 56, serbianFemale: "bela",        croatianFemale: "bijela" },
  { id: 57, serbianFemale: "siva",        croatianFemale: "siva" },
  { id: 58, serbianFemale: "smeđa",       croatianFemale: "smeđa" },
  { id: 59, serbianFemale: "narandžasta", croatianFemale: "narančasta" },
  // "roze" is invariable in Serbian; "ružičast" → "ružičasta" in Croatian
  { id: 60, serbianFemale: null,          croatianFemale: "ružičasta" },

  // ── Quality adjectives — batch 1 (61–70) ─────────────────────────────────
  { id: 61, serbianFemale: "dobra",  croatianFemale: "dobra" },
  { id: 62, serbianFemale: "loša",   croatianFemale: "loša" },
  { id: 63, serbianFemale: "velika", croatianFemale: "velika" },
  { id: 64, serbianFemale: "mala",   croatianFemale: "mala" },
  { id: 65, serbianFemale: "nova",   croatianFemale: "nova" },
  { id: 66, serbianFemale: "stara",  croatianFemale: "stara" },
  { id: 67, serbianFemale: "laka",   croatianFemale: "laka" },
  { id: 68, serbianFemale: "teška",  croatianFemale: "teška" },
  { id: 69, serbianFemale: "brza",   croatianFemale: "brza" },
  { id: 70, serbianFemale: "spora",  croatianFemale: "spora" },

  // ── Cheap / expensive — batch 1 ───────────────────────────────────────────
  { id: 148, serbianFemale: "jeftina", croatianFemale: "jeftina" },
  { id: 149, serbianFemale: "skupa",   croatianFemale: "skupa" },

  // ── People & professions ──────────────────────────────────────────────────
  { id: 19,  serbianFemale: "prijateljica",  croatianFemale: "prijateljica" },
  { id: 166, serbianFemale: "doktorka",      croatianFemale: "liječnica" },
  { id: 199, serbianFemale: "vozačica",      croatianFemale: "vozačica" },
  { id: 204, serbianFemale: "nastavnica",    croatianFemale: "nastavnica" },
  { id: 205, serbianFemale: "studentkinja",  croatianFemale: "studentica" },
  { id: 268, serbianFemale: "rođaka",        croatianFemale: "rođakinja" },
  { id: 274, serbianFemale: "komšinica",     croatianFemale: "susjeda" },
  { id: 275, serbianFemale: "koleginica",    croatianFemale: "kolegica" },
  { id: 276, serbianFemale: "nastavnica",    croatianFemale: "nastavnica" },   // duplicate entry
  { id: 277, serbianFemale: "studentkinja",  croatianFemale: "studentica" },   // duplicate entry
  { id: 280, serbianFemale: "gošća",         croatianFemale: "gošća" },
  { id: 530, serbianFemale: "prodavačica",   croatianFemale: "prodavačica" },
  { id: 571, serbianFemale: "doktorka",      croatianFemale: "doktorica" },    // second doctor entry (doktor/doktor)
  { id: 629, serbianFemale: "putnica",       croatianFemale: "putnica" },
  { id: 642, serbianFemale: "šefica",        croatianFemale: "šefica" },

  // ── Emotions — batch 1 (231–238) ─────────────────────────────────────────
  { id: 231, serbianFemale: "srećna",     croatianFemale: "sretna" },
  { id: 232, serbianFemale: "tužna",      croatianFemale: "tužna" },
  { id: 233, serbianFemale: "ljuta",      croatianFemale: "ljuta" },
  { id: 234, serbianFemale: "umorna",     croatianFemale: "umorna" },
  { id: 235, serbianFemale: "uzbuđena",   croatianFemale: "uzbuđena" },
  { id: 236, serbianFemale: "mirna",      croatianFemale: "mirna" },
  { id: 237, serbianFemale: "uplašena",   croatianFemale: "uplašena" },
  { id: 238, serbianFemale: "iznenađena", croatianFemale: "iznenađena" },

  // ── Quality adjectives — batch 2 (361–380) ───────────────────────────────
  { id: 361, serbianFemale: "velika",    croatianFemale: "velika" },
  { id: 362, serbianFemale: "mala",      croatianFemale: "mala" },
  { id: 363, serbianFemale: "dobra",     croatianFemale: "dobra" },
  { id: 364, serbianFemale: "loša",      croatianFemale: "loša" },
  { id: 365, serbianFemale: "nova",      croatianFemale: "nova" },
  { id: 366, serbianFemale: "stara",     croatianFemale: "stara" },
  { id: 367, serbianFemale: "mlada",     croatianFemale: "mlada" },
  { id: 368, serbianFemale: "laka",      croatianFemale: "laka" },
  { id: 369, serbianFemale: "teška",     croatianFemale: "teška" },
  { id: 370, serbianFemale: "brza",      croatianFemale: "brza" },
  { id: 371, serbianFemale: "spora",     croatianFemale: "spora" },
  { id: 372, serbianFemale: "vruća",     croatianFemale: "vruća" },
  { id: 373, serbianFemale: "hladna",    croatianFemale: "hladna" },
  { id: 374, serbianFemale: "jeftina",   croatianFemale: "jeftina" },
  { id: 375, serbianFemale: "skupa",     croatianFemale: "skupa" },
  { id: 376, serbianFemale: "čista",     croatianFemale: "čista" },
  { id: 377, serbianFemale: "prljava",   croatianFemale: "prljava" },
  { id: 378, serbianFemale: "otvorena",  croatianFemale: "otvorena" },
  { id: 379, serbianFemale: "zatvorena", croatianFemale: "zatvorena" },
  { id: 380, serbianFemale: "važna",     croatianFemale: "važna" },

  // ── Health adjectives ─────────────────────────────────────────────────────
  { id: 576, serbianFemale: "zdrava",   croatianFemale: "zdrava" },
  { id: 577, serbianFemale: "bolesna",  croatianFemale: "bolesna" },

  // ── Emotions — batch 2 (701–718) ─────────────────────────────────────────
  { id: 701, serbianFemale: "srećna",     croatianFemale: "sretna" },
  { id: 702, serbianFemale: "tužna",      croatianFemale: "tužna" },
  { id: 703, serbianFemale: "ljuta",      croatianFemale: "ljuta" },
  { id: 704, serbianFemale: "umorna",     croatianFemale: "umorna" },
  { id: 705, serbianFemale: "gladna",     croatianFemale: "gladna" },
  { id: 706, serbianFemale: "žedna",      croatianFemale: "žedna" },
  { id: 707, serbianFemale: "uzbuđena",   croatianFemale: "uzbuđena" },
  { id: 708, serbianFemale: "zabrinuta",  croatianFemale: "zabrinuta" },
  { id: 709, serbianFemale: "mirna",      croatianFemale: "mirna" },
  { id: 710, serbianFemale: "nervozna",   croatianFemale: "nervozna" },
  { id: 711, serbianFemale: "iznenađena", croatianFemale: "iznenađena" },
  { id: 712, serbianFemale: "uplašena",   croatianFemale: "uplašena" },
  { id: 717, serbianFemale: "ponosna",    croatianFemale: "ponosna" },
  { id: 718, serbianFemale: "postiđena",  croatianFemale: "posramljena" },

  // ── Greetings with gender-inflected participle ────────────────────────────
  // "dobrodošao" is masculine past participle; female = "dobrodošla"
  { id: 258, serbianFemale: "dobrodošla nazad", croatianFemale: "dobrodošla nazad" },
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
    console.log(`✓ #${row.id}`)
  }

  console.log(`\nDone — ${FEMALE_FORMS.length} words updated.`)
  client.close()
}

main().catch(console.error)
