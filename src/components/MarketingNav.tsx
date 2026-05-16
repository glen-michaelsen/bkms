import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"

export default async function MarketingNav() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        {/* Left: logo */}
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo.svg" alt="Čujemo se" width={120} height={24} priority unoptimized />
        </Link>

        {/* Centre: nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/words"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Words
          </Link>
          <Link
            href="/sentences"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sentences
          </Link>
          <Link
            href="/cases"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cases
          </Link>
        </div>

        {/* Right: auth actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {session ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition-colors"
            >
              My account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition-colors"
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
