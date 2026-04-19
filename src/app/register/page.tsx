"use client"

import { useActionState } from "react"
import { registerAction } from "@/app/actions"
import Link from "next/link"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-violet-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />
        <div className="relative z-10">
          <span className="text-white font-bold text-xl tracking-tight">Nauči</span>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <span className="text-2xl">🇷🇸</span>
            <span className="font-medium">Serbian — Srpski</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <span className="text-2xl">🇭🇷</span>
            <span className="font-medium">Croatian — Hrvatski</span>
          </div>
          <p className="text-white/50 text-sm mt-4 leading-relaxed">
            10 words or sentences per session. Multiple-choice and free-form practice. Learn at your own pace.
          </p>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          Free to use — no credit card needed
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-violet-600 font-bold text-2xl">Nauči</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Create account</h1>
            <p className="text-slate-500 mt-1.5">Start learning in minutes</p>
          </div>

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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                I want to learn
              </label>
              <select
                name="language"
                required
                defaultValue=""
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Choose a language…
                </option>
                <option value="sr">🇷🇸 Serbian (Srpski)</option>
                <option value="hr">🇭🇷 Croatian (Hrvatski)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your gender
              </label>
              <select
                name="gender"
                required
                defaultValue=""
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p className="text-xs text-slate-400 mt-1.5">
                Used for grammatically correct example sentences
              </p>
            </div>

            {state?.error && (
              <p className="text-sm text-rose-600 font-medium">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {pending ? "Creating account…" : "Get started →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
