"use server"

import { signIn, signOut, auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
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
