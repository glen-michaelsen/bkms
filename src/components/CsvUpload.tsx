"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

type Row = {
  english: string
  serbian: string
  croatian: string
  category?: string
  level?: string
}

// RFC 4180-compliant CSV parser (handles quoted fields with commas/newlines)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cell += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(cell); cell = ""
    } else {
      cell += ch
    }
  }
  result.push(cell)
  return result
}

function parseCSV(text: string): { rows: Row[]; errors: string[] } {
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")
  if (rawLines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] }

  const headers = parseCSVLine(rawLines[0]).map((h) => h.trim().toLowerCase())
  const required = ["english", "serbian", "croatian"]
  const missing = required.filter((r) => !headers.includes(r))
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing required columns: ${missing.join(", ")}`] }
  }

  const rows: Row[] = []
  const errors: string[] = []

  rawLines.slice(1).forEach((line, idx) => {
    if (!line.trim()) return
    const values = parseCSVLine(line)
    const get = (key: string) => (values[headers.indexOf(key)] ?? "").trim()

    const english = get("english")
    const serbian = get("serbian")
    const croatian = get("croatian")

    if (!english || !serbian || !croatian) {
      errors.push(`Row ${idx + 2}: missing required field(s)`)
      return
    }

    rows.push({
      english,
      serbian,
      croatian,
      category: get("category") || undefined,
      level: get("level") || undefined,
    })
  })

  return { rows, errors }
}

function downloadTemplate(type: "words" | "sentences") {
  const headers =
    type === "words"
      ? "english,serbian,croatian,category"
      : "english,serbian,croatian,category,level"
  const sample =
    type === "words"
      ? "hello,zdravo,zdravo,Greetings"
      : "How are you?,Kako si?,Kako si?,Greetings,Beginner"
  const blob = new Blob([`${headers}\n${sample}\n`], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `template_${type}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function CsvUpload({ type }: { type: "words" | "sentences" }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<{ rows: Row[]; errors: string[] } | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  function reset() {
    setParsed(null)
    setStatus("idle")
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setStatus("idle")
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setParsed(parseCSV(text))
    }
    reader.readAsText(file, "UTF-8")
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return
    setStatus("loading")

    const res = await fetch("/api/admin/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, rows: parsed.rows }),
    })

    const data = await res.json()
    setStatus("done")
    setResult(data)
    if (res.ok && data.imported > 0) router.refresh()
  }

  const label = type === "words" ? "Words" : "Sentences"
  const accent = type === "words" ? "violet" : "fuchsia"

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{type === "words" ? "📋" : "📄"}</span>
        <h3 className="font-bold text-slate-900">Import {label} CSV</h3>
        <button
          type="button"
          onClick={() => downloadTemplate(type)}
          className="ml-auto text-xs font-semibold text-violet-600 hover:underline"
        >
          ↓ Template
        </button>
      </div>

      {/* Expected columns hint */}
      <p className="text-xs text-slate-400">
        Columns:{" "}
        <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">english</code>
        {", "}
        <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">serbian</code>
        {", "}
        <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">croatian</code>
        {", "}
        <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">category</code>
        {type === "sentences" && (
          <>
            {", "}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">level</code>
          </>
        )}
        {" "}— last two optional, auto-created if new.
      </p>

      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition-all group">
        <span className="text-sm font-medium text-slate-400 group-hover:text-violet-600 transition-colors">
          {parsed ? "Choose a different file" : "Click to select .csv file"}
        </span>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </label>

      {/* Parse errors */}
      {parsed && parsed.errors.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-0.5">
          <p className="text-xs font-semibold text-amber-700">{parsed.errors.length} row(s) skipped:</p>
          {parsed.errors.slice(0, 4).map((e, i) => (
            <p key={i} className="text-xs text-amber-600">{e}</p>
          ))}
          {parsed.errors.length > 4 && (
            <p className="text-xs text-amber-500">…and {parsed.errors.length - 4} more</p>
          )}
        </div>
      )}

      {/* Preview table */}
      {parsed && parsed.rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">English</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Serbian</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Croatian</th>
                  {type === "sentences" && (
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Level</th>
                  )}
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parsed.rows.slice(0, 6).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-800 font-medium">{row.english}</td>
                    <td className="px-3 py-2 text-slate-500">{row.serbian}</td>
                    <td className="px-3 py-2 text-slate-500">{row.croatian}</td>
                    {type === "sentences" && (
                      <td className="px-3 py-2">
                        {row.level
                          ? <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full font-medium">{row.level}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      {row.category
                        ? <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full font-medium">{row.category}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 6 && (
              <p className="text-xs text-slate-400 text-center py-2 border-t border-slate-50">
                …and {parsed.rows.length - 6} more rows
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{parsed.rows.length}</span> rows ready
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={status === "loading" || status === "done"}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
                  accent === "violet"
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                }`}
              >
                {status === "loading" ? "Importing…" : `Import ${parsed.rows.length} rows`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-2xl ${
            result.errors.length === 0
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-amber-50 border border-amber-100"
          }`}
        >
          {result.imported > 0 && (
            <p className="text-sm font-semibold text-emerald-700">✓ {result.imported} rows imported</p>
          )}
          {result.errors.slice(0, 4).map((e, i) => (
            <p key={i} className="text-xs text-amber-600 mt-0.5">{e}</p>
          ))}
          {result.errors.length > 4 && (
            <p className="text-xs text-amber-500">…and {result.errors.length - 4} more errors</p>
          )}
        </div>
      )}
    </div>
  )
}
