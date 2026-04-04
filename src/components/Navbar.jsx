"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Navbar (){
    const router = useRouter()
    const [loggingOut, setLoggingOut] = useState(false)
    const [userEmail, setUserEmail] = useState("")

    useEffect(() => {
        async function fetchUser() {
            try{
                const res = await fetch("/api/auth/me")
                if(res.ok){
                    const data = await res.json()
                    setUserEmail(data.email)
                }
            } catch(error){
                console.error("Failed to fetch user:", error)
            }
        }
        fetchUser()
    },[])

    async function handleLogout (){
        setLoggingOut(true)
        await fetch ("/api/auth/logout", {method: "POST"})
        router.push("/login")
        router.refresh()
    }

    //Get initials from email
    const initial = userEmail ? userEmail[0].toUpperCase() : "U"
    return (
        <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-12 py-4 bg-linear-to-b from-black/80 to-transparent">
            {/*Logo */}
            <Link href= "/browse" >
             <span className="text-red-600 text-3xl font-black tracking-tighter">
                NETFLIX
             </span>
            </Link>

            {/*Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
                <Link href="/browse" className="hover:text-white transition-colors">Home</Link>
                <Link href="/browse" className="hover:text-white transition-colors">TV Shows</Link>
                <Link href="/browse" className="hover:text-white transition-colors">Movies</Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white text-sm font-bold"
                title={userEmail}
                >
                    {initial}
                </div>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-zinc-300 hover:text-white text-sm transition-colors"
                >
                    {loggingOut ? "..." : "Sign Out"}
                </button>
            </div>
        </nav>
    )
}