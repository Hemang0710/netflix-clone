"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

function VerifyEmail() {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  // verifying | success | error
  const [status, setStatus] = useState(token ? "verifying" : "error")
  const [message, setMessage] = useState(
    token ? "" : "Verification link is missing its token. Use the link from your email."
  )

  useEffect(() => {
    if (!token) return

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok && data.success) {
          setStatus("success")
          setMessage(data.message)
        } else {
          setStatus("error")
          setMessage(data.message || "Verification failed. The link may have expired.")
        }
      } catch {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      }
    }
    verify()
  }, [token])

  return (
    <div className="relative min-h-screen bg-[#050508] flex items-center justify-center px-4 overflow-hidden">
      <div className="orb w-96 h-96 bg-indigo-600 top-0 left-0 animate-float" />
      <div className="orb w-80 h-80 bg-violet-600 bottom-0 right-0 animate-float-delayed" />

      <div className="absolute top-6 left-6 md:left-12 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <span className="text-white font-black text-sm">S</span>
        </div>
        <span className="text-white font-black text-xl tracking-tight">
          Stream<span className="gradient-text">AI</span>
        </span>
      </div>

      <div className="relative z-10 glass-card rounded-2xl px-8 py-10 w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <h1 className="text-white text-2xl font-black mb-2 tracking-tight">Verifying your email...</h1>
            <p className="text-slate-500 text-sm">This only takes a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-black mb-2 tracking-tight">Email verified!</h1>
            <p className="text-slate-400 text-sm mb-8">
              Your account is now active. Sign in to start learning.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all glow-indigo-sm text-sm"
            >
              Sign In
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-black mb-2 tracking-tight">Verification failed</h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-[#050508] min-h-screen" />}>
      <VerifyEmail />
    </Suspense>
  )
}
