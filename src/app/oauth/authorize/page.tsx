import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { auth } from "@/auth"
import { getClient, isValidResource, originFromHeaders } from "@/lib/oauth"
import { decideAuthorization } from "./actions"

export const metadata: Metadata = {
  title: "Connect an AI assistant | Čujemo se",
  robots: { index: false },
}

type Params = Record<string, string | string[] | undefined>

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <img src="/logo.svg" alt="Čujemo se" className="h-8 mx-auto mb-8" />
        {children}
      </div>
    </div>
  )
}

function InvalidRequest() {
  return (
    <Shell>
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm text-center">
        This connection request isn&apos;t valid. Start again from your AI assistant.
        <Link href="/dashboard" className="block mt-3 font-semibold underline">Back to dashboard</Link>
      </div>
    </Shell>
  )
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const one = (name: string) => {
    const value = params[name]
    return typeof value === "string" ? value : ""
  }
  const clientId = one("client_id")
  const redirectUri = one("redirect_uri")
  const codeChallenge = one("code_challenge")
  const resource = one("resource")
  const state = one("state")

  const session = await auth()
  if (!session) {
    const query = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string"),
    )
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`)
  }

  // A bad client or redirect URI must never redirect anywhere: show an error instead.
  const client = clientId ? await getClient(clientId) : null
  if (!client || !client.redirectUris.includes(redirectUri)) return <InvalidRequest />
  if (
    one("response_type") !== "code" ||
    one("code_challenge_method") !== "S256" ||
    !/^[A-Za-z0-9\-_]{43,128}$/.test(codeChallenge) ||
    !isValidResource(resource, originFromHeaders(await headers()))
  ) {
    return <InvalidRequest />
  }

  const shared = [
    "The words and sentences you practise, and their status",
    "How many correct and wrong answers you've given, and when you last practised",
    "Your target language and gender, to use the right word forms",
  ]
  const notShared = ["Your email, password and personal details", "Changing anything in your account or progress"]

  return (
    <Shell>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Connect {client.name}?</h1>
        <p className="text-sm text-slate-500 mt-2">
          It will get access as {session.user.email}. After you approve, you&apos;ll be sent to{" "}
          <span className="font-semibold text-slate-700">{new URL(redirectUri).host}</span>. Only continue if you
          started this from your AI assistant.
        </p>

        <h2 className="text-sm font-semibold text-slate-700 mt-6 mb-2">It can read</h2>
        <ul className="space-y-2">
          {shared.map(item => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />{item}
            </li>
          ))}
        </ul>

        <h2 className="text-sm font-semibold text-slate-700 mt-5 mb-2">It can&apos;t access</h2>
        <ul className="space-y-2">
          {notShared.map(item => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <X className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />{item}
            </li>
          ))}
        </ul>

        <form action={decideAuthorization} className="mt-7 flex gap-3">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="state" value={state} />
          <button
            name="decision" value="deny"
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            name="decision" value="approve"
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
          >
            Allow access
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">You can disconnect any time in Settings.</p>
      </div>
    </Shell>
  )
}
