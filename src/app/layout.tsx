import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Čujemo se — Serbian & Croatian",
  description: "Learn Serbian and Croatian with daily practice",
  icons: {
    icon: "/favicon.svg",
    apple: "/app-icon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full bg-white font-[family-name:var(--font-jakarta)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
