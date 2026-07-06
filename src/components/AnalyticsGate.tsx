"use client"

import { useSession } from "next-auth/react"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"

// Pre-login analytics only: GA loads solely when the client session check
// confirms the visitor is NOT signed in. Runs client-side so the root layout
// (and public pages) can render statically instead of per-request SSR.
export function AnalyticsGate({ gaId }: { gaId: string }) {
  const { status } = useSession()
  if (status !== "unauthenticated") return null
  return <GoogleAnalytics gaId={gaId} />
}
