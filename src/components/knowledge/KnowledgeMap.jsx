'use client'

import { useEffect, useState } from 'react'
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, BookOpen } from 'lucide-react'
import { getMasteryTierColor } from '@/lib/masteryHelpers'

export default function KnowledgeMap() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, mastered: 0, developing: 0 })

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await fetch('/api/concepts')
        if (res.ok) {
          const { concepts } = await res.json()
          processConceptsForTreemap(concepts)
        }
      } catch (error) {
        console.error('Error fetching concepts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [])

  const processConceptsForTreemap = (concepts) => {
    if (!concepts.length) return

    // Group by content
    const grouped = {}
    let mastered = 0
    let developing = 0

    concepts.forEach((c) => {
      const contentTitle = c.content?.title || 'Uncategorized'
      if (!grouped[contentTitle]) {
        grouped[contentTitle] = []
      }
      grouped[contentTitle].push({
        name: c.concept,
        value: Math.max(1, c.reviewCount || 5),
        masteryScore: c.masteryScore || 0,
        id: `${c.id}`,
      })

      if (c.masteryScore >= 80) mastered++
      else if (c.masteryScore < 60) developing++
    })

    // Create treemap data structure
    const treemapData = Object.entries(grouped).map(([title, children]) => ({
      name: title,
      children: children,
    }))

    setData(treemapData)
    setStats({
      total: concepts.length,
      mastered,
      developing,
    })
  }

  if (loading) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="text-zinc-300 text-sm">Generating your knowledge map...</p>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Knowledge Map</h3>
        </div>
        <p className="text-zinc-400 text-sm text-center py-12">
          Start learning to visualize your knowledge map
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Personal Knowledge Map</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Visual representation of all concepts learned (size = review count, color = mastery level)
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-700/40 rounded-lg p-3 border border-zinc-600/50">
            <p className="text-xs text-zinc-400 mb-1">Total Concepts</p>
            <p className="text-lg font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-zinc-700/40 rounded-lg p-3 border border-zinc-600/50">
            <p className="text-xs text-zinc-400 mb-1">Mastered</p>
            <p className="text-lg font-bold text-green-400">{stats.mastered}</p>
          </div>
          <div className="bg-zinc-700/40 rounded-lg p-3 border border-zinc-600/50">
            <p className="text-xs text-zinc-400 mb-1">Need Practice</p>
            <p className="text-lg font-bold text-amber-400">{stats.developing}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50 overflow-auto" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            stroke="#27272a"
            fill="#09090b"
            aspectRatio={16 / 9}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: '#e4e4e7',
              }}
              formatter={(value) => [`Review Count: ${value}`, 'Size']}
              labelFormatter={(label) => `Concept: ${label}`}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-zinc-700 pt-4">
        <p className="text-xs text-zinc-400 mb-3">Mastery Scale:</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-xs text-zinc-300">Mastered (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-xs text-zinc-300">Proficient (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-xs text-zinc-300">Developing (40-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-xs text-zinc-300">Beginning (&lt;40)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
