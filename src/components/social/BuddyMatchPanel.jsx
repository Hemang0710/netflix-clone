'use client'

import { useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'

export default function BuddyMatchPanel({ contentId, onClose }) {
  const [peers, setPeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    const fetchPeers = async () => {
      try {
        const res = await fetch(`/api/buddy/active?contentId=${contentId}`)
        if (res.ok) {
          const data = await res.json()
          setPeers(data.peers || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPeers()
  }, [contentId])

  const handleInvite = async (receiverId) => {
    setInvitingId(receiverId)
    try {
      const res = await fetch('/api/buddy/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, receiverId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.sessionId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Find a Study Buddy</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>

        {sessionId ? (
          <div className="text-center space-y-3">
            <div className="text-green-600 dark:text-green-400">✓ Buddy invite sent!</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              They'll see a notification and can accept to start watching together.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : loading ? (
          <div>Loading peers...</div>
        ) : peers.length === 0 ? (
          <div className="text-center text-slate-600 dark:text-slate-400 py-4">
            No one else watching right now. Try again in a moment!
          </div>
        ) : (
          <div className="space-y-3">
            {peers.map(peer => (
              <div
                key={peer.userId}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded"
              >
                <div className="flex items-center gap-2">
                  {peer.avatarUrl ? (
                    <img src={peer.avatarUrl} alt={peer.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                  <span>{peer.name}</span>
                </div>
                <button
                  onClick={() => handleInvite(peer.userId)}
                  disabled={invitingId === peer.userId}
                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
