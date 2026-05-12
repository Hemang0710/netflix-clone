'use client'

import { useEffect, useState } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { getMasteryColor } from '@/lib/masteryHelpers'

export default function ConceptRelationshipGraph() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const res = await fetch('/api/concepts/relationships')
        if (res.ok) {
          const data = await res.json()
          setGraphData(data)
        }
      } catch (error) {
        console.error('Error fetching relationships:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelationships()
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="text-zinc-300 text-sm">Building relationship graph...</p>
      </div>
    )
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Concept Relationships</h3>
        </div>
        <p className="text-zinc-400 text-sm text-center py-12">
          Learn more concepts to see their connections
        </p>
      </div>
    )
  }

  const nodes = graphData.nodes || []
  const edges = graphData.edges || []

  // Arrange nodes in a circle
  const circleRadius = 150
  const centerX = 250
  const centerY = 250

  const nodePositions = nodes.map((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2
    return {
      ...node,
      x: centerX + circleRadius * Math.cos(angle),
      y: centerY + circleRadius * Math.sin(angle),
      size: Math.max(20, Math.min(40, (node.reviewCount || 5) + 10)),
    }
  })

  const getMasteryColorHex = (score) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Concept Relationship Graph</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Connected concepts from your learning journey (node size = review frequency)
        </p>
      </div>

      <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 overflow-auto flex items-center justify-center" style={{ height: '500px' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 500 500"
          style={{ minHeight: '500px', minWidth: '500px' }}
        >
          {/* Draw edges first (behind nodes) */}
          {edges.map((edge, i) => {
            const fromNode = nodePositions.find((n) => n.id === edge.from)
            const toNode = nodePositions.find((n) => n.id === edge.to)

            if (!fromNode || !toNode) return null

            return (
              <line
                key={`edge-${i}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#52525b"
                strokeWidth="1"
                opacity="0.5"
              />
            )
          })}

          {/* Draw nodes */}
          {nodePositions.map((node) => (
            <g key={`node-${node.id}`}>
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={getMasteryColorHex(node.masteryScore)}
                opacity="0.8"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />

              {/* Outer ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill="none"
                stroke={getMasteryColorHex(node.masteryScore)}
                strokeWidth="2"
                opacity="0.4"
              />

              {/* Label - positioned above node */}
              <text
                x={node.x}
                y={node.y - node.size - 12}
                textAnchor="middle"
                className="select-none"
                style={{
                  fontSize: '10px',
                  fill: '#e4e4e7',
                  fontWeight: '500',
                  pointerEvents: 'none',
                }}
              >
                {node.concept.length > 12 ? node.concept.substring(0, 12) + '...' : node.concept}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="border-t border-zinc-700 pt-4">
        <p className="text-xs font-semibold text-zinc-300 uppercase mb-2">How to read this graph</p>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• <span className="text-zinc-300">Node size</span> = how much you've reviewed the concept</li>
          <li>• <span className="text-zinc-300">Node color</span> = mastery level (green = mastered, red = beginning)</li>
          <li>• <span className="text-zinc-300">Connection lines</span> = concepts learned in the same video</li>
        </ul>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-zinc-700/20 border border-zinc-600/30 rounded p-2">
          <p className="text-zinc-400">Total Concepts</p>
          <p className="font-bold text-white text-sm">{nodes.length}</p>
        </div>
        <div className="bg-zinc-700/20 border border-zinc-600/30 rounded p-2">
          <p className="text-zinc-400">Relationships</p>
          <p className="font-bold text-white text-sm">{edges.length}</p>
        </div>
      </div>
    </div>
  )
}
