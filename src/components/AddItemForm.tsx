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
      setTimeout(() => setStatus("idle"), 2500)
    } else {
      const data = await res.json()
      setErrorMsg(data.error || "Something went wrong")
      setStatus("error")
    }
  }

  const label = type === "words" ? "Word" : "Sentence"
  const accent = type === "words" ? "violet" : "fuchsia"
  const placeholder = type === "words" ? "e.g. hello" : "e.g. How are you?"

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xl">{type === "words" ? "📖" : "💬"}</span>
        <h3 className="font-bold text-slate-900">Add {label}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { label: "English", value: english, set: setEnglish, placeholder },
          { label: "Serbian (Srpski)", value: serbian, set: setSe, placeholder: "" },
          { label: "Croatian (Hrvatski)", value: croatian, set: setHr, placeholder: "" },
        ].map(({ label: l, value, set, placeholder: ph }) => (
          <div key={l}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{l}</label>
            <input
              value={value}
              onChange={(e) => set(e.target.value)}
              required
              placeholder={ph}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>
        ))}

        {status === "error" && (
          <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
        )}
        {status === "success" && (
          <p className="text-xs text-emerald-600 font-semibold">{label} added ✓</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
            accent === "violet"
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
          }`}
        >
          {status === "loading" ? "Adding…" : `Add ${label}`}
        </button>
      </form>
    </div>
  )
}
