// src/proxy.js — Next.js 16 renamed "middleware" to "proxy"
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED = ["/browse", "/watch", "/creator", "/account", "/subscribe/success", "/learn", "/engagement", "/recommendations"]

export async function proxy(request) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const isProtectedRoute = PROTECTED.some((route) => pathname.startsWith(route))
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)

      if (isAuthRoute) {
        return NextResponse.redirect(new URL("/browse", request.url))
      }
    } catch {
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("token")
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/browse/:path*",
    "/watch/:path*",
    "/creator/:path*",
    "/account/:path*",
    "/subscribe/success",
    "/learn/:path*",
    "/engagement/:path*",
    "/recommendations/:path*",
    "/login",
    "/register",
  ],
}
