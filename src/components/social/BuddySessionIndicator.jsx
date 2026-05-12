'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

export default function BuddySessionIndicator({ sessionId, contentId }) {
  const [buddyInfo, setBuddyInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBuddyInfo = async () => {
      try {
        const res = await fetch(`/api/buddy/${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setBuddyInfo(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBuddyInfo()
    const interval = setInterval(fetchBuddyInfo, 10000)
    return () => clearInterval(interval)
  }, [sessionId])

  if (loading || !buddyInfo) return null

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
      <div className="flex items-center gap-2 mb-2">
        <Users size={16} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium">Watching with buddy</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        🎬 {formatTime(buddyInfo.partnerTimestamp)} / {formatTime(buddyInfo.myTimestamp)}
      </p>
    </div>
  )
}
