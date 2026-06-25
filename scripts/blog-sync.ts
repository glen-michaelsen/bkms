/**
 * Blog sync — pushes markdown articles into the database.
 *
 * Articles live as `content/blog/*.md` with frontmatter. This script renders
 * each one to HTML once and upserts it into `blog_posts` by slug. It is
 * idempotent: re-running updates changed posts and leaves the rest untouched.
 *
 * No content is generated at runtime — the writing happens at dev time (by an
 * AI assistant, then committed to the repo), so the running app spends zero
 * API credits. The front-end reads only the `blog_posts` table.
 *
 * Run against whatever DB `.env.local` points to:
 *   npm run db:blog
 */
import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { createClient } from "@libsql/client"
import { marked } from "marked"
import matter from "gray-matter"

const BLOG_DIR = join(process.cwd(), "content", "blog")

type Frontmatter = {
  title: string
  slug: string
  category: string
  excerpt: string
  author?: string
  published?: boolean
  publishedAt?: string
}

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  const dbName = url.replace(/^libsql:\/\//, "").split(".")[0]
  console.log(`→ Syncing blog posts into: ${dbName}\n`)

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

  // Idempotent provisioning — migrations are not version-controlled in this
  // project, so the sync owns its own table. Safe to run on any DB.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      slug            text NOT NULL UNIQUE,
      title           text NOT NULL,
      excerpt         text NOT NULL,
      body            text NOT NULL,
      body_html       text NOT NULL,
      category        text NOT NULL,
      author          text NOT NULL DEFAULT 'Claude',
      reading_minutes integer NOT NULL DEFAULT 1,
      published       integer NOT NULL DEFAULT 0,
      published_at    text,
      created_at      integer NOT NULL,
      updated_at      integer NOT NULL
    )
  `)

  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith(".md"))
  if (files.length === 0) {
    console.log("No markdown files found in content/blog/")
    client.close()
    return
  }

  const now = Math.floor(Date.now() / 1000) // drizzle "timestamp" mode = epoch seconds

  let created = 0, updated = 0
  for (const file of files) {
    const raw = readFileSync(join(BLOG_DIR, file), "utf8")
    const { data, content } = matter(raw)
    const fm = data as Frontmatter

    for (const field of ["title", "slug", "category", "excerpt"] as const) {
      if (!fm[field]) throw new Error(`${file}: missing required frontmatter "${field}"`)
    }

    const html = await marked.parse(content, { gfm: true, breaks: false })
    const author = fm.author ?? "Claude"
    const published = fm.published ? 1 : 0
    const publishedAt = fm.publishedAt ?? null
    const minutes = readingMinutes(content)

    const existing = await client.execute({
      sql: "SELECT id FROM blog_posts WHERE slug = ?",
      args: [fm.slug],
    })

    if (existing.rows.length > 0) {
      await client.execute({
        sql: `UPDATE blog_posts SET
                title = ?, excerpt = ?, body = ?, body_html = ?, category = ?,
                author = ?, reading_minutes = ?, published = ?, published_at = ?, updated_at = ?
              WHERE slug = ?`,
        args: [fm.title, fm.excerpt, content, html, fm.category, author, minutes, published, publishedAt, now, fm.slug],
      })
      updated++
      console.log(`  ✓ updated  ${fm.slug}`)
    } else {
      await client.execute({
        sql: `INSERT INTO blog_posts
                (slug, title, excerpt, body, body_html, category, author, reading_minutes, published, published_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [fm.slug, fm.title, fm.excerpt, content, html, fm.category, author, minutes, published, publishedAt, now, now],
      })
      created++
      console.log(`  + created  ${fm.slug}`)
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated, ${files.length} total.`)
  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
