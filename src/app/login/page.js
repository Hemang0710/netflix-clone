// src/app/login/page.js
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
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

      // Login successful — middleware will handle redirect
      router.push("/browse")
      router.refresh()

    } catch (err) {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center"
      style={{
        backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e0-ecd7979cc88b/web/IN-en-20250303-TRIFECTA-perspective_5cebc697-7bf1-4c90-9c6e-08e8b6f77614_large.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Netflix Logo */}
      <div className="absolute top-8 left-12">
        <span className="text-red-600 text-5xl font-black tracking-tighter">
          NETFLIX
        </span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-black/80 backdrop-blur-sm rounded-md p-16 w-full max-w-md">
        <h1 className="text-white text-3xl font-bold mb-8">Sign In</h1>

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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded mt-4 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

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