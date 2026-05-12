'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ProfileSettingsForm({ initialProfile = {} }) {
  const [username, setUsername] = useState(initialProfile.username || '')
  const [isPublic, setIsPublic] = useState(initialProfile.isPublic ?? false)
  const [showHeatmap, setShowHeatmap] = useState(initialProfile.showHeatmap ?? true)
  const [showBadges, setShowBadges] = useState(initialProfile.showBadges ?? true)
  const [showCurrentVideos, setShowCurrentVideos] = useState(initialProfile.showCurrentVideos ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || undefined,
          isPublic,
          showHeatmap,
          showBadges,
          showCurrentVideos,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const publicUrl = username ? `/profile/${username}` : null

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.origin + publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="your-username"
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          3-30 characters, lowercase letters, numbers, and hyphens
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isPublic" className="text-sm font-medium">
            Make my profile public
          </label>
        </div>

        {isPublic && publicUrl && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Your public profile URL:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded flex-1 break-all">
                {window.location.origin}
                {publicUrl}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {isPublic && (
        <div className="space-y-3 pl-6 border-l-2 border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <input
              id="showHeatmap"
              type="checkbox"
              checked={showHeatmap}
              onChange={e => setShowHeatmap(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showHeatmap" className="text-sm">
              Show activity heatmap
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="showBadges"
              type="checkbox"
              checked={showBadges}
              onChange={e => setShowBadges(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showBadges" className="text-sm">
              Show earned badges
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="showCurrentVideos"
              type="checkbox"
              checked={showCurrentVideos}
              onChange={e => setShowCurrentVideos(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showCurrentVideos" className="text-sm">
              Show videos currently learning
            </label>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="text-sm text-green-600 dark:text-green-400">Profile updated!</div>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
