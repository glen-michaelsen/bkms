"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AddItemForm({ type }: { type: "words" | "sentences" }) {
  const router = useRouter()
  const [english, setEnglish] = useState("")
  const [serbian, setSe] = useState("")
  const [croatian, setHr] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, english, serbian, croatian }),
    })

    if (res.ok) {
      setStatus("success")
      setEnglish("")
      setSe("")
      setHr("")
      router.refresh()
      setTimeout(() => setStatus("idle"), 2000)
    } else {
      const data = await res.json()
      setErrorMsg(data.error || "Something went wrong")
      setStatus("error")
    }
  }

  const label = type === "words" ? "Word" : "Sentence"
  const placeholder = type === "words" ? "e.g. hello" : "e.g. How are you?"

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Add {label}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">English</label>
          <input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            required
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Serbian (Srpski)</label>
          <input
            value={serbian}
            onChange={(e) => setSe(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Croatian (Hrvatski)</label>
          <input
            value={croatian}
            onChange={(e) => setHr(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
        {status === "success" && (
          <p className="text-xs text-green-600">{label} added successfully!</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "Adding…" : `Add ${label}`}
        </button>
      </form>
    </div>
  )
}
