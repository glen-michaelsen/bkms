import "next-auth"

declare module "next-auth" {
  interface User {
    role: string
    language: string
    gender: string
    firstName?: string
    hintEnabled: boolean
    studyDirection: string
  }
  interface Session {
    user: {
      id: string
      email: string
      role: string
      language: string
      gender: string
      firstName?: string
      hintEnabled: boolean
      studyDirection: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    language: string
    gender: string
    firstName?: string | null
    hintEnabled: boolean
    studyDirection: string
  }
}
