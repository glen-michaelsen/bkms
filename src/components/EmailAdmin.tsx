"use client"

import { useState, useEffect } from "react"
import { Plus, Send, Clock, Trash2, Edit2, CheckCircle2, Loader2, FlaskConical, ChevronDown, ChevronUp } from "lucide-react"
import { EmailBlockEditor } from "@/components/EmailBlockEditor"
import type { Block, CampaignFilters } from "@/lib/email-html"

// ── Types ─────────────────────────────────────────────────────────────────────

type WelcomeStep = {
  id: number; stepNumber: number; delayDays: number
  subject: string; body: string; active: boolean; createdAt: string
}

type Campaign = {
  id: number; name: string; subject: string; body: string
  status: string; scheduledAt: string | null; sentAt: string | null
  filters: string; createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-slate-100 text-slate-600",
  scheduled: "bg-amber-100 text-amber-700",
  sending:   "bg-blue-100 text-blue-700",
  sent:      "bg-green-100 text-green-700",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
      {status}
    </span>
  )
}

// ── Filter builder ────────────────────────────────────────────────────────────

function FilterBuilder({ filters, onChange }: { filters: CampaignFilters; onChange: (f: CampaignFilters) => void }) {
  const toggle = (key: "excludeActiveWelcomeFlow") =>
    onChange({ ...filters, [key]: !filters[key] })

  const setArr = (key: keyof CampaignFilters, val: string, checked: boolean) => {
    const arr = ((filters[key] as string[] | undefined) ?? [])
    onChange({ ...filters, [key]: checked ? [...arr, val] : arr.filter(v => v !== val) })
  }

  const setDate = (key: keyof CampaignFilters, val: string) =>
    onChange({ ...filters, [key]: val || undefined })

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audience filters</p>

      {/* Language */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1.5">Language</p>
        <div className="flex gap-3">
          {[["sr","Serbian"],["hr","Croatian"],["en","English"]].map(([val, label]) => (
            <label key={val} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox"
                checked={filters.languages?.includes(val) ?? false}
                onChange={e => setArr("languages", val, e.target.checked)}
                className="accent-violet-600"
              /> {label}
            </label>
          ))}
        </div>
      </div>

      {/* Study direction */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1.5">Study direction</p>
        <div className="flex gap-3">
          {[["to_slavic","Learning SR/HR"],["to_english","Learning EN"]].map(([val, label]) => (
            <label key={val} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox"
                checked={filters.studyDirections?.includes(val) ?? false}
                onChange={e => setArr("studyDirections", val, e.target.checked)}
                className="accent-violet-600"
              /> {label}
            </label>
          ))}
        </div>
      </div>

      {/* Last active */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Last active after</label>
          <input type="date" value={filters.lastActiveAfter ?? ""}
            onChange={e => setDate("lastActiveAfter", e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Last active before</label>
          <input type="date" value={filters.lastActiveBefore ?? ""}
            onChange={e => setDate("lastActiveBefore", e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Signed up after</label>
          <input type="date" value={filters.createdAfter ?? ""}
            onChange={e => setDate("createdAfter", e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Signed up before</label>
          <input type="date" value={filters.createdBefore ?? ""}
            onChange={e => setDate("createdBefore", e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400"
          />
        </div>
      </div>

      {/* Exclude welcome flow */}
      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={!!filters.excludeActiveWelcomeFlow}
          onChange={() => toggle("excludeActiveWelcomeFlow")}
          className="accent-violet-600"
        />
        Exclude users still in welcome flow
      </label>
    </div>
  )
}

// ── Campaign form ─────────────────────────────────────────────────────────────

function CampaignForm({
  initial, adminEmail, onSave, onCancel,
}: {
  initial?: Campaign
  adminEmail: string
  onSave: () => void
  onCancel: () => void
}) {
  const [name,        setName]        = useState(initial?.name ?? "")
  const [subject,     setSubject]     = useState(initial?.subject ?? "")
  const [blocks,      setBlocks]      = useState<Block[]>(() => {
    try { return JSON.parse(initial?.body ?? "[]") } catch { return [] }
  })
  const [filters,     setFilters]     = useState<CampaignFilters>(() => {
    try { return JSON.parse(initial?.filters ?? "{}") } catch { return {} }
  })
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt?.slice(0, 16) ?? "")
  const [saving,      setSaving]      = useState(false)
  const [testEmail,   setTestEmail]   = useState(adminEmail)
  const [testStatus,  setTestStatus]  = useState<"idle"|"sending"|"sent"|"error">("idle")
  const [showFilters, setShowFilters] = useState(false)

  async function save() {
    setSaving(true)
    const body = {
      name, subject,
      body: JSON.stringify(blocks),
      filters,
      scheduledAt: scheduledAt || null,
    }
    if (initial) {
      await fetch(`/api/admin/campaigns/${initial.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } else {
      await fetch("/api/admin/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    }
    setSaving(false)
    onSave()
  }

  async function sendTest() {
    if (!initial) return
    setTestStatus("sending")
    const res = await fetch(`/api/admin/campaigns/${initial.id}/test`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    })
    setTestStatus(res.ok ? "sent" : "error")
    setTimeout(() => setTestStatus("idle"), 3000)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 className="font-extrabold text-slate-900 text-lg">
        {initial ? "Edit campaign" : "New campaign"}
      </h3>

      <div className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Campaign name (internal)"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
        />
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Email subject line"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
        />
      </div>

      <EmailBlockEditor blocks={blocks} onChange={setBlocks} />

      {/* Filters toggle */}
      <button onClick={() => setShowFilters(v => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Audience filters
      </button>
      {showFilters && <FilterBuilder filters={filters} onChange={setFilters} />}

      {/* Schedule */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
          Schedule (optional — leave blank for draft)
        </label>
        <input type="datetime-local" value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
        />
      </div>

      {/* Test email — only available when editing an existing campaign */}
      {initial && (
        <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 space-y-2">
          <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">Send test email</p>
          <div className="flex gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 text-sm border border-violet-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-violet-500"
            />
            <button onClick={sendTest} disabled={testStatus === "sending"}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-60 transition">
              {testStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> :
               testStatus === "sent"    ? <CheckCircle2 className="w-4 h-4" /> :
                                          <FlaskConical className="w-4 h-4" />}
              {testStatus === "sent" ? "Sent!" : testStatus === "error" ? "Failed" : "Send test"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition">
          Cancel
        </button>
        <button onClick={save} disabled={saving || !name || !subject}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  )
}

// ── Welcome step form ─────────────────────────────────────────────────────────

function WelcomeStepForm({
  initial, adminEmail, onSave, onCancel,
}: {
  initial?: WelcomeStep
  adminEmail: string
  onSave: () => void
  onCancel: () => void
}) {
  const [stepNumber, setStepNumber] = useState(initial?.stepNumber ?? 1)
  const [delayDays,  setDelayDays]  = useState(initial?.delayDays ?? 0)
  const [subject,    setSubject]    = useState(initial?.subject ?? "")
  const [blocks,     setBlocks]     = useState<Block[]>(() => {
    try { return JSON.parse(initial?.body ?? "[]") } catch { return [] }
  })
  const [saving,     setSaving]     = useState(false)
  const [testEmail,  setTestEmail]  = useState(adminEmail)
  const [testStatus, setTestStatus] = useState<"idle"|"sending"|"sent"|"error">("idle")

  async function save() {
    setSaving(true)
    const payload = { id: initial?.id, stepNumber, delayDays, subject, body: JSON.stringify(blocks), active: initial?.active ?? true }
    await fetch("/api/admin/welcome-steps", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    onSave()
  }

  async function sendTest() {
    if (!initial) return
    setTestStatus("sending")
    const res = await fetch(`/api/admin/welcome-steps/${initial.id}/test`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    })
    setTestStatus(res.ok ? "sent" : "error")
    setTimeout(() => setTestStatus("idle"), 3000)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 className="font-extrabold text-slate-900 text-lg">
        {initial ? "Edit welcome step" : "New welcome step"}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Step #</label>
          <input type="number" min={1} value={stepNumber} onChange={e => setStepNumber(parseInt(e.target.value))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
            Send after (days since signup)
          </label>
          <input type="number" min={0} value={delayDays} onChange={e => setDelayDays(parseInt(e.target.value))}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
          />
        </div>
      </div>

      <input value={subject} onChange={e => setSubject(e.target.value)}
        placeholder="Email subject line"
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
      />

      <EmailBlockEditor blocks={blocks} onChange={setBlocks} />

      {/* Test email — only available when editing an existing step */}
      {initial && (
        <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 space-y-2">
          <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">Send test email</p>
          <div className="flex gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 text-sm border border-violet-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-violet-500"
            />
            <button onClick={sendTest} disabled={testStatus === "sending"}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-60 transition">
              {testStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> :
               testStatus === "sent"    ? <CheckCircle2 className="w-4 h-4" /> :
                                          <FlaskConical className="w-4 h-4" />}
              {testStatus === "sent" ? "Sent!" : testStatus === "error" ? "Failed" : "Send test"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition">
          Cancel
        </button>
        <button onClick={save} disabled={saving || !subject}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmailAdmin({ adminEmail }: { adminEmail: string }) {
  const [tab,           setTab]           = useState<"welcome"|"campaigns">("campaigns")
  const [steps,         setSteps]         = useState<WelcomeStep[]>([])
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [editingStep,   setEditingStep]   = useState<WelcomeStep | null | "new">(null)
  const [editingCamp,   setEditingCamp]   = useState<Campaign | null | "new">(null)
  const [sendingId,     setSendingId]     = useState<number | null>(null)
  const [sendResult,    setSendResult]    = useState<{ id: number; sent: number } | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [s, c] = await Promise.all([
      fetch("/api/admin/welcome-steps").then(r => r.json()),
      fetch("/api/admin/campaigns").then(r => r.json()),
    ])
    setSteps(s)
    setCampaigns(c)
  }

  async function toggleStepActive(step: WelcomeStep) {
    await fetch("/api/admin/welcome-steps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...step, body: step.body, active: !step.active }),
    })
    loadAll()
  }

  async function deleteStep(id: number) {
    if (!confirm("Delete this welcome step?")) return
    await fetch("/api/admin/welcome-steps", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    loadAll()
  }

  async function deleteCampaign(id: number) {
    if (!confirm("Delete this campaign?")) return
    await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" })
    loadAll()
  }

  async function sendNow(id: number) {
    if (!confirm("Send this campaign to all matching users now?")) return
    setSendingId(id)
    const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" })
    const data = await res.json()
    setSendResult({ id, sent: data.sent ?? 0 })
    setSendingId(null)
    loadAll()
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm w-fit">
        {(["campaigns", "welcome"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}>
            {t === "campaigns" ? "Campaigns" : "Welcome flow"}
          </button>
        ))}
      </div>

      {/* ── Campaigns tab ── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          {editingCamp ? (
            <CampaignForm
              initial={editingCamp === "new" ? undefined : editingCamp}
              adminEmail={adminEmail}
              onSave={() => { setEditingCamp(null); loadAll() }}
              onCancel={() => setEditingCamp(null)}
            />
          ) : (
            <>
              <button onClick={() => setEditingCamp("new")}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 transition">
                <Plus className="w-4 h-4" /> New campaign
              </button>

              {campaigns.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">No campaigns yet</p>
              )}

              {campaigns.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 truncate">{c.name}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm text-slate-500 truncate">{c.subject}</p>
                      {c.scheduledAt && c.status === "scheduled" && (
                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Scheduled: {new Date(c.scheduledAt).toLocaleString()}
                        </p>
                      )}
                      {c.sentAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sent: {new Date(c.sentAt).toLocaleString()}
                        </p>
                      )}
                      {sendResult?.id === c.id && (
                        <p className="text-xs text-green-600 font-semibold mt-0.5">
                          ✓ Sent to {sendResult.sent} user{sendResult.sent !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status !== "sent" && (
                        <button onClick={() => setEditingCamp(c)}
                          className="p-2 text-slate-400 hover:text-violet-600 transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {c.status !== "sent" && (
                        <button onClick={() => sendNow(c.id)} disabled={sendingId === c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 disabled:opacity-60 transition">
                          {sendingId === c.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />}
                          Send now
                        </button>
                      )}
                      <button onClick={() => deleteCampaign(c.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Welcome flow tab ── */}
      {tab === "welcome" && (
        <div className="space-y-4">
          {editingStep ? (
            <WelcomeStepForm
              initial={editingStep === "new" ? undefined : editingStep}
              adminEmail={adminEmail}
              onSave={() => { setEditingStep(null); loadAll() }}
              onCancel={() => setEditingStep(null)}
            />
          ) : (
            <>
              <button onClick={() => setEditingStep("new")}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 transition">
                <Plus className="w-4 h-4" /> New welcome step
              </button>

              {steps.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">No welcome steps yet</p>
              )}

              {[...steps].sort((a, b) => a.delayDays - b.delayDays).map(step => (
                <div key={step.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
                          Step {step.stepNumber}
                        </span>
                        <span className="text-xs text-slate-400">Day {step.delayDays}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step.active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          {step.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate mt-0.5">{step.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleStepActive(step)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 transition">
                        {step.active ? "Pause" : "Activate"}
                      </button>
                      <button onClick={() => setEditingStep(step)}
                        className="p-2 text-slate-400 hover:text-violet-600 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteStep(step.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
