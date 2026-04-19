"use client"

import { useActionState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  updateProfileAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/app/actions"
import { LevelConfig } from "@/components/LevelConfig"

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
  if (state.success) return <p className="text-sm text-emerald-600 font-semibold">Saved ✓</p>
  return null
}

export function SettingsForm({
  initialFirstName,
  initialEmail,
  initialLanguage,
  initialGender,
  levels,
  levelConfig,
}: {
  initialFirstName: string
  initialEmail: string
  initialLanguage: string
  initialGender: string
  levels: { id: number; name: string }[]
  levelConfig: { levelId: number; percentage: number }[]
}) {
  const { update } = useSession()

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    undefined
  )
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmailAction,
    undefined
  )
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePasswordAction,
    undefined
  )

  // Sync profile changes (name, language, gender) into the JWT session
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Language
              </label>
              <select
                name="language"
                defaultValue={initialLanguage}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="sr">🇷🇸 Serbian (Srpski)</option>
                <option value="hr">🇭🇷 Croatian (Hrvatski)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                name="gender"
                defaultValue={initialGender}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
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

      {/* Study levels */}
      <SectionCard
        title="Sentence level split"
        description="Set how often each difficulty level appears in your sentence practice (must total 100%)"
      >
        <LevelConfig levels={levels} initialConfig={levelConfig} />
      </SectionCard>
    </div>
  )
}
