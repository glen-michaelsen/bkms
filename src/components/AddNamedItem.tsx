"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type Action = (
  prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) => Promise<{ error?: string; success?: boolean }>

export function AddNamedItem({
  label,
  placeholder,
  action,
  accent = "violet",
}: {
  label: string
  placeholder?: string
  action: Action
  accent?: "violet" | "sky"
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <input
        name="name"
        required
        placeholder={placeholder ?? `New ${label.toLowerCase()}…`}
        className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
      />
      <button
        type="submit"
        disabled={pending}
        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap ${
          accent === "sky"
            ? "bg-sky-600 text-white hover:bg-sky-700"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {pending ? "Adding…" : `Add ${label}`}
      </button>
      {state?.error && (
        <p className="text-xs text-rose-600 font-medium self-center">{state.error}</p>
      )}
    </form>
  )
}
