import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import { sentences } from "@/db/schema"
import { asc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Serbian & Croatian Sentences | Čujemo se",
  description:
    "Browse Serbian and Croatian sentences and phrases. Learn real expressions to build fluency beyond single words.",
}

export default async function SentencesPage() {
  const session = await auth()

  const allSentences = await db
    .select()
    .from(sentences)
    .orderBy(asc(sentences.id))
    .limit(40)

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Serbian &amp; Croatian Sentences
        </h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Words are the building blocks, but sentences are where language comes alive. Practising
          full phrases helps you understand how Serbian and Croatian grammar works in context — from
          word order to case endings. The examples below are drawn from everyday situations to give
          you a feel for the language.
        </p>
      </div>

      {/* Sentence list */}
      <div className="space-y-3">
        {allSentences.map((sentence) => (
          <div
            key={sentence.id}
            className="bg-white border border-slate-100 rounded-3xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              English
            </p>
            <p className="text-slate-700 text-sm leading-relaxed mb-3">{sentence.english}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Serbian &amp; Croatian
            </p>
            <p className="text-violet-700 font-semibold text-base leading-relaxed">
              {sentence.serbian}
            </p>
          </div>
        ))}
      </div>

      {allSentences.length === 0 && (
        <p className="text-center text-slate-400 py-12">No sentences to show yet.</p>
      )}

      {/* CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-12 text-center shadow-md">
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Practise these sentences in the app
        </h2>
        <p className="text-violet-200 text-sm mb-6">
          Translate from English to Serbian or Croatian, get instant feedback, and track your
          progress over time.
        </p>
        <Link
          href={session ? "/dashboard" : "/register"}
          className="inline-flex items-center px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
        >
          {session ? "Go to dashboard →" : "Start practising free →"}
        </Link>
      </div>
    </div>
  )
}
