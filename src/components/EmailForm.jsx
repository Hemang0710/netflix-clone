"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EmailForm() {
    const [email, setEmail] = useState("")
    const router = useRouter()

    function handleSubmit(e) {
        e.preventDefault()
        // Pass email to register page as URL param
        router.push(`/register?email=${encodeURIComponent(email)}`)
    }

    return (
        <form 
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-2x1">
            
            <input 
              type = "email"
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="flex-1 px-5 py-4 rounded text-white bg-black/60 border border-zinc-600 placeholder-zinc-400 focus:outline-none focus:border-white text-base backdrop-blur-sm"
              />
              <button 
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded text-base transition-colors whitespace-nowrap flex items-center gap-2"
              >
                Get Started ,
              </button>
            </form>
    )
}