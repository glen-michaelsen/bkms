"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

// Client-side session-aware CTAs. Public marketing pages render statically
// (cached — no per-request SSR); these small islands resolve the session in the
// browser and swap the CTA. While the session is loading we show the logged-out
// variant — safe, because middleware redirects logged-in users from /register
// and /login to /dashboard anyway.

/** Landing hero button pair. */
export function HeroCtas() {
  const authed = useSession().status === "authenticated"
  return authed ? (
    <>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-lg"
      >
        Go to dashboard →
      </Link>
      <Link
        href="/words"
        className="px-6 py-3 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
      >
        Explore words
      </Link>
    </>
  ) : (
    <>
      <Link
        href="/register"
        className="px-6 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-lg"
      >
        Start learning free →
      </Link>
      <Link
        href="/login"
        className="px-6 py-3 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
      >
        Log in
      </Link>
    </>
  )
}

/** Banner CTA used on words / sentences / category pages. */
export function PracticeCta() {
  const authed = useSession().status === "authenticated"
  return (
    <Link
      href={authed ? "/dashboard" : "/register"}
      className="inline-flex items-center px-7 py-3.5 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition-colors shadow-sm"
    >
      {authed ? "Go to dashboard →" : "Start learning free →"}
    </Link>
  )
}
