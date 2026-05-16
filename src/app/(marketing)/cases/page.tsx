import type { Metadata } from "next"
import Link from "next/link"
import { CASES } from "@/lib/cases"

export const metadata: Metadata = {
  title: "Serbian & Croatian Grammatical Cases | Čujemo se",
  description:
    "A complete guide to the 7 grammatical cases of Serbian and Croatian — with endings tables, example sentences, and key questions.",
}

export default function CasesPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          The 7 Cases of Serbian &amp; Croatian
        </h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Unlike English, Serbian and Croatian are inflected languages — nouns, pronouns, and
          adjectives change their ending depending on the grammatical role they play in a sentence.
          These different forms are called <strong className="text-slate-700">cases</strong>. There
          are 7 in Serbian and Croatian, and mastering them is the single biggest step towards
          speaking naturally. Each case answers a specific question, which makes them easier to
          remember than they first appear.
        </p>
      </div>

      {/* Overview table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Overview</h2>
          <p className="text-sm text-slate-500 mb-4">All 7 cases at a glance.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 font-semibold text-slate-500">#</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-500">Serbian / Croatian</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-500">English name</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-500 hidden sm:table-cell">
                  Key question
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-500 hidden md:table-cell">
                  Main use
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CASES.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-slate-400 font-medium">{c.number}</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">
                    {c.srName === c.hrName ? c.srName : `${c.srName} / ${c.hrName}`}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{c.englishName}</td>
                  <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                    {c.questions
                      .map((q) => q.english)
                      .join(" / ")}
                  </td>
                  <td className="px-6 py-3 text-slate-500 hidden md:table-cell max-w-xs">
                    {c.usedFor[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-case cards */}
      <div className="space-y-8">
        {CASES.map((c) => (
          <div
            key={c.id}
            id={c.id}
            className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden"
          >
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
                      {q.sr}{q.hr && q.hr !== q.sr ? ` / ${q.hr}` : ""}
                    </span>
                    <span className="text-slate-400">— {q.english}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: uses + prepositions */}
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
        ))}
      </div>

      {/* CTA banner */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-12 text-center shadow-md">
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Practise cases in the app
        </h2>
        <p className="text-violet-200 text-sm mb-6">
          Our interactive cases trainer quizzes you on real sentences — so you learn by doing, not
          just reading.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
        >
          Start for free →
        </Link>
      </div>
    </div>
  )
}
