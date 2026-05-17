import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import MarketingNav from "@/components/MarketingNav"
import { CASES } from "@/lib/cases"

const INTROS: Record<string, string> = {
  nominative:
    "The starting point of every noun. The nominative is the base form — how words appear in dictionaries — and it marks the subject of the sentence: the person or thing performing the action.",
  genitive:
    "The case of belonging and origin. Use it to express ownership, absence, or where something comes from. It's also required after a large number of common prepositions, making it one of the most frequently used cases.",
  dative:
    "The giving and receiving case. Use the dative to show who receives something, who benefits from an action, or who something is directed towards. Think of it as answering 'to whom?' or 'for whom?'.",
  accusative:
    "The most common case after the nominative. The accusative marks the direct object — the person or thing directly affected by the verb. It's also used after many prepositions that describe movement towards something.",
  vocative:
    "The addressing case. Used only when calling out to someone directly — their name, a title, or a greeting. It doesn't function as part of the sentence structure; it simply identifies the person you're speaking to.",
  instrumental:
    "The case of means and company. Use it to describe the tool or means by which you do something, the person you're doing it with, or how you travel. Almost always translated with 'with' or 'by'.",
  locative:
    "The location case — always paired with a preposition. Use it to describe where something is or what a conversation, thought, or story is about. Unlike all other cases, the locative never appears without a preposition.",
}

export function generateStaticParams() {
  return CASES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const c = CASES.find((c) => c.id === id)
  if (!c) return {}
  return {
    title: `Learn ${c.englishName} in Serbian & Croatian | Čujemo se`,
  }
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const c = CASES.find((c) => c.id === id)

  if (!c) notFound()

  const intro = INTROS[c.id] ?? ""

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky light nav */}
      <MarketingNav />

      <main className="max-w-5xl mx-auto px-5 py-16">
        {/* Back link */}
        <Link
          href="/cases"
          className="mb-8 inline-flex text-sm text-slate-500 hover:text-violet-600 transition-colors"
        >
          ← All cases
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 mb-4">
            Case {c.number} of 7
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Learn {c.englishName} in Serbian &amp; Croatian
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            {c.srName === c.hrName
              ? c.srName
              : `Serbian: ${c.srName} · Croatian: ${c.hrName}`}
          </p>
          {intro && (
            <p className="mt-5 text-slate-600 leading-relaxed max-w-2xl">{intro}</p>
          )}
        </div>

        {/* Case card */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden mb-12">
          {/* Card header */}
          <div className="px-7 pt-7 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                Case {c.number}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {c.srName === c.hrName
                  ? c.srName
                  : `Sr: ${c.srName} · Hr: ${c.hrName}`}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">{c.englishName}</h3>

            {/* Key questions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {c.questions.map((q, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full"
                >
                  <span className="text-violet-600 font-bold">
                    {q.sr}
                    {q.hr && q.hr !== q.sr ? ` / ${q.hr}` : ""}
                  </span>
                  <span className="text-slate-400">— {q.english}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Card body */}
          <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: uses + prepositions + examples */}
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Used for
                </h4>
                <ul className="space-y-1.5">
                  {c.usedFor.map((use, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">›</span>
                      {use}
                    </li>
                  ))}
                </ul>
              </div>

              {c.prepositions && c.prepositions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Common prepositions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {c.prepositions.map(({ prep, meaning }) => (
                      <span
                        key={prep}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-800 text-xs font-semibold rounded-xl"
                        title={meaning}
                      >
                        <span className="font-bold">{prep}</span>
                        <span className="text-violet-400 font-normal">— {meaning}</span>
                      </span>
                    ))}
                  </div>
                  {c.prepositionNote && (
                    <p className="text-xs text-slate-400 mt-2 italic">{c.prepositionNote}</p>
                  )}
                </div>
              )}

              {/* Example sentences */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Examples
                </h4>
                <div className="space-y-2">
                  {c.examples.slice(0, 3).map((ex, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl px-4 py-3">
                      <p className="font-semibold text-violet-700 text-sm">{ex.sr}</p>
                      {ex.hr && ex.hr !== ex.sr && (
                        <p className="text-slate-500 text-xs mt-0.5">Hr: {ex.hr}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">{ex.english}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: endings table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Noun endings
              </h4>
              <div className="bg-slate-50 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs">
                        Gender
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs">
                        Singular
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs">
                        Plural
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {c.endings.map((ending, i) => (
                      <tr key={i} className="bg-white odd:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{ending.gender}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-violet-700 text-xs">
                          {ending.singular}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-violet-700 text-xs">
                          {ending.plural}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {c.endingNote && (
                <p className="text-xs text-slate-400 mt-2 italic">{c.endingNote}</p>
              )}
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-12 text-center shadow-md">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Practise {c.englishName} in the app
          </h2>
          <p className="text-violet-200 text-sm mb-6">
            Our cases trainer quizzes you on real sentences.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
          >
            Start for free →
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
        Čujemo se · cujemose.com
      </footer>
    </div>
  )
}
