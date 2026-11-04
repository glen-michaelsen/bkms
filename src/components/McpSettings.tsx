"use client"

import { useState, useTransition } from "react"
import { Check, Copy } from "lucide-react"
import { revokeMcpClientAction } from "@/app/actions"

export type ConnectedApp = { clientId: string; name: string; connectedAt: string }

export function McpSettings({ mcpUrl, apps }: { mcpUrl: string; apps: ConnectedApp[] }) {
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  async function copy() {
    await navigator.clipboard.writeText(mcpUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Add this URL as a custom connector in your AI assistant and approve access. It can then base stories and
          exercises on the words and sentences you&apos;re learning.
        </p>
        <div className="flex gap-2 mt-3">
          <code className="flex-1 min-w-0 truncate px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-700">
            {mcpUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 px-4 text-sm font-semibold text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Connected apps</p>
        {apps.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing connected yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {apps.map(app => (
              <li key={app.clientId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{app.name}</p>
                  <p className="text-xs text-slate-500">Connected {app.connectedAt}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => revokeMcpClientAction(app.clientId))}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 transition"
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
