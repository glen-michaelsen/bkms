import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { words } from "@/db/schema"
import { sql } from "drizzle-orm"
import { WordMatch } from "@/components/WordMatch"

export default async function WordMatchPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const picked = await db
    .select({ id: words.id, serbian: words.serbian, english: words.english })
    .from(words)
    .orderBy(sql`RANDOM()`)
    .limit(5)
    .all()

  return <WordMatch initialWords={picked} />
}
