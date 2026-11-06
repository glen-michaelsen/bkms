/**
 * Creates the stories tables if needed, then adds any stories from
 * content/stories/*.json that aren't in the database yet.
 *
 * Existing stories are skipped, because admin edits live in the database and
 * must not be overwritten. Levels and categories are matched by name since
 * their ids differ between databases.
 *
 *   npm run db:stories
 */
import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { createClient } from "@libsql/client"

const DIR = join(process.cwd(), "content", "stories")

type StoryFile = {
  slug: string
  title: { serbian: string; croatian: string; english: string }
  level: string
  category: string
  published?: boolean
  lines: { serbian: string; croatian: string; english: string }[]
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  console.log(`Syncing stories into ${url.replace(/^libsql:\/\//, "").split(".")[0]}`)
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

  await client.batch([
    `CREATE TABLE IF NOT EXISTS stories (
      id          integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      slug        text NOT NULL UNIQUE,
      title_sr    text NOT NULL,
      title_hr    text NOT NULL,
      title_en    text NOT NULL,
      level_id    integer NOT NULL REFERENCES levels(id),
      category_id integer NOT NULL REFERENCES categories(id),
      published   integer NOT NULL DEFAULT 0,
      created_at  integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS story_lines (
      id       integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      story_id integer NOT NULL REFERENCES stories(id),
      position integer NOT NULL,
      serbian  text NOT NULL,
      croatian text NOT NULL,
      english  text NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS story_lines_story_idx ON story_lines (story_id, position)`,
    `CREATE TABLE IF NOT EXISTS user_story_progress (
      id            integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id       integer NOT NULL REFERENCES users(id),
      story_id      integer NOT NULL REFERENCES stories(id),
      understanding text NOT NULL,
      read_at       integer NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS user_story_progress_user_story_unique ON user_story_progress (user_id, story_id)`,
  ], "write")

  await client.execute(`CREATE TABLE IF NOT EXISTS story_images (
    story_id  integer NOT NULL REFERENCES stories(id),
    size      integer NOT NULL,
    mime_type text NOT NULL,
    data      blob NOT NULL,
    PRIMARY KEY (story_id, size)
  )`)
  try {
    await client.execute("ALTER TABLE stories ADD COLUMN image_version text")
  } catch (e) {
    if (!/duplicate column/i.test(String(e))) throw e
  }

  const files = readdirSync(DIR).filter(f => f.endsWith(".json"))
  const lookup = async (table: "levels" | "categories", name: string) => {
    const rows = await client.execute({ sql: `SELECT id FROM ${table} WHERE lower(name) = lower(?)`, args: [name] })
    if (rows.rows.length === 0) throw new Error(`No ${table} row named "${name}"`)
    return Number(rows.rows[0].id)
  }

  for (const file of files) {
    const story = JSON.parse(readFileSync(join(DIR, file), "utf8")) as StoryFile
    const existing = await client.execute({ sql: "SELECT id FROM stories WHERE slug = ?", args: [story.slug] })
    if (existing.rows.length > 0) {
      console.log(`  skipped  ${story.slug} (already exists)`)
      continue
    }
    const levelId = await lookup("levels", story.level)
    const categoryId = await lookup("categories", story.category)
    const tx = await client.transaction("write")
    try {
      const inserted = await tx.execute({
        sql: `INSERT INTO stories (slug, title_sr, title_hr, title_en, level_id, category_id, published, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [
          story.slug, story.title.serbian, story.title.croatian, story.title.english,
          levelId, categoryId, story.published ? 1 : 0, Math.floor(Date.now() / 1000),
        ],
      })
      const storyId = Number(inserted.rows[0].id)
      for (const [position, line] of story.lines.entries()) {
        await tx.execute({
          sql: "INSERT INTO story_lines (story_id, position, serbian, croatian, english) VALUES (?, ?, ?, ?, ?)",
          args: [storyId, position, line.serbian, line.croatian, line.english],
        })
      }
      await tx.commit()
      console.log(`  created  ${story.slug} (${story.lines.length} lines)`)
    } catch (e) {
      await tx.rollback()
      throw e
    }
  }
  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
