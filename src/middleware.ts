import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const publicRoutes = ["/login", "/register"]
  const isPublic = publicRoutes.includes(pathname)

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isPublic) {
    return Response.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
