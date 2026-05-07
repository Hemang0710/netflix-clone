"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [credits, setCredits] = useState(null)
  const [dueCards, setDueCards] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUserEmail(data.email)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits")
        if (res.ok) {
          const data = await res.json()
          setCredits(data.credits)
        }
      } catch {
        // credits not critical for nav
      }
    }
    async function fetchDueCards() {
      try {
        const res = await fetch("/api/flashcards/due")
        if (res.ok) {
          const data = await res.json()
          setDueCards(data.due || 0)
        }
      } catch {
        // non-critical
      }
    }
    fetchUser()
    fetchCredits()
    fetchDueCards()
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : "U"

  const navLinks = [
    { href: "/browse",            label: "Discover" },
    { href: "/learn",             label: "My Learning" },
    { href: "/learn/paths",       label: "Paths" },
    { href: "/leaderboard",       label: "🏆" },
    { href: "/creator/dashboard", label: "Dashboard" },
    { href: "/subscribe",         label: "Plans" },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-indigo-500/10">
      <div className="flex items-center justify-between px-6 md:px-12 h-16">

        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo-sm">
            <span className="text-white text-sm font-black">L</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight hidden sm:block">
            Learn<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <Link href="/learn" className="hover:text-white transition-colors">
         My Library
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Link
            href="/search"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Credits badge */}
          {credits !== null && (
            <Link
              href="/creator/studio"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"
              title="AI Credits"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              {credits}
            </Link>
          )}

          {/* Due flashcards badge */}
          {dueCards > 0 && (
            <Link
              href="/learn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-all"
              title="Flashcards due for review"
            >
              🃏 {dueCards}
            </Link>
          )}

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
              title={userEmail}
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-52 glass-card rounded-xl shadow-2xl py-1 border border-indigo-500/15">
                {userEmail && (
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm text-white truncate font-medium">{userEmail}</p>
                  </div>
                )}
                <div className="md:hidden py-1 border-b border-white/5">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
