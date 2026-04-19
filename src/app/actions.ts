"use server"

import { signIn, signOut } from "@/auth"
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
