'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { daysUntilDue } from '@/lib/sm2'

export default function ConceptMasteryList() {
  const [loading, setLoading] = useState(true)
  const [concepts, setConcepts] = useState([])

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await fetch('/api/concepts')
        if (res.ok) {
          const { concepts: c } = await res.json()
          setConcepts(c.sort((a, b) => a.dueDate - b.dueDate))
        }
      } catch (error) {
        console.error('Error fetching concepts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [])

  const getMasteryColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getMasteryLabel = (score) => {
    if (score >= 80) return 'Mastered'
    if (score >= 60) return 'Proficient'
    if (score >= 40) return 'Developing'
    return 'Beginning'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-300px">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading concepts...</p>
      </div>
    )
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h3 className="font-semibold text-gray-900 mb-4">Concept Mastery</h3>
        <p className="text-gray-600 text-center py-12">Start watching videos to track concept mastery.</p>
      </div>
    )
  }

  const dueConceptsCount = concepts.filter((c) => daysUntilDue(new Date(c.dueDate)) <= 0).length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Concept Mastery</h3>
          <p className="text-sm text-gray-600 mt-1">
            {dueConceptsCount} due for review • {concepts.length} total concepts
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {concepts.map((concept) => {
          const daysDue = daysUntilDue(new Date(concept.dueDate))
          const isOverdue = daysDue <= 0
          const daysUntil = Math.abs(daysDue)

          return (
            <div
              key={concept.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              {/* Concept name */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{concept.concept}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {getMasteryLabel(concept.masteryScore)}
                  </span>
                  {concept.masteryScore > (concept.lastScore || 0) && (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  )}
                  {concept.masteryScore < (concept.lastScore || 0) && (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                </div>
              </div>

              {/* Mastery score bar */}
              <div className="hidden sm:block flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getMasteryColor(concept.masteryScore)}`}
                    style={{ width: `${concept.masteryScore}%` }}
                  />
                </div>
              </div>

              {/* Score number */}
              <div className="text-right">
                <p className="font-semibold text-gray-900">{Math.round(concept.masteryScore)}</p>
                <p className="text-xs text-gray-500">/ 100</p>
              </div>

              {/* Due status */}
              <div className="text-right text-xs">
                {isOverdue ? (
                  <div className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Due now</span>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Due in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(concepts.filter((c) => c.masteryScore >= 80).length / concepts.length * 100)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Mastered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{concepts.length}</p>
            <p className="text-xs text-gray-600 mt-1">Total Concepts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {concepts.reduce((sum, c) => sum + c.reviewCount, 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Reviews Done</p>
          </div>
        </div>
      </div>
    </div>
  )
}
