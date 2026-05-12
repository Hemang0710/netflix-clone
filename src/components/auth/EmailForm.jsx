"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EmailForm() {
  const [email, setEmail] = useState("")
  const router = useRouter()

  function handleSubmit(e) {
    e.preventDefault()
    router.push(`/register?email=${encodeURIComponent(email)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
        className="flex-1 px-5 py-4 rounded-xl text-white bg-white/5 border border-white/10 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 text-sm transition-all"
      />
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-4 rounded-xl text-sm transition-all glow-indigo-sm whitespace-nowrap"
      >
        Get Started Free
      </button>
    </form>
  )
}
