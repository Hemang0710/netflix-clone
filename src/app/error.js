'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function RootError({ error, reset }) {
  useEffect(() => {
    console.error('Root error boundary:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">💔</div>
            <h1 className="text-4xl font-black mb-4 text-white">Something Went Wrong</h1>
            <p className="text-slate-400 mb-2 text-lg">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
            <div className="flex gap-3 justify-center flex-col sm:flex-row">
              <button
                onClick={reset}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/browse"
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-lg transition-colors text-center"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
