import type { Metadata } from "next"
import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import { db } from "@/db"
import { blogPosts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog | Čujemo se",
  description:
    "Plain-English guides to learning Serbian and Croatian — the alphabet, grammatical cases, the number system, and more.",
}

const CATEGORY_COLORS: Record<string, string> = {
  Grammar:  "bg-violet-100 text-violet-700",
  Alphabet: "bg-emerald-100 text-emerald-700",
  Numbers:  "bg-sky-100 text-sky-700",
  Culture:  "bg-amber-100 text-amber-700",
}

function catColor(c: string) {
  return CATEGORY_COLORS[c] ?? "bg-slate-100 text-slate-600"
}

export default async function BlogIndexPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt))
    .all()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketingNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Blog</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Plain-English guides to learning Serbian &amp; Croatian.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-slate-400">No articles yet — check back soon.</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-violet-100 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${catColor(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400">{post.readingMinutes} min read</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-500 mt-1.5 leading-relaxed">{post.excerpt}</p>
                <p className="text-xs text-slate-400 mt-3">By {post.author}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
