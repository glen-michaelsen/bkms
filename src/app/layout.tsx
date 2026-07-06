import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AnalyticsGate } from "@/components/AnalyticsGate"

// GA4 measurement IDs are public (they appear in page source), so we hardcode
// both and switch on the deploy branch: the production build (main) uses the
// prod property, everything else — the dev branch and local — uses dev.
const GA_MEASUREMENT_ID =
  process.env.VERCEL_GIT_COMMIT_REF === "main" ? "G-FJN4S1628N" : "G-LZ8M6K5KQX"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Čujemo se — Serbian & Croatian",
  description: "Learn Serbian and Croatian with daily practice",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Čujemo se",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Pre-login analytics only: AnalyticsGate checks the session client-side and
  // loads GA solely for signed-out visitors. Keeping auth() out of this layout
  // lets public pages render statically instead of per-request SSR.
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#7c3aed" />
      </head>
      <body className="min-h-full bg-white font-[family-name:var(--font-jakarta)] antialiased">
        <Providers>
          <AnalyticsGate gaId={GA_MEASUREMENT_ID} />
          {children}
        </Providers>
      </body>
    </html>
  )
}
