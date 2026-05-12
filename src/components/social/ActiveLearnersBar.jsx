'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

export default function ActiveLearnersBar({ contentId }) {
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    const registerPresence = async () => {
      try {
        const res = await fetch(`/api/buddy/active?contentId=${contentId}`)
        if (res.ok) {
          const data = await res.json()
          setActiveCount(data.activeCount)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    registerPresence()
    const interval = setInterval(registerPresence, 30000)
    return () => clearInterval(interval)
  }, [contentId])

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm"
      >
        <Users size={16} />
        <span>{loading ? '-' : activeCount}</span>
        <span>learning now</span>
      </button>

      {showPanel && (
        <BuddyMatchPanel contentId={contentId} onClose={() => setShowPanel(false)} />
      )}
    </>
  )
}
