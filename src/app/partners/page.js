'use client'

import { useEffect, useState } from 'react'
import PartnerCheckInCard from '@/components/social/PartnerCheckInCard'

export default function AccountabilityPartnersPage() {
  const [partnerships, setPartnerships] = useState([])
  const [receiverEmail, setReceiverEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPartnerships()
  }, [])

  const fetchPartnerships = async () => {
    try {
      const res = await fetch('/api/partners')
      if (res.ok) {
        const data = await res.json()
        setPartnerships(data.partnerships || [])
      }
    } catch (err) {
      setError('Failed to load partnerships')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async e => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!receiverEmail) {
      setError('Please enter an email address')
      return
    }

    try {
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()

      const receiverRes = await fetch(`/api/auth/me`)
      const receiver = { userId: 1 }

      const res = await fetch('/api/partners/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: receiver.userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send request')
        return
      }

      setSuccess(true)
      setReceiverEmail('')
      setTimeout(() => setSuccess(false), 3000)
      fetchPartnerships()
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  const activePartnerships = partnerships.filter(p => p.status === 'active')
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">👥 Accountability Partners</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Partners</h2>
          {loading ? (
            <div>Loading...</div>
          ) : activePartnerships.length === 0 ? (
            <div className="text-slate-600 dark:text-slate-400">
              No active partners yet. Find someone to pair with!
            </div>
          ) : (
            <div className="space-y-4">
              {activePartnerships.map(p => (
                <PartnerCheckInCard
                  key={p.id}
                  partnership={p}
                  onCheckInSuccess={fetchPartnerships}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Find a Partner</h2>
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Partner's Email
              </label>
              <input
                id="email"
                type="email"
                value={receiverEmail}
                onChange={e => setReceiverEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
            {success && <div className="text-sm text-green-600 dark:text-green-400">Request sent!</div>}

            <button
              type="submit"
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Send Partner Request
            </button>
          </form>

          {pendingPartnerships.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Pending Requests</h3>
              <div className="space-y-2">
                {pendingPartnerships.map(p => (
                  <div key={p.id} className="text-sm p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {p.partnerName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
