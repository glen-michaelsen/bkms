import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]
  const publicPrefixes = ["/words", "/sentences", "/cases", "/categories", "/blog"]
  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/"

  if (!isLoggedIn && !isPublic) {
    const login = new URL("/login", req.url)
    if (pathname === "/oauth/authorize") login.searchParams.set("next", pathname + req.nextUrl.search)
    return Response.redirect(login)
  }

  if (isLoggedIn && publicRoutes.includes(pathname)) {
    const next = req.nextUrl.searchParams.get("next")
    const target = pathname === "/login" && next?.startsWith("/oauth/authorize?") ? next : "/dashboard"
    return Response.redirect(new URL(target, req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|api/cron|api/oauth|mcp(?:/|$)|\\.well-known|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|.*\\.webp|.*\\.json|manifest).*)"],
}
