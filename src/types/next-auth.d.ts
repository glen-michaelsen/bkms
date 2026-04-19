import "next-auth"

declare module "next-auth" {
  interface User {
    role: string
    language: string
    gender: string
  }
  interface Session {
    user: {
      id: string
      email: string
      role: string
      language: string
      gender: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    language: string
    gender: string
  }
}
