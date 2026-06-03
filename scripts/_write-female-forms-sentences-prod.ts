import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { sentences } from "../src/db/schema"
import { eq } from "drizzle-orm"

const FEMALE_FORMS: Array<{ id: number; serbianFemale: string; croatianFemale: string }> = [

  // ── Adjective / state predicates (speaker describes themselves) ──────────────
  { id: 39,  serbianFemale: "Slobodna sam danas.",    croatianFemale: "Slobodna sam danas." },
  { id: 85,  serbianFemale: "Zašto si umorna?",       croatianFemale: "Zašto si umorna?" },
  { id: 131, serbianFemale: "Gladna sam.",             croatianFemale: "Gladna sam." },
  { id: 132, serbianFemale: "Žedna sam.",              croatianFemale: "Žedna sam." },
  { id: 162, serbianFemale: "Prehlađena sam.",         croatianFemale: "Prehlađena sam." },
  { id: 169, serbianFemale: "Umorna sam.",             croatianFemale: "Umorna sam." },
  { id: 231, serbianFemale: "Danas sam srećna.",       croatianFemale: "Danas sam sretna." },
  { id: 240, serbianFemale: "Malo sam nervozna.",      croatianFemale: "Malo sam nervozna." },
  { id: 521, serbianFemale: "Uvek sam produktivnija ponedeljkom nego petkom.",  croatianFemale: "Uvijek sam produktivnija ponedjeljkom nego petkom." },
  { id: 538, serbianFemale: "Nisam sigurna da li je ovo bež ili svetlosmeđe.", croatianFemale: "Nisam sigurna je li ovo bež ili svijetlosmeđe." },
  { id: 563, serbianFemale: "Nisam sigurna zašto voz opet kasni.",             croatianFemale: "Nisam sigurna zašto vlak opet kasni." },
  { id: 720, serbianFemale: "Lakše se fokusiram kada sam mirna i odmorena.",   croatianFemale: "Lakše se usredotočim kada sam mirna i odmorena." },
  { id: 723, serbianFemale: "Ja sam spremna.",         croatianFemale: "Ja sam spremna." },

  // ── L-participle past tense (speaker is subject) ────────────────────────────
  { id: 216, serbianFemale: "Poslala sam imejl.",      croatianFemale: "Poslala sam e-mail." },
  { id: 483, serbianFemale: "Htela sam da se javim pre nego što odem.",        croatianFemale: "Htjela sam se javiti prije nego što odem." },
  { id: 488, serbianFemale: "Samo sam htela da se predstavim kako treba.",     croatianFemale: "Samo sam se htjela kako treba predstaviti." },
  { id: 502, serbianFemale: "Prebrojala sam kutije dva puta i još ih ima samo devetnaest.", croatianFemale: "Prebrojala sam kutije dva puta i još ih je samo devetnaest." },
  { id: 510, serbianFemale: "Već sam pročitala dve trećine knjige.",           croatianFemale: "Već sam pročitala dvije trećine knjige." },
  { id: 516, serbianFemale: "Pogrešno sam napisala datum na formularu.",       croatianFemale: "Pogrešno sam napisala datum na obrascu." },
  { id: 519, serbianFemale: "Rok je mnogo bliži nego što sam očekivala.",      croatianFemale: "Rok je mnogo bliži nego što sam očekivala." },
  { id: 531, serbianFemale: "Izabrala sam tamnoplavu jer izgleda elegantnije.", croatianFemale: "Izabrala sam tamnoplavu jer izgleda elegantnije." },
  { id: 534, serbianFemale: "Crvena verzija je bila rasprodata, pa sam kupila crnu.", croatianFemale: "Crvena verzija je bila rasprodana pa sam kupila crnu." },
  { id: 548, serbianFemale: "To je bilo čudno pitanje, pa nisam znala šta da kažem.", croatianFemale: "To je bilo čudno pitanje pa nisam znala što reći." },
  { id: 551, serbianFemale: "Zaboravila sam da pošaljem mejl pre ručka.",      croatianFemale: "Zaboravila sam poslati e-mail prije ručka." },
  { id: 554, serbianFemale: "Pokušala sam da objasnim, ali nije razumeo.",     croatianFemale: "Pokušala sam objasniti, ali nije razumio." },
  { id: 560, serbianFemale: "Radije bih sačekala ovde nego se vratila napolje.", croatianFemale: "Radije bih pričekala ovdje nego se vratila van." },
  { id: 564, serbianFemale: "Kako si naučila da govoriš tako sigurno?",        croatianFemale: "Kako si naučila govoriti tako sigurno?" },
  { id: 571, serbianFemale: "Mislila sam da oni već znaju za promenu.",        croatianFemale: "Mislila sam da oni već znaju za promjenu." },
  { id: 584, serbianFemale: "Celo popodne sam provela u biblioteci.",          croatianFemale: "Cijelo poslijepodne provela sam u knjižnici." },
  { id: 590, serbianFemale: "Nikada ranije nisam bila u tom delu grada.",      croatianFemale: "Nikada prije nisam bila u tom dijelu grada." },
  { id: 611, serbianFemale: "Naručila sam nešto lagano jer nisam bila mnogo gladna.", croatianFemale: "Naručila sam nešto lagano jer nisam bila jako gladna." },
  { id: 612, serbianFemale: "Ova supa ima bolji ukus nego što sam očekivala.", croatianFemale: "Ova juha ima bolji okus nego što sam očekivala." },
  { id: 615, serbianFemale: "Porcija je bila toliko velika da nisam mogla da je pojedem do kraja.", croatianFemale: "Porcija je bila toliko velika da je nisam mogla pojesti do kraja." },
  { id: 621, serbianFemale: "Tražila sam nešto jeftinije, ali i ovo će poslužiti.", croatianFemale: "Tražila sam nešto jeftinije, ali i ovo će poslužiti." },
  { id: 624, serbianFemale: "Nisu imali moj broj, pa sam ga naručila onlajn.", croatianFemale: "Nisu imali moj broj, pa sam ga naručila online." },
  { id: 626, serbianFemale: "Ovo je bilo na popustu, zato sam kupila dva.",    croatianFemale: "Ovo je bilo na sniženju, zato sam kupila dva." },
  { id: 629, serbianFemale: "Na kraju sam kupila nešto sasvim drugo.",         croatianFemale: "Na kraju sam kupila nešto sasvim drugo." },
  { id: 640, serbianFemale: "Volela bih da soba deluje toplije i udobnije.",   croatianFemale: "Voljela bih da soba djeluje toplije i udobnije." },
  { id: 657, serbianFemale: "Zaboravila sam da ponesem dodatni džemper.",      croatianFemale: "Zaboravila sam ponijeti dodatni džemper." },
  { id: 665, serbianFemale: "Nisam očekivala da će u aprilu biti ovoliko hladno.", croatianFemale: "Nisam očekivala da će u travnju biti ovako hladno." },
  { id: 689, serbianFemale: "Prošle nedelje sam propustila jedan čas jer sam bila bolesna.", croatianFemale: "Prošli tjedan propustila sam jedan sat jer sam bila bolesna." },
  { id: 692, serbianFemale: "Zaboravila sam lozinku, pa sam morala da resetujem nalog.", croatianFemale: "Zaboravila sam lozinku pa sam morala resetirati račun." },
  { id: 695, serbianFemale: "Napravila sam rezervnu kopiju svega pre nego što sam promenila podešavanja.", croatianFemale: "Napravila sam sigurnosnu kopiju svega prije nego što sam promijenila postavke." },
  { id: 701, serbianFemale: "Više čitam otkad sam počela da idem vozom na posao.", croatianFemale: "Više čitam otkad sam počela ići vlakom na posao." },
  { id: 707, serbianFemale: "Volela bih da više putujem kada ne bi bilo tako skupo.", croatianFemale: "Voljela bih više putovati kad ne bi bilo tako skupo." },
  { id: 709, serbianFemale: "Počela sam više da kuvam kod kuće umesto da naručujem hranu.", croatianFemale: "Počela sam više kuhati kod kuće umjesto da naručujem hranu." },
  { id: 711, serbianFemale: "Osetila sam olakšanje kada sam čula da je sve u redu.", croatianFemale: "Osjetila sam olakšanje kad sam čula da je sve u redu." },
]

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)

  for (const row of FEMALE_FORMS) {
    await db.update(sentences)
      .set({ serbianFemale: row.serbianFemale, croatianFemale: row.croatianFemale })
      .where(eq(sentences.id, row.id))
    console.log(`✓ #${row.id}`)
  }

  console.log(`\nDone — ${FEMALE_FORMS.length} sentences updated.`)
  client.close()
}

main().catch(console.error)
