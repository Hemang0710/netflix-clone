'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export default function PartnerCheckInCard({ partnership, onCheckInSuccess }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/partners/${partnership.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || null }),
      })

      if (res.ok) {
        setNote('')
        onCheckInSuccess?.()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const lastCheckInTime = partnership.lastCheckIn
    ? new Date(partnership.lastCheckIn).toLocaleString()
    : 'Never'

  return (
    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
      <div>
        <h3 className="font-semibold">{partnership.partnerName}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Last check-in: {lastCheckInTime}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm rounded px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={14} />
          {submitting ? 'Checking in...' : 'Check In'}
        </button>
      </form>
    </div>
  )
}
