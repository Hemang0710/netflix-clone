"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/Navbar"

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const TRENDING = ["React hooks", "Machine learning", "System design", "Python basics", "TypeScript"]

export default function SearchPageClient() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    async function search() {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        setResults(data.success ? data.data : [])
        setSearched(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      {/* Search header */}
      <div className="pt-20 pb-0 px-6 border-b border-white/5">
        <div className="max-w-3xl mx-auto py-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, topics, transcripts..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-2xl pl-12 pr-12 py-4 text-base focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            )}
          </div>

          {debouncedQuery && !loading && (
            <p className="text-slate-500 text-sm mt-3 px-1">
              {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
              <span className="text-slate-300">&ldquo;{debouncedQuery}&rdquo;</span>
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Empty state */}
        {!query && (
          <div className="py-16">
            <p className="text-slate-600 text-sm font-semibold uppercase tracking-widest mb-5">
              Trending Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-slate-300 text-sm hover:bg-indigo-500/10 hover:border-indigo-500/25 hover:text-indigo-300 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <div className="py-20 text-center">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-slate-300 font-semibold mb-2">No results for &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-slate-600 text-sm">Try different keywords or browse all courses</p>
            <Link
              href="/browse"
              className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
            >
              Browse All Courses
            </Link>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {results.map((video) => (
            <Link key={video.id} href={`/watch/${video.id}`}>
              <div className="flex gap-4 p-4 rounded-2xl glass-card hover:border-indigo-500/25 transition-all group">
                {/* Thumbnail */}
                <div className="shrink-0 w-36 h-20 rounded-xl overflow-hidden bg-[#0d0d1a] border border-white/5">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={144}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎓</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors truncate">
                    {video.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400">
                      {video.genre}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{video.views} views</span>
                    <span className="text-slate-600">·</span>
                    <span className={video.isFree ? "text-emerald-400" : "text-amber-400"}>
                      {video.isFree ? "Free" : `$${video.price}`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-center text-slate-600 group-hover:text-indigo-400 transition-colors text-sm">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
