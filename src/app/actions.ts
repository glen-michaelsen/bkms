"use server"

import { signIn, signOut, auth } from "@/auth"
import { db } from "@/db"
import { users, categories, levels, userLevelConfig, words, sentences } from "@/db/schema"
import { eq } from "drizzle-orm"
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
