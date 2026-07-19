"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "One capital letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterForm({ prefillEmail }) {
  const [formData, setFormData] = useState({
    email: prefillEmail || "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (prefillEmail) {
      setFormData((prev) => ({ ...prev, email: prefillEmail }))
    }
  }, [prefillEmail])

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(formData.password),
  }))
  const passwordValid = passwordChecks.every((c) => c.passed)
  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!passwordValid) {
      setError("Password does not meet all the requirements below")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const fieldError = data.errors && Object.values(data.errors)[0]
        setError(fieldError || data.message || "Registration failed")
        return
      }
      setRegistered(true)
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="relative min-h-screen bg-[#050508] flex items-center justify-center px-4 overflow-hidden">
        <div className="orb w-96 h-96 bg-violet-600 top-0 right-0 animate-float" />
        <div className="orb w-80 h-80 bg-indigo-600 bottom-0 left-0 animate-float-delayed" />
        <div className="relative z-10 glass-card rounded-2xl px-8 py-10 w-full max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-black mb-2 tracking-tight">Verify your email</h1>
          <p className="text-slate-400 text-sm mb-1">
            We sent a verification link to{" "}
            <span className="text-white font-semibold">{formData.email}</span>
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Click the link in the email to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all glow-indigo-sm text-sm"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#050508] flex items-center justify-center px-4 overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-violet-600 top-0 right-0 animate-float" />
      <div className="orb w-80 h-80 bg-indigo-600 bottom-0 left-0 animate-float-delayed" />

      {/* Logo */}
      <div className="absolute top-6 left-6 md:left-12 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <span className="text-white font-black text-sm">S</span>
        </div>
        <span className="text-white font-black text-xl tracking-tight">
          Stream<span className="gradient-text">AI</span>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 glass-card rounded-2xl px-8 py-10 w-full max-w-md">
        <h1 className="text-white text-2xl font-black mb-1 tracking-tight">Create your account</h1>
        <p className="text-slate-500 text-sm mb-2">
          Start with{" "}
          <span className="text-amber-400 font-semibold">10 free AI credits</span>
        </p>
        <p className="text-slate-600 text-xs mb-8">No credit card required</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />

          {formData.password.length > 0 && !passwordValid && (
            <ul className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex flex-col gap-1.5">
              {passwordChecks.map((check) => (
                <li key={check.id} className="flex items-center gap-2 text-xs">
                  <span className={check.passed ? "text-emerald-400" : "text-slate-600"}>
                    {check.passed ? "✓" : "○"}
                  </span>
                  <span className={check.passed ? "text-emerald-400" : "text-slate-500"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            aria-invalid={passwordsMismatch}
            className={`bg-white/5 border text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all ${
              passwordsMismatch
                ? "border-red-500/50 focus:border-red-500/70"
                : "border-white/10 focus:border-indigo-500/50"
            }`}
          />

          {passwordsMismatch && (
            <p className="text-red-400 text-xs px-1 -mt-1.5">Passwords do not match</p>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl mt-2 transition-all glow-indigo-sm text-sm"
          >
            {loading ? "Creating account..." : "Create Free Account"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-slate-600 text-xs">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-black font-semibold transition-colors text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-slate-500 mt-6 text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
