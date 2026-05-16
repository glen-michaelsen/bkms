import MarketingNav from "@/components/MarketingNav"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="max-w-5xl mx-auto px-5 py-16">{children}</main>
      <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-sm text-slate-400">
        Čujemo se · cujemose.com
      </footer>
    </>
  )
}
