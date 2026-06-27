import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, Languages } from "lucide-react"
import MarketingNav from "@/components/MarketingNav"
import { db } from "@/db"
import { blogPosts } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

async function getPost(slug: string) {
  return db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .get()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Not found | Čujemo se" }
  return {
    title: `${post.title} | Čujemo se`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  Grammar:  "bg-violet-100 text-violet-700",
  Alphabet: "bg-emerald-100 text-emerald-700",
  Numbers:  "bg-sky-100 text-sky-700",
  Culture:  "bg-amber-100 text-amber-700",
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const catColor = CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketingNav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-12">
        <Link href="/blog" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
          ← All articles
        </Link>

        <article className="mt-6">
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              width={1000}
              height={500}
              className="w-full aspect-[2/1] object-cover rounded-3xl border border-slate-100 mb-7"
            />
          )}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${catColor}`}>
              {post.category}
            </span>
            <span className="text-xs text-slate-400">{post.readingMinutes} min read</span>
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>
          <p className="text-slate-400 text-sm mt-3">By {post.author}</p>

          <div
            className="mt-8
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-7 [&_h3]:mb-2
              [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:my-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1.5
              [&_li]:text-slate-700 [&_li]:leading-relaxed
              [&_strong]:font-semibold [&_strong]:text-slate-900
              [&_em]:italic
              [&_a]:text-violet-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-violet-800
              [&_blockquote]:border-l-4 [&_blockquote]:border-violet-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-5
              [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:text-[0.9em] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md
              [&_hr]:my-8 [&_hr]:border-slate-200"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />
        </article>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-3xl overflow-hidden">
          {/* Instagram */}
          <a
            href="https://instagram.com/cujemoseapp"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-7 bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white min-h-[250px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold leading-snug">Follow on Instagram</h3>
              <ul className="mt-4 space-y-2">
                {[
                  "Learn useful sentences",
                  "Get quick tips",
                  "Explore Balkan culture",
                ].map(point => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/95">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 self-start px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-full group-hover:scale-[1.03] transition-transform">
              @cujemoseapp →
            </span>
          </a>

          {/* Sign up */}
          <Link
            href="/register"
            className="group relative overflow-hidden flex flex-col justify-between p-7 bg-violet-600 text-white min-h-[250px]"
          >
            {/* purple fade — same as the homepage hero */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />

            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold leading-snug">Start learning free</h3>
              <ul className="mt-4 space-y-2">
                {[
                  "100% free to use",
                  "Learn Serbian or Croatian",
                  "Daily games to help you learn",
                ].map(point => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/95">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="relative mt-5 inline-flex items-center justify-center self-start px-5 py-2 bg-white text-violet-700 text-sm font-bold rounded-full group-hover:scale-[1.03] transition-transform">
              Create account
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}
