"use client"

import { useActionState, useState } from "react"
import { registerAction } from "@/app/actions"
import Link from "next/link"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  // "en" means learning English; "sr"/"hr" means learning that Slavic language
  const [learnTarget, setLearnTarget] = useState<"" | "en" | "sr" | "hr">("")
  // Reference language — only relevant when learnTarget === "en"
  const [refLanguage, setRefLanguage] = useState<"sr" | "hr">("sr")

  // Derived values submitted to the server
  const language: "sr" | "hr" = learnTarget === "en" ? refLanguage : (learnTarget as "sr" | "hr") || "sr"
  const studyDirection = learnTarget === "en" ? "to_english" : "to_slavic"

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-violet-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#ec4899_0%,_transparent_60%)] opacity-30" />
        <div className="relative z-10">
          <img src="/logo.svg" alt="Čujemo se" className="h-7 brightness-0 invert" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <span className="text-2xl">🇬🇧</span>
            <span className="font-medium">English</span>
          </div>
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
            <img src="/logo.svg" alt="Čujemo se" className="h-8 mx-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Create account</h1>
            <p className="text-slate-500 mt-1.5">Start learning in minutes</p>
          </div>

          <form action={action} className="space-y-4">
            {/* Hidden fields derived from the interactive picker */}
            <input type="hidden" name="language" value={language} />
            <input type="hidden" name="studyDirection" value={studyDirection} />

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

            {/* Step 1: What are you learning? */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                I want to learn
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "en", flag: "🇬🇧", label: "English" },
                  { value: "sr", flag: "🇷🇸", label: "Serbian" },
                  { value: "hr", flag: "🇭🇷", label: "Croatian" },
                ].map(({ value, flag, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLearnTarget(value as "en" | "sr" | "hr")}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      learnTarget === value
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  >
                    <span className="text-xl">{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Reference language (only when learning English) */}
            {learnTarget === "en" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  My reference language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "sr", flag: "🇷🇸", label: "Serbian" },
                    { value: "hr", flag: "🇭🇷", label: "Croatian" },
                  ].map(({ value, flag, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRefLanguage(value as "sr" | "hr")}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        refLanguage === value
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                      }`}
                    >
                      <span className="text-xl">{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Exercises will show Serbian or Croatian as the question, and you type the English answer.
                </p>
              </div>
            )}

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
                <option value="" disabled>Select…</option>
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
              disabled={pending || !learnTarget}
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
