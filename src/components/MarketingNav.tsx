import Link from "next/link"
import { auth } from "@/auth"

export default async function MarketingNav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const session = await auth()

  const isDark = variant === "dark"

  return (
    <header className={isDark ? "border-b border-white/10" : "sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100"}>
      <nav className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        {/* Left: logo */}
        <Link href="/" className="flex-shrink-0">
          {/* brightness-0 invert = white logo; default = dark logo */}
          <img
            src="/logo.svg"
            alt="Čujemo se"
            className={`h-6 ${isDark ? "brightness-0 invert" : ""}`}
          />
        </Link>

        {/* Centre: nav links */}
        <div className="hidden sm:flex items-center gap-6">
          {[
            { href: "/words", label: "Words" },
            { href: "/sentences", label: "Sentences" },
            { href: "/cases", label: "Cases" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: auth actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {session ? (
            <Link
              href="/dashboard"
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                isDark
                  ? "bg-white text-violet-700 hover:bg-violet-50 shadow-md"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              My account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium transition-colors ${
                  isDark
                    ? "text-white/80 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  isDark
                    ? "bg-white text-violet-700 hover:bg-violet-50 shadow-md"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
