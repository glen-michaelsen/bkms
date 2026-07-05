"use client"

import { useActionState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { resetPasswordAction } from "@/app/actions"

function ResetForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)
  const token = useSearchParams().get("token") ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="Čujemo se" className="h-8 mx-auto mb-8" />
          <h1 className="text-3xl font-extrabold text-slate-900">Choose a new password</h1>
          <p className="text-slate-500 mt-1.5">Enter and confirm your new password.</p>
        </div>

        {!token ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm text-center">
            This reset link is invalid or incomplete. Please{" "}
            <Link href="/forgot-password" className="font-semibold underline">request a new one</Link>.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New password</label>
              <input
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm new password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            {state?.error && <p className="text-sm text-rose-600 font-medium">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {pending ? "Saving…" : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
