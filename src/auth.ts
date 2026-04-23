import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .get()

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          language: user.language,
          gender: user.gender,
          firstName: user.firstName ?? undefined,
          hintEnabled: user.hintEnabled,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.firstName !== undefined) token.firstName = session.firstName
        if (session.language) token.language = session.language
        if (session.gender) token.gender = session.gender
        if (session.email) token.email = session.email
        if (session.hintEnabled !== undefined) token.hintEnabled = session.hintEnabled
      }
      if (user) {
        token.role = (user as { role: string }).role
        token.language = (user as { language: string }).language
        token.gender = (user as { gender: string }).gender
        token.firstName = (user as { firstName?: string }).firstName ?? null
        token.hintEnabled = (user as { hintEnabled: boolean }).hintEnabled
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as string
      session.user.language = token.language as string
      session.user.gender = token.gender as string
      session.user.firstName = (token.firstName as string | null) ?? undefined
      session.user.hintEnabled = (token.hintEnabled as boolean) ?? false
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
