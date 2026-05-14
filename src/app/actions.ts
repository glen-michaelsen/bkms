"use server"

import { signIn, signOut, auth } from "@/auth"
import { db } from "@/db"
import { users, categories, levels, userLevelConfig, words, sentences, userCrosswordProgress, userWordMatchProgress, verbs, userDailyActivity, userProfile } from "@/db/schema"
import { eq, and, max, asc } from "drizzle-orm"
import { sendStreakReminder, sendVerbOfDay, localDateString } from "@/lib/resend"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { AuthError } from "next-auth"

export async function loginAction(
  _prev: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw error
  }
}

export async function registerAction(
  _prev: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const email = (formData.get("email") as string).trim().toLowerCase()
  const password = formData.get("password") as string
  const language = formData.get("language") as "sr" | "hr"
  const gender = formData.get("gender") as "male" | "female"

  if (!email || !password || !language || !gender) {
    return { error: "All fields are required" }
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) return { error: "An account with this email already exists" }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.insert(users).values({ email, passwordHash, language, gender })

  redirect("/login?registered=1")
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}

type SettingsResult = {
  error?: string
  success?: boolean
  updated?: { firstName?: string; language?: string; gender?: string; email?: string }
}

export async function updateProfileAction(
  _prev: SettingsResult | undefined,
  formData: FormData
): Promise<SettingsResult> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const firstName = (formData.get("firstName") as string).trim() || null
  const language = formData.get("language") as "sr" | "hr"
  const gender = formData.get("gender") as "male" | "female"

  if (!language || !gender) return { error: "Language and gender are required" }

  await db
    .update(users)
    .set({ firstName, language, gender })
    .where(eq(users.id, parseInt(session.user.id)))

  return {
    success: true,
    updated: { firstName: firstName ?? undefined, language, gender },
  }
}

export async function updateEmailAction(
  _prev: SettingsResult | undefined,
  formData: FormData
): Promise<SettingsResult> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const email = (formData.get("email") as string).trim().toLowerCase()
  if (!email) return { error: "Email is required" }

  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing && existing.id !== parseInt(session.user.id)) {
    return { error: "That email is already in use" }
  }

  await db
    .update(users)
    .set({ email })
    .where(eq(users.id, parseInt(session.user.id)))

  return { success: true, updated: { email } }
}

export async function updatePasswordAction(
  _prev: SettingsResult | undefined,
  formData: FormData
): Promise<SettingsResult> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required" }
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" }
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" }
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .get()

  if (!user) return { error: "User not found" }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return { error: "Current password is incorrect" }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, parseInt(session.user.id)))

  return { success: true }
}

// ─── Hint preference ─────────────────────────────────────────────────────────

export async function setHintEnabledAction(enabled: boolean): Promise<void> {
  const session = await auth()
  if (!session) return
  await db
    .update(users)
    .set({ hintEnabled: enabled })
    .where(eq(users.id, parseInt(session.user.id)))
}

// ─── Admin: categories & levels ───────────────────────────────────────────────

type SimpleResult = { error?: string; success?: boolean }

export async function addCategoryAction(
  _prev: SimpleResult | undefined,
  formData: FormData
): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }

  const name = (formData.get("name") as string).trim()
  if (!name) return { error: "Name is required" }

  try {
    await db.insert(categories).values({ name })
    return { success: true }
  } catch {
    return { error: "A category with that name already exists" }
  }
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "admin") return

  const id = parseInt(formData.get("id") as string)
  if (isNaN(id)) return

  await db.update(words).set({ categoryId: null }).where(eq(words.categoryId, id))
  await db.update(sentences).set({ categoryId: null }).where(eq(sentences.categoryId, id))
  await db.delete(categories).where(eq(categories.id, id))

  revalidatePath("/admin")
}

export async function addLevelAction(
  _prev: SimpleResult | undefined,
  formData: FormData
): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }

  const name = (formData.get("name") as string).trim()
  if (!name) return { error: "Name is required" }

  try {
    await db.insert(levels).values({ name })
    return { success: true }
  } catch {
    return { error: "A level with that name already exists" }
  }
}

// ─── Admin: edit & delete words / sentences ───────────────────────────────────

type WordData = { english: string; serbian: string; croatian: string; categoryId: number | null }
type SentenceData = WordData & { levelId: number | null }

export async function updateWordAction(id: number, data: WordData): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }
  await db.update(words).set(data).where(eq(words.id, id))
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteWordAction(id: number): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }
  await db.delete(words).where(eq(words.id, id))
  revalidatePath("/admin")
  return { success: true }
}

export async function updateSentenceAction(id: number, data: SentenceData): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }
  await db.update(sentences).set(data).where(eq(sentences.id, id))
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteSentenceAction(id: number): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }
  await db.delete(sentences).where(eq(sentences.id, id))
  revalidatePath("/admin")
  return { success: true }
}

// ─── Crossword progress ───────────────────────────────────────────────────────

export async function saveCrosswordProgressAction(
  date: string,
  inputJson: string,
  solved: boolean,
): Promise<void> {
  const session = await auth()
  if (!session) return

  const userId = parseInt(session.user.id)

  const existing = await db
    .select()
    .from(userCrosswordProgress)
    .where(
      and(
        eq(userCrosswordProgress.userId, userId),
        eq(userCrosswordProgress.date, date),
      ),
    )

  if (existing.length > 0) {
    await db
      .update(userCrosswordProgress)
      .set({
        inputJson,
        // Only set solvedAt once — don't overwrite if already solved
        solvedAt: solved && !existing[0].solvedAt ? new Date() : existing[0].solvedAt,
      })
      .where(
        and(
          eq(userCrosswordProgress.userId, userId),
          eq(userCrosswordProgress.date, date),
        ),
      )
  } else {
    await db.insert(userCrosswordProgress).values({
      userId,
      date,
      inputJson,
      solvedAt: solved ? new Date() : null,
    })
  }
}

// ─── Word Match progress ──────────────────────────────────────────────────────

export async function saveWordMatchSolvedAction(date: string): Promise<void> {
  const session = await auth()
  if (!session) return

  const userId = parseInt(session.user.id)

  const existing = await db
    .select()
    .from(userWordMatchProgress)
    .where(
      and(
        eq(userWordMatchProgress.userId, userId),
        eq(userWordMatchProgress.date, date),
      ),
    )
    .get()

  if (existing) {
    if (!existing.solvedAt) {
      await db
        .update(userWordMatchProgress)
        .set({ solvedAt: new Date() })
        .where(
          and(
            eq(userWordMatchProgress.userId, userId),
            eq(userWordMatchProgress.date, date),
          ),
        )
    }
  } else {
    await db.insert(userWordMatchProgress).values({
      userId,
      date,
      solvedAt: new Date(),
    })
  }
}

export async function clearWordMatchProgressAction(date: string): Promise<void> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return

  const userId = parseInt(session.user.id)
  await db
    .delete(userWordMatchProgress)
    .where(
      and(
        eq(userWordMatchProgress.userId, userId),
        eq(userWordMatchProgress.date, date),
      ),
    )
}

// ─── Admin: manual email triggers ────────────────────────────────────────────

export type StreakMailResult = { sent: boolean; reason: "sent" | "streak_done" | "not_enabled" }
export type VerbMailResult   = { sent: boolean }

export async function adminTriggerStreakMailAction(): Promise<StreakMailResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { sent: false, reason: "not_enabled" }

  const userId = parseInt(session.user.id)
  const user = await db.select({
    id: users.id, email: users.email, firstName: users.firstName,
    language: users.language, timezone: users.timezone,
    streakMailEnabled: users.streakMailEnabled,
  }).from(users).where(eq(users.id, userId)).get()

  if (!user?.streakMailEnabled) return { sent: false, reason: "not_enabled" }

  // Check if admin has already trained today (UTC)
  const today = new Date().toISOString().slice(0, 10)
  const activity = await db
    .select({ id: userDailyActivity.id })
    .from(userDailyActivity)
    .where(and(eq(userDailyActivity.userId, userId), eq(userDailyActivity.date, today)))
    .get()

  if (activity) return { sent: false, reason: "streak_done" }

  await sendStreakReminder({ to: user.email, firstName: user.firstName, language: user.language })
  await db.update(users).set({ streakMailLastSentDate: localDateString(user.timezone ?? "Europe/Belgrade") }).where(eq(users.id, userId))
  return { sent: true, reason: "sent" }
}

export async function adminTriggerVerbOfDayAction(): Promise<VerbMailResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { sent: false }

  const userId = parseInt(session.user.id)
  const user = await db.select({
    id: users.id, email: users.email, firstName: users.firstName,
    language: users.language, timezone: users.timezone,
    verbOfDayEnabled: users.verbOfDayEnabled, verbOfDayEnabledAt: users.verbOfDayEnabledAt,
  }).from(users).where(eq(users.id, userId)).get()

  if (!user) return { sent: false }

  const allVerbs = await db.select().from(verbs).orderBy(asc(verbs.sortOrder), asc(verbs.id)).all()
  if (allVerbs.length === 0) return { sent: false }

  const tz = user.timezone ?? "Europe/Belgrade"
  const userLocalDate = localDateString(tz)
  const startDate = user.verbOfDayEnabledAt ?? userLocalDate
  const msPerDay = 86_400_000
  const dayIndex = Math.max(0, Math.round((new Date(userLocalDate).getTime() - new Date(startDate).getTime()) / msPerDay))
  const verb = allVerbs[dayIndex % allVerbs.length]

  await sendVerbOfDay({ to: user.email, firstName: user.firstName, verb, verbNumber: (dayIndex % allVerbs.length) + 1, language: user.language })
  await db.update(users).set({ verbMailLastSentDate: userLocalDate }).where(eq(users.id, userId))
  return { sent: true }
}

// ─── User level config ────────────────────────────────────────────────────────

export async function saveLevelConfigAction(
  _prev: SimpleResult | undefined,
  formData: FormData
): Promise<SimpleResult> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const userId = parseInt(session.user.id)
  const configs: { levelId: number; percentage: number }[] = []

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("pct_")) {
      const levelId = parseInt(key.slice(4))
      const pct = parseInt(value as string) || 0
      if (!isNaN(levelId)) configs.push({ levelId, percentage: pct })
    }
  }

  const total = configs.reduce((sum, c) => sum + c.percentage, 0)
  if (total !== 100) {
    return { error: `Percentages must sum to 100% (currently ${total}%)` }
  }

  await db.delete(userLevelConfig).where(eq(userLevelConfig.userId, userId))
  if (configs.length > 0) {
    await db.insert(userLevelConfig).values(
      configs.map((c) => ({ userId, levelId: c.levelId, percentage: c.percentage }))
    )
  }

  return { success: true }
}

// ─── Email notification preferences ──────────────────────────────────────────

export async function updateEmailPrefsAction(
  _prev: SimpleResult | undefined,
  formData: FormData
): Promise<SimpleResult> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const userId = parseInt(session.user.id)
  const timezone        = (formData.get("timezone") as string) || "Europe/Belgrade"
  const streakEnabled   = formData.get("streakMailEnabled") === "1"
  const streakHour      = Math.min(23, Math.max(0, parseInt(formData.get("streakMailHour") as string) || 20))
  const verbEnabled     = formData.get("verbOfDayEnabled") === "1"

  // If verb of day is being switched on for the first time, record today as start date
  let verbEnabledAt: string | undefined
  if (verbEnabled) {
    const current = await db.select({ verbOfDayEnabledAt: users.verbOfDayEnabledAt })
      .from(users).where(eq(users.id, userId)).get()
    if (!current?.verbOfDayEnabledAt) {
      verbEnabledAt = new Date().toISOString().slice(0, 10)
    }
  }

  await db.update(users).set({
    timezone,
    streakMailEnabled: streakEnabled,
    streakMailHour: streakHour,
    verbOfDayEnabled: verbEnabled,
    ...(verbEnabledAt ? { verbOfDayEnabledAt: verbEnabledAt } : {}),
    // Clear start date if disabling so re-enabling restarts from verb #1
    ...((!verbEnabled) ? { verbOfDayEnabledAt: null } : {}),
  }).where(eq(users.id, userId))

  return { success: true }
}

// ─── Admin: verbs ─────────────────────────────────────────────────────────────

type VerbData = {
  infinitive: string; translation: string
  ja: string; ti: string; onOna: string; mi: string; vi: string; oni: string
  examplesJson: string // JSON string
}

export async function addVerbAction(
  _prev: SimpleResult | undefined,
  formData: FormData
): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }

  const infinitive  = (formData.get("infinitive") as string).trim()
  const translation = (formData.get("translation") as string).trim()
  const ja          = (formData.get("ja") as string).trim()
  const ti          = (formData.get("ti") as string).trim()
  const onOna       = (formData.get("onOna") as string).trim()
  const mi          = (formData.get("mi") as string).trim()
  const vi          = (formData.get("vi") as string).trim()
  const oni         = (formData.get("oni") as string).trim()

  if (!infinitive || !translation || !ja || !ti || !onOna || !mi || !vi || !oni) {
    return { error: "All Serbian conjugation fields are required" }
  }

  // Optional Croatian overrides
  const nullIfEmpty = (key: string) => { const v = (formData.get(key) as string | null)?.trim(); return v || null }
  const infinitiveHr = nullIfEmpty("infinitiveHr")
  const jaHr         = nullIfEmpty("jaHr")
  const tiHr         = nullIfEmpty("tiHr")
  const onOnaHr      = nullIfEmpty("onOnaHr")
  const miHr         = nullIfEmpty("miHr")
  const viHr         = nullIfEmpty("viHr")
  const oniHr        = nullIfEmpty("oniHr")

  // Build examples from paired fields: example_serbian_0, example_croatian_0, example_english_0, ...
  const examples: { serbian: string; croatian?: string; english: string }[] = []
  for (let i = 0; i < 10; i++) {
    const sr = (formData.get(`example_serbian_${i}`) as string | null)?.trim()
    const hr = (formData.get(`example_croatian_${i}`) as string | null)?.trim()
    const en = (formData.get(`example_english_${i}`) as string | null)?.trim()
    if (sr && en) examples.push({ serbian: sr, ...(hr ? { croatian: hr } : {}), english: en })
  }

  // Sort order = current max + 1
  const maxRow = await db.select({ m: max(verbs.sortOrder) }).from(verbs).get()
  const sortOrder = (maxRow?.m ?? 0) + 1

  try {
    await db.insert(verbs).values({
      infinitive, translation, ja, ti, onOna, mi, vi, oni,
      infinitiveHr, jaHr, tiHr, onOnaHr, miHr, viHr, oniHr,
      examplesJson: JSON.stringify(examples),
      sortOrder,
    })
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { error: "Failed to add verb" }
  }
}

export async function deleteVerbAction(id: number): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== "admin") return { error: "Forbidden" }
  await db.delete(verbs).where(eq(verbs.id, id))
  revalidatePath("/admin")
  return { success: true }
}

// ── Personal profile ──────────────────────────────────────────────────────────

export async function updatePersonalProfileAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }

  const userId = parseInt(session.user.id)

  const birthday       = (formData.get("birthday")         as string) || null
  const jobStatus      = (formData.get("jobStatus")        as string) || null
  const jobTitle       = (formData.get("jobTitle")         as string)?.trim() || null
  const studyLevel     = (formData.get("studyLevel")       as string) || null
  const city           = (formData.get("city")             as string)?.trim() || null
  const country        = (formData.get("country")          as string)?.trim() || null
  const countryOfOrigin= (formData.get("countryOfOrigin")  as string)?.trim() || null

  const values = { userId, birthday, jobStatus, jobTitle, studyLevel, city, country, countryOfOrigin }

  const existing = await db.select({ userId: userProfile.userId }).from(userProfile).where(eq(userProfile.userId, userId)).get()
  if (existing) {
    await db.update(userProfile).set(values).where(eq(userProfile.userId, userId))
  } else {
    await db.insert(userProfile).values(values)
  }

  return { success: true }
}
