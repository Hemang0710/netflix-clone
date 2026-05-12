'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Loader2 } from 'lucide-react'
import { getForgettingCurve } from '@/lib/sm2'

const COLORS = {
  high: '#10b981', // green
  medium: '#f59e0b', // amber
  low: '#ef4444', // red
}

const getLineColor = (mastery) => {
  if (mastery >= 80) return COLORS.high
  if (mastery >= 50) return COLORS.medium
  return COLORS.low
}

export default function ForgettingCurveChart() {
  const [loading, setLoading] = useState(true)
  const [concepts, setConcepts] = useState([])

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await fetch('/api/concepts')
        if (res.ok) {
          const { concepts: c } = await res.json()
          // Only show top 8 concepts by review count
          setConcepts(c.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8))
        }
      } catch (error) {
        console.error('Error fetching concepts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-400px">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading forgetting curves...</p>
      </div>
    )
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h3 className="font-semibold text-gray-900 mb-4">Forgetting Curve</h3>
        <p className="text-gray-600 text-center py-12">Start reviewing concepts to see forgetting curves.</p>
      </div>
    )
  }

  // Generate chart data by computing forgetting curves for each concept
  const chartData = []
  for (let day = 0; day <= 30; day++) {
    const dataPoint = { day }
    concepts.forEach((c) => {
      const curve = getForgettingCurve(c.interval, c.easeFactor)
      const point = curve.find((p) => p.day === day)
      dataPoint[c.concept] = point ? point.retention : 0
    })
    chartData.push(dataPoint)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Forgetting Curve</h3>
        <p className="text-sm text-gray-600">
          Your predicted retention over time. Review before you drop below 70%.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            label={{ value: 'Days from now', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            formatter={(value) => `${Math.round(value)}%`}
          />
          <Legend />
          <ReferenceLine
            y={70}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: 'Review recommended', position: 'right', fill: '#f59e0b' }}
          />

          {concepts.map((concept) => (
            <Line
              key={concept.id}
              type="monotone"
              dataKey={concept.concept}
              stroke={getLineColor(concept.masteryScore)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.high }} />
          <span className="text-sm text-gray-600">High mastery (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.medium }} />
          <span className="text-sm text-gray-600">Medium mastery (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.low }} />
          <span className="text-sm text-gray-600">Low mastery (&lt;50%)</span>
        </div>
      </div>
    </div>
  )
}
