// src/proxy.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Function renamed from "middleware" to "proxy"
export async function proxy(request) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const isProtectedRoute = pathname.startsWith("/browse") || pathname.startsWith("/creator")
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
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
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/browse/:path*", "/login", "/register"],
}