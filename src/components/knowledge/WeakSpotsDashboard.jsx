'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, TrendingDown, Clock, BookOpen } from 'lucide-react'
import { getMasteryColor, getMasteryLabel } from '@/lib/masteryHelpers'

export default function WeakSpotsDashboard() {
  const [weakSpots, setWeakSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConcept, setSelectedConcept] = useState(null)

  useEffect(() => {
    const fetchWeakSpots = async () => {
      try {
        const res = await fetch('/api/concepts/weak-spots')
        if (res.ok) {
          const { weakSpots: ws } = await res.json()
          setWeakSpots(ws || [])
        }
      } catch (error) {
        console.error('Error fetching weak spots:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeakSpots()
  }, [])

  const getWeaknessIcon = (reason) => {
    switch (reason) {
      case 'insufficient_practice':
        return <BookOpen className="w-4 h-4 text-amber-500" />
      case 'rapid_forgetting':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'never_reviewed':
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-zinc-400" />
    }
  }

  const getWeaknessMessage = (reason) => {
    switch (reason) {
      case 'insufficient_practice':
        return 'Needs more review sessions'
      case 'rapid_forgetting':
        return 'Forgetting too quickly'
      case 'never_reviewed':
        return 'Not reviewed yet'
      default:
        return 'Needs attention'
    }
  }

  const getWeaknessColor = (reason) => {
    switch (reason) {
      case 'insufficient_practice':
        return 'bg-amber-950/30 border-amber-800/40'
      case 'rapid_forgetting':
        return 'bg-red-950/30 border-red-800/40'
      case 'never_reviewed':
        return 'bg-orange-950/30 border-orange-800/40'
      default:
        return 'bg-zinc-700/30 border-zinc-600/30'
    }
  }

  if (loading) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="text-zinc-300 text-sm">Analyzing your weak spots...</p>
      </div>
    )
  }

  if (weakSpots.length === 0) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Weak Spots Dashboard</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm mb-2">✨ Great job! No weak spots detected.</p>
          <p className="text-zinc-500 text-xs">Keep learning to maintain your momentum</p>
        </div>
      </div>
    )
  }

  const topWeakSpots = weakSpots.slice(0, 3)

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-white">Weak Spots Dashboard</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Concepts requiring immediate attention to prevent knowledge decay
        </p>
      </div>

      {/* Top Weak Spots */}
      <div className="space-y-3">
        {topWeakSpots.map((concept, i) => (
          <div
            key={concept.id}
            className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-all hover:border-opacity-100 ${getWeaknessColor(concept.weaknessReason)}`}
            onClick={() => setSelectedConcept(selectedConcept?.id === concept.id ? null : concept)}
            style={{ animation: `slideIn 0.3s ease forwards`, animationDelay: `${i * 100}ms`, opacity: 0 }}
          >
            {/* Concept Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getWeaknessIcon(concept.weaknessReason)}
                  <h4 className="font-semibold text-white truncate">{concept.concept}</h4>
                </div>
                <p className="text-xs text-zinc-400">{getWeaknessMessage(concept.weaknessReason)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-red-400">{Math.round(concept.masteryScore)}</p>
                <p className="text-xs text-zinc-500">mastery</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-zinc-800/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                style={{ width: `${concept.masteryScore}%` }}
              ></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs border-t border-zinc-700/50 pt-3">
              <div>
                <p className="text-zinc-500">Reviews</p>
                <p className="font-semibold text-zinc-300">{concept.reviewCount || 0}</p>
              </div>
              <div>
                <p className="text-zinc-500">Interval</p>
                <p className="font-semibold text-zinc-300">{concept.interval || 1}d</p>
              </div>
              <div>
                <p className="text-zinc-500">Due In</p>
                <p className="font-semibold text-zinc-300">
                  {concept.daysUntilDue > 0 ? `${concept.daysUntilDue}d` : 'Now'}
                </p>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedConcept?.id === concept.id && (
              <div className="border-t border-zinc-700/50 pt-3 space-y-2 text-xs">
                <div className="bg-zinc-800/40 rounded p-2">
                  <p className="text-zinc-400 mb-1">Why this is weak:</p>
                  <p className="text-zinc-300">
                    {concept.weaknessReason === 'insufficient_practice' &&
                      'You haven\'t reviewed this concept enough times yet. More repetition will strengthen your memory.'}
                    {concept.weaknessReason === 'rapid_forgetting' &&
                      'Your recall score has been declining. This concept needs more focused review sessions.'}
                    {concept.weaknessReason === 'never_reviewed' &&
                      'You haven\'t reviewed this yet. Start with a review session to build a foundation.'}
                  </p>
                </div>
                <button className="w-full px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded border border-red-700/50 transition-colors font-semibold text-xs">
                  Review Now →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {weakSpots.length > 3 && (
        <div className="bg-zinc-700/20 border border-zinc-600/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-zinc-300 mb-2">Total Weak Spots: {weakSpots.length}</p>
          <p className="text-xs text-zinc-400">
            Focus on your top 3 this week to make the most impact on your learning
          </p>
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
