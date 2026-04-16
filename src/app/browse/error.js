"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function BrowseError({error, reset}){
    useEffect(() =>{
        console.error("Browse error:", error)
    },[error])

return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center max-w-md">
            <div className="text-6x1 mb-6">⚠️</div>
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-zinc-400 mb-8">
                We couldn&apost loas the page. This might be a temporary issue.
            </p>
            <div className="flex gap-4 justify-center">
                <button
                    onClick={reset}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded transition-colors">
                        Try again
                    </button>
                    <Link 
                        href="/"
                        className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-6 py-3 rounded transition-colors">
                            Go Home
                        </Link>
            </div>
        </div>
    </main>
)
} 