"use client"

import { createContext, useContext, useState, useEffect } from "react"

const WatchlistContext = createContext(null)

export function WatchlistProvider ({children}) {
    const [watchlist, setWatchlist] = useState([]) //array of tmdbIds

    //Load watchlist when app starts
    useEffect(()=> {
        async function loadWatchlist(){
            try {
                const res = await fetch("/api/watchlist")
                if(res.ok){
                    const data = await res.json()
                    setWatchlist(data.data || [])
                }
            } catch (error){
                console.error("Failed to load watchlist:", error)
            }
        }
        loadWatchlist()
    },[])

    async function addToWatchlist(movie) {
        //OPTIMISTIC - update UI immediately
    setWatchlist(prev => [...prev,movie.id])
    
    try{
        const res = await fetch("/api/watchlist",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body:JSON.stringify({
                tmdbId: movie.id,
                title: movie.title,
                posterPath: movie.poster_path,
            }),
        })
        if(!res.ok) {
            //REVERT if API failed
            setWatchlist(prev => prev.filter(id => id !== movie.id))
        }
    } catch {
        //REVERT on network error
        setWatchlist(prev=> prev.filter(id => id !== movie.id))
    }
    }

    async function removeFromWatchlist(tmdbId) {
        //OPTIMSTIC - remove immediately
        setWatchlist(prev => prev.filter(id => id !== tmdbId))

        try{
            const res = await fetch("/api/watchlist",{
                method: "DELETE",
                headers: {"content-Type": "application/json"},
                body: JSON.stringify({tmdbId}),
            })

            if(!res.ok){
                //REVERT if API failed
                setWatchlist(prev => [...prev,tmdbId])
            }
        } catch {
            //REVERT on network error
            setWatchlist(prev => [...prev,tmdbId])
        }
    }

    function isInWatchlist(tmdbId){
        return watchlist.includes(tmdbId)
    }

    return(
        <WatchlistContext.Provider value={{
            watchlist,
            addToWatchlist,
            removeFromWatchlist,
            isInWatchlist,
        }}>
            {children}
        </WatchlistContext.Provider>
    )
}

//Custom hook - clean way to use this context

export function useWatchlist() {
    const context = useContext(WatchlistContext)
    if (!context){
        throw new Error("useWatchlist must be used inside WatchlistProvider")
    }

    return context
}