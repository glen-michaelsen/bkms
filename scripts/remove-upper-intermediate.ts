/**
 * Removes the "Upper intermediate" level. Anyone with a share assigned to it has
 * that share moved to "Intermediate", so their settings still total 100%.
 * Stops without changing anything if a sentence or story uses the level.
 * Safe to re-run: does nothing once the level is gone.
 *
 *   npm run db:remove-upper-intermediate
 */
import { createClient } from "@libsql/client"

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  console.log(`Target: ${url.replace(/^libsql:\/\//, "").split(".")[0]}`)
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  const idOf = async (name: string) => {
    const r = await client.execute({ sql: "SELECT id FROM levels WHERE lower(name) = ?", args: [name] })
    return r.rows.length ? Number(r.rows[0].id) : null
  }

  const upper = await idOf("upper intermediate")
  if (upper === null) {
    console.log("Level already gone. Nothing to do.")
    return client.close()
  }
  const intermediate = await idOf("intermediate")
  if (intermediate === null) throw new Error('No "Intermediate" level to move shares to')

  const used = await client.execute({ sql: "SELECT COUNT(*) AS n FROM sentences WHERE level_id = ?", args: [upper] })
  if (Number(used.rows[0].n) > 0) throw new Error(`${used.rows[0].n} sentences use this level. Aborting.`)
  const usedByStories = await client.execute({
    sql: `SELECT COUNT(*) AS n FROM stories WHERE level_id = ?`, args: [upper],
  })
  if (Number(usedByStories.rows[0].n) > 0) throw new Error("Stories use this level. Aborting.")

  const tx = await client.transaction("write")
  try {
    const shares = await tx.execute({
      sql: "SELECT user_id, percentage FROM user_level_config WHERE level_id = ? AND percentage > 0", args: [upper],
    })
    for (const row of shares.rows) {
      const updated = await tx.execute({
        sql: "UPDATE user_level_config SET percentage = percentage + ? WHERE user_id = ? AND level_id = ?",
        args: [row.percentage, row.user_id, intermediate],
      })
      if (updated.rowsAffected === 0) {
        await tx.execute({
          sql: "INSERT INTO user_level_config (user_id, level_id, percentage) VALUES (?, ?, ?)",
          args: [row.user_id, intermediate, row.percentage],
        })
      }
    }
    const removed = await tx.execute({ sql: "DELETE FROM user_level_config WHERE level_id = ?", args: [upper] })
    await tx.execute({ sql: "DELETE FROM levels WHERE id = ?", args: [upper] })
    await tx.commit()
    console.log(`Moved ${shares.rows.length} share(s) to Intermediate, removed ${removed.rowsAffected} settings rows and the level.`)
  } catch (e) {
    await tx.rollback()
    throw e
  }
  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
