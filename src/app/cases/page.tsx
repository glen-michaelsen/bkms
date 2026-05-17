import type { Metadata } from "next"
import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import { CASES } from "@/lib/cases"

export const metadata: Metadata = {
  title: "The 7 Cases of Serbian & Croatian | Čujemo se",
  description:
    "A complete guide to the 7 grammatical cases of Serbian and Croatian — with endings tables, example sentences, and key questions.",
}

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero (gradient panel) ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-violet-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />

        <div className="relative z-10">
          <MarketingNav variant="dark" />
        </div>

        <section className="relative z-10 max-w-5xl mx-auto px-5 pt-16 pb-28 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white mb-6">
            Grammar guide
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            The 7 Cases of Serbian &amp; Croatian
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed">
            Unlike English, Serbian and Croatian change noun endings based on their role in the
            sentence. These forms are called cases — and mastering them is the biggest step towards
            speaking naturally.
          </p>
        </section>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-5 py-16">
        {/* Overview table card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-bold text-slate-900 mb-1">All 7 cases at a glance</h2>
            <p className="text-sm text-slate-500 mb-4">Click any case to learn more.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 font-semibold text-slate-500">#</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500">
                    Serbian / Croatian
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500">English name</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 hidden sm:table-cell">
                    Key question
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 hidden md:table-cell">
                    Main use
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {CASES.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 text-slate-400 font-medium">{c.number}</td>
                    <td className="px-6 py-3 font-semibold text-slate-800">
                      {c.srName === c.hrName ? c.srName : `${c.srName} / ${c.hrName}`}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{c.englishName}</td>
                    <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                      {c.questions.map((q) => q.english).join(" / ")}
                    </td>
                    <td className="px-6 py-3 text-slate-500 hidden md:table-cell max-w-xs">
                      {c.usedFor[0]}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-violet-600 font-semibold text-sm hover:text-violet-700 transition-colors whitespace-nowrap"
                      >
                        Learn →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
        Čujemo se · cujemose.com
      </footer>
    </div>
  )
}
