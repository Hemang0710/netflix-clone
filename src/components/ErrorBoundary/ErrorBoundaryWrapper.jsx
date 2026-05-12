'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundaryWrapper({ error, reset, pageName = 'Page' }) {
  useEffect(() => {
    console.error(`${pageName} error:`, error)
  }, [error, pageName])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-3xl font-bold mb-4 text-white">Oops! Error on {pageName}</h1>
        <p className="text-slate-400 mb-8">
          We couldn't load this page. Try again or go back home.
        </p>
        <div className="flex gap-3 justify-center flex-col sm:flex-row">
          <button
            onClick={reset}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/browse"
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
