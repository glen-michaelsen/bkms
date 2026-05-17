import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const publicRoutes = ["/login", "/register"]
  const publicPrefixes = ["/words", "/sentences", "/cases"]
  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/"

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && publicRoutes.includes(pathname)) {
    return Response.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|.*\\.webp|.*\\.json|manifest).*)"],
}
