"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleError = searchParams?.get("error")

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message)
        return
      }

      router.push("/browse")
      router.refresh()

    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen bg-black flex items-center justify-center"
      style={{
        backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e0-ecd7979cc88b/web/IN-en-20250303-TRIFECTA-perspective_5cebc697-7bf1-4c90-9c6e-08e8b6f77614_large.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute top-8 left-12">
        <span className="text-red-600 text-5xl font-black tracking-tighter">
          NETFLIX
        </span>
      </div>

      <div className="relative z-10 bg-black/80 backdrop-blur-sm rounded-md p-16 w-full max-w-md">
        <h1 className="text-white text-3xl font-bold mb-8">Sign In</h1>

        {/* Google error message */}
        {googleError && (
          <p className="text-red-500 text-sm mb-4">
            {googleError === "google_denied"
              ? "Google sign-in was cancelled."
              : "Google sign-in failed. Please try again."}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-zinc-800 text-white placeholder-zinc-400 rounded px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-zinc-800 text-white placeholder-zinc-400 rounded px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded mt-4 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-zinc-500 text-sm">or</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Google Sign In Button */}
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full py-4 rounded bg-white hover:bg-zinc-100 text-black font-semibold transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-zinc-400 mt-8 text-base">
          New to Netflix?{" "}
          <Link href="/register" className="text-white hover:underline font-semibold">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <LoginForm />
    </Suspense>
  )
}

