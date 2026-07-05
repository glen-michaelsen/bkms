"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordResetAction } from "@/app/actions"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Čujemo se" className="h-8 mx-auto mb-8" />
          <h1 className="text-3xl font-extrabold text-slate-900">Forgot password?</h1>
          <p className="text-slate-500 mt-1.5">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {state?.done ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-center">
            If an account exists for that email, a password reset link is on its way. Check your inbox (and spam).
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            {state?.error && <p className="text-sm text-rose-600 font-medium">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-7">
          <Link href="/login" className="text-violet-600 font-semibold hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
