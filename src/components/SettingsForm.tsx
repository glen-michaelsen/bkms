"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Check } from "lucide-react"
import { useSession } from "next-auth/react"
import {
  updateProfileAction,
  updateEmailAction,
  updatePasswordAction,
  updateEmailPrefsAction,
  updatePersonalProfileAction,
  updateStudyPrefsAction,
} from "@/app/actions"
import { LevelConfig } from "@/components/LevelConfig"
import { TIMEZONES } from "@/lib/timezones"
import { COUNTRIES } from "@/lib/countries"
import { JOB_TITLES, STUDY_LEVELS } from "@/lib/job-titles"
import Link from "next/link"

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-[0.98]"
    >
      {pending ? "Saving…" : label}
    </button>
  )
}

function StatusMessage({ state }: { state: { error?: string; success?: boolean } | undefined }) {
  if (!state) return null
  if (state.error) return <p className="text-sm text-rose-600 font-medium">{state.error}</p>
  if (state.success) return <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-4 h-4" />Saved</p>
  return null
}

type InitialProfile = {
  birthday?: string | null
  jobStatus?: string | null
  jobTitle?: string | null
  studyLevel?: string | null
  city?: string | null
  country?: string | null
  countryOfOrigin?: string | null
} | null

export function SettingsForm({
  initialFirstName,
  initialEmail,
  initialLanguage,
  initialGender,
  initialStudyDirection,
  levels,
  levelConfig,
  initialTimezone,
  initialStreakMailEnabled,
  initialStreakMailHour,
  initialVerbOfDayEnabled,
  initialNewsletterEnabled,
  initialMultipleChoiceRatio,
  initialProfile,
}: {
  initialFirstName: string
  initialEmail: string
  initialLanguage: string
  initialGender: string
  initialStudyDirection: string
  levels: { id: number; name: string }[]
  levelConfig: { levelId: number; percentage: number }[]
  initialTimezone: string
  initialStreakMailEnabled: boolean
  initialStreakMailHour: number
  initialVerbOfDayEnabled: boolean
  initialNewsletterEnabled: boolean
  initialMultipleChoiceRatio: number
  initialProfile: InitialProfile
}) {
  const { update } = useSession()

  // Derived learning-direction state for the two-step picker
  // learnTarget: "en" | "sr" | "hr"
  const initLearnTarget = initialStudyDirection === "to_english" ? "en" : initialLanguage
  const [learnTarget, setLearnTarget] = useState<"en" | "sr" | "hr">(initLearnTarget as "en" | "sr" | "hr")
  const [refLanguage, setRefLanguage] = useState<"sr" | "hr">(initialLanguage as "sr" | "hr")

  // Derived values to feed into the hidden form inputs
  const derivedLanguage: "sr" | "hr" = learnTarget === "en" ? refLanguage : learnTarget as "sr" | "hr"
  const derivedDirection = learnTarget === "en" ? "to_english" : "to_slavic"

  const [timezone, setTimezone]               = useState(initialTimezone)
  const [streakEnabled, setStreakEnabled]     = useState(initialStreakMailEnabled)
  const [streakHour, setStreakHour]           = useState(initialStreakMailHour)
  const [verbEnabled, setVerbEnabled]         = useState(initialVerbOfDayEnabled)
  const [newsletterEnabled, setNewsletter]    = useState(initialNewsletterEnabled)
  const [mcRatio, setMcRatio]                 = useState(initialMultipleChoiceRatio)

  const [profileState, profileAction, profilePending]           = useActionState(updateProfileAction, undefined)
  const [emailState, emailAction, emailPending]                 = useActionState(updateEmailAction, undefined)
  const [passwordState, passwordAction, passwordPending]        = useActionState(updatePasswordAction, undefined)
  const [personalState, personalAction, personalPending]        = useActionState(updatePersonalProfileAction, undefined)

  const [studyPrefsPending, startStudyPrefsTransition] = useTransition()
  const [studyPrefsState, setStudyPrefsState] = useState<{ error?: string; success?: boolean } | undefined>()

  function saveStudyPrefs() {
    startStudyPrefsTransition(async () => {
      const fd = new FormData()
      fd.set("multipleChoiceRatio", mcRatio.toString())
      const res = await updateStudyPrefsAction(undefined, fd)
      setStudyPrefsState(res)
    })
  }

  const [birthday,        setBirthday]        = useState(initialProfile?.birthday        ?? "")
  const [jobStatus,       setJobStatus]       = useState(initialProfile?.jobStatus       ?? "")
  const [jobTitle,        setJobTitle]        = useState(initialProfile?.jobTitle        ?? "")
  const [studyLevel,      setStudyLevel]      = useState(initialProfile?.studyLevel      ?? "")
  const [city,            setCity]            = useState(initialProfile?.city            ?? "")
  const [country,         setCountry]         = useState(initialProfile?.country         ?? "")
  const [countryOfOrigin, setCountryOfOrigin] = useState(initialProfile?.countryOfOrigin ?? "")

  // Email prefs: call the action directly to avoid Next.js router refresh remounting the component
  const [emailPrefsPending, startEmailPrefsTransition] = useTransition()
  const [emailPrefsState, setEmailPrefsState] = useState<{ error?: string; success?: boolean } | undefined>()

  function saveEmailPrefs() {
    startEmailPrefsTransition(async () => {
      const fd = new FormData()
      fd.set("timezone", timezone)
      fd.set("streakMailEnabled", streakEnabled ? "1" : "0")
      fd.set("streakMailHour", streakHour.toString())
      fd.set("verbOfDayEnabled", verbEnabled ? "1" : "0")
      fd.set("newsletterEnabled", newsletterEnabled ? "1" : "0")
      const res = await updateEmailPrefsAction(undefined, fd)
      setEmailPrefsState(res)
    })
  }

  // Sync profile changes (name, language, gender, studyDirection) into the JWT session
  useEffect(() => {
    if (profileState?.success && profileState.updated) {
      update(profileState.updated)
    }
  }, [profileState, update])

  // Sync email change into the JWT session
  useEffect(() => {
    if (emailState?.success && emailState.updated) {
      update(emailState.updated)
    }
  }, [emailState, update])

  return (
    <div className="space-y-5">
      {/* Profile & Preferences */}
      <SectionCard
        title="Profile & preferences"
        description="Your display name, language, and gender"
      >
        <form action={profileAction} className="space-y-4">
          {/* Hidden derived fields */}
          <input type="hidden" name="language" value={derivedLanguage} />
          <input type="hidden" name="studyDirection" value={derivedDirection} />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              First name
            </label>
            <input
              name="firstName"
              type="text"
              defaultValue={initialFirstName}
              placeholder="e.g. Glen"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          {/* Two-step language picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">I am learning</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "en", flag: "🇬🇧", label: "English" },
                { value: "sr", flag: "🇷🇸", label: "Serbian" },
                { value: "hr", flag: "🇭🇷", label: "Croatian" },
              ] as const).map(({ value, flag, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLearnTarget(value)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    learnTarget === value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  <span className="text-xl">{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {learnTarget === "en" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reference language</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "sr", flag: "🇷🇸", label: "Serbian" },
                  { value: "hr", flag: "🇭🇷", label: "Croatian" },
                ] as const).map(({ value, flag, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRefLanguage(value)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      refLanguage === value
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  >
                    <span className="text-xl">{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
            <select
              name="gender"
              defaultValue={initialGender}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <StatusMessage state={profileState} />
            <SaveButton pending={profilePending} />
          </div>
        </form>
      </SectionCard>

      {/* Email */}
      <SectionCard
        title="Email address"
        description="The email you use to sign in"
      >
        <form action={emailAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center justify-between">
            <StatusMessage state={emailState} />
            <SaveButton pending={emailPending} />
          </div>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard
        title="Password"
        description="Must be at least 8 characters"
      >
        <form action={passwordAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Current password
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                New password
              </label>
              <input
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm new password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <StatusMessage state={passwordState} />
            <SaveButton pending={passwordPending} label="Update password" />
          </div>
        </form>
      </SectionCard>

      {/* Email notifications */}
      <SectionCard
        title="Email notifications"
        description="Optional emails to help you stay consistent"
      >
        <div className="space-y-6">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your timezone</label>
            <select
              name="timezone"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Streak reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Streak reminder</p>
                <p className="text-xs text-slate-500 mt-0.5">Get a nudge if you haven't practised that day</p>
              </div>
              <button
                type="button"
                onClick={() => setStreakEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${streakEnabled ? "bg-violet-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${streakEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {streakEnabled && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Send reminder at</label>
                <select
                  name="streakMailHour"
                  value={streakHour}
                  onChange={e => setStreakHour(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer text-sm"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Verb of the day */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Verb of the day</p>
                <p className="text-xs text-slate-500 mt-0.5">Daily email at 8 AM with a verb, its conjugation and examples</p>
              </div>
              <button
                type="button"
                onClick={() => setVerbEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${verbEnabled ? "bg-violet-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${verbEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Newsletter</p>
                <p className="text-xs text-slate-500 mt-0.5">Occasional emails with tips, updates and new features</p>
              </div>
              <button
                type="button"
                onClick={() => setNewsletter(v => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${newsletterEnabled ? "bg-violet-600" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${newsletterEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <StatusMessage state={emailPrefsState} />
            <button
              type="button"
              onClick={saveEmailPrefs}
              disabled={emailPrefsPending}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {emailPrefsPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Study mode */}
      <SectionCard
        title="Study mode split"
        description="Choose how often multiple choice vs. typing appears in your sessions"
      >
        <div className="space-y-5">
          {/* Visual split bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Multiple choice</span>
              <span>Type the answer</span>
            </div>
            <div className="flex rounded-xl overflow-hidden h-7 text-xs font-bold select-none">
              {mcRatio > 0 && (
                <div
                  className="flex items-center justify-center bg-violet-500 text-white transition-all duration-200"
                  style={{ width: `${mcRatio}%` }}
                >
                  {mcRatio >= 20 && `${mcRatio}%`}
                </div>
              )}
              {mcRatio < 100 && (
                <div
                  className="flex items-center justify-center bg-emerald-500 text-white transition-all duration-200"
                  style={{ width: `${100 - mcRatio}%` }}
                >
                  {(100 - mcRatio) >= 20 && `${100 - mcRatio}%`}
                </div>
              )}
            </div>
          </div>

          {/* Slider */}
          <div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={mcRatio}
              onChange={e => setMcRatio(parseInt(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                <span key={v} className={v === mcRatio ? "text-violet-600 font-bold" : ""}>{v}</span>
              ))}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500">
            {mcRatio === 0
              ? "Every exercise will ask you to type the answer."
              : mcRatio === 100
              ? "Every exercise will show multiple choice options."
              : `In a 10-question session: ${mcRatio / 10} multiple choice and ${(100 - mcRatio) / 10} type-in.`}
          </p>

          <div className="flex items-center justify-between pt-1">
            <StatusMessage state={studyPrefsState} />
            <button
              type="button"
              onClick={saveStudyPrefs}
              disabled={studyPrefsPending}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {studyPrefsPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Study levels */}
      <SectionCard
        title="Sentence level split"
        description="Set how often each difficulty level appears in your sentence practice (must total 100%)"
      >
        <LevelConfig levels={levels} initialConfig={levelConfig} />
      </SectionCard>

      {/* About you */}
      <SectionCard
        title="About you"
        description="Personal details used to build your introduction practice"
      >
        <form action={personalAction}>
          <div className="space-y-4">
            {/* Birthday */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Birthday</label>
              <input
                type="date"
                name="birthday"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
              />
            </div>

            {/* Job status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employment status</label>
              <select
                name="jobStatus"
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer text-sm"
              >
                <option value="">Select status…</option>
                <option value="working">Working</option>
                <option value="studying">Studying</option>
                <option value="between_jobs">Between jobs</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Job title — shown when working */}
            {jobStatus === "working" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Job title</label>
                <input
                  type="text"
                  name="jobTitle"
                  list="job-titles-list"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Type to search or enter your title…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
                />
                <datalist id="job-titles-list">
                  {JOB_TITLES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
            )}

            {/* Study level — shown when studying */}
            {jobStatus === "studying" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Level of study</label>
                <select
                  name="studyLevel"
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer text-sm"
                >
                  <option value="">Select level…</option>
                  {STUDY_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* City + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Copenhagen"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country (living in)</label>
                <input
                  type="text"
                  name="country"
                  list="countries-list"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Type to search…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
                />
                <datalist id="countries-list">
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value} />)}
                </datalist>
              </div>
            </div>

            {/* Country of origin */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country of origin</label>
              <input
                type="text"
                name="countryOfOrigin"
                list="countries-origin-list"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="Type to search…"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-sm"
              />
              <datalist id="countries-origin-list">
                {COUNTRIES.map((c) => <option key={c.value} value={c.value} />)}
              </datalist>
            </div>

            <div className="flex items-center justify-between pt-1">
              <StatusMessage state={personalState} />
              <SaveButton pending={personalPending} />
            </div>
          </div>
        </form>
      </SectionCard>

      {/* Train Your Introduction — only shown when there's something to work with */}
      {(birthday || jobStatus || city || country || countryOfOrigin) && (
        <SectionCard
          title="Train Your Introduction"
          description="Practice introducing yourself in Serbian or Croatian"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Your bilingual introduction is ready — practice reading and speaking it aloud.
            </p>
            <Link
              href="/study/introduction"
              className="ml-4 flex-shrink-0 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all active:scale-[0.98]"
            >
              Practice →
            </Link>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
