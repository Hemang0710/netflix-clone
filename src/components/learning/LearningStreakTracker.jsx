'use client'

import { useEffect, useState } from 'react'
import { Loader2, Flame, Target, Zap } from 'lucide-react'

const MILESTONES = [
  { days: 7, label: '1 Week', icon: '🔥' },
  { days: 14, label: '2 Weeks', icon: '⚡' },
  { days: 30, label: '1 Month', icon: '🌟' },
  { days: 60, label: '2 Months', icon: '🏆' },
  { days: 100, label: '100 Days', icon: '👑' },
]

export default function LearningStreakTracker() {
  const [streaks, setStreaks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const res = await fetch('/api/streaks')
        if (res.ok) {
          const data = await res.json()
          setStreaks(data)
        }
      } catch (error) {
        console.error('Error fetching streaks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStreaks()
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8 flex flex-col items-center justify-center min-h-300px">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="text-zinc-300 text-sm">Loading your streak...</p>
      </div>
    )
  }

  if (!streaks) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Learning Streak</h3>
        </div>
        <p className="text-zinc-400 text-sm text-center py-12">
          Start reviewing concepts to build your streak
        </p>
      </div>
    )
  }

  const currentStreak = streaks.reviewStreak?.current || 0
  const bestStreak = streaks.reviewStreak?.best || 0
  const nextMilestoneIdx = MILESTONES.findIndex((m) => m.days > currentStreak)
  const nextMilestone = nextMilestoneIdx >= 0 ? MILESTONES[nextMilestoneIdx] : null
  const progressToNextMilestone = nextMilestone
    ? Math.min(100, (currentStreak / nextMilestone.days) * 100)
    : 100

  const unlockedMilestones = MILESTONES.filter((m) => currentStreak >= m.days)
  const upcomingMilestones = MILESTONES.filter((m) => currentStreak < m.days)

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-6 space-y-6">
      {/* Current Streak */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-white">Learning Streak Tracker</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Current Streak */}
          <div className="bg-linear-to-br from-red-950/40 to-orange-950/40 border border-red-900/40 rounded-lg p-4">
            <p className="text-xs text-zinc-400 mb-2">Current Streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-red-400">{currentStreak}</p>
              <p className="text-sm text-zinc-400">days</p>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Keep reviewing to maintain your streak
            </p>
          </div>

          {/* Best Streak */}
          <div className="bg-linear-to-br from-amber-950/40 to-yellow-950/40 border border-amber-900/40 rounded-lg p-4">
            <p className="text-xs text-zinc-400 mb-2">Best Streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-amber-400">{bestStreak}</p>
              <p className="text-sm text-zinc-400">days</p>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Your personal record
            </p>
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <div className="bg-zinc-700/30 border border-zinc-600/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300">Next Milestone</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-300">{nextMilestone.label}</span>
              <span className="text-lg">{nextMilestone.icon}</span>
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-lineaz-to-r from-red-600 to-orange-500 transition-all duration-300"
              style={{ width: `${progressToNextMilestone}%` }}
            ></div>
          </div>
          <p className="text-xs text-zinc-400">
            {nextMilestone.days - currentStreak} days to unlock {nextMilestone.label}
          </p>
        </div>
      )}

      {/* Unlocked Milestones */}
      {unlockedMilestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-300 uppercase">Achievements Unlocked</p>
          <div className="grid grid-cols-2 gap-2">
            {unlockedMilestones.map((m) => (
              <div
                key={m.days}
                className="flex items-center gap-2 px-3 py-2 bg-green-950/30 border border-green-800/40 rounded-lg"
                style={{ animation: `slideIn 0.4s ease forwards` }}
              >
                <span className="text-xl">{m.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-400">{m.label}</p>
                  <p className="text-xs text-zinc-500">Unlocked</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-300 uppercase">Upcoming Challenges</p>
          <div className="grid grid-cols-2 gap-2">
            {upcomingMilestones.slice(0, 4).map((m) => (
              <div
                key={m.days}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-700/20 border border-zinc-600/30 rounded-lg opacity-60"
              >
                <span className="text-xl grayscale">{m.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-400">{m.label}</p>
                  <p className="text-xs text-zinc-600">{m.days} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
