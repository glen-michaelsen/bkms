"use client"

import { useActionState } from "react"
import { loginAction } from "@/app/actions"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-violet-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />
        <div className="relative z-10">
          <img src="/logo.svg" alt="Čujemo se" className="h-7 brightness-0 invert" />
        </div>
        <div className="relative z-10">
          <blockquote className="text-white/90 text-2xl font-medium leading-relaxed">
            "The limits of my language are the limits of my world."
          </blockquote>
          <p className="text-white/50 text-sm mt-4">— Ludwig Wittgenstein</p>
        </div>
        <div className="relative z-10 flex gap-3">
          {["Dobar dan", "Hvala", "Dobrodošli"].map((w) => (
            <span
              key={w}
              className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.svg" alt="Čujemo se" className="h-8 mx-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1.5">Sign in to keep learning</p>
          </div>

          {registered && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
              Account created! Sign in to get started.
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-rose-600 font-medium">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {pending ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
