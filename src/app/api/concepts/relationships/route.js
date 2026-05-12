import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all concepts with their content IDs
    const concepts = await prisma.conceptMastery.findMany({
      where: { userId: user.userId },
      include: {
        content: {
          select: { id: true },
        },
      },
      orderBy: { masteryScore: 'desc' },
    })

    if (concepts.length === 0) {
      return NextResponse.json({ nodes: [], edges: [] })
    }

    // Create nodes
    const nodes = concepts.map((c) => ({
      id: `${c.id}`,
      concept: c.concept,
      masteryScore: c.masteryScore || 0,
      reviewCount: c.reviewCount || 0,
    }))

    // Create edges from co-occurrence (concepts in same content)
    const edges = []
    const edgeSet = new Set()

    // Group concepts by content
    const contentGroups = {}
    concepts.forEach((c) => {
      const contentId = c.contentId
      if (!contentGroups[contentId]) {
        contentGroups[contentId] = []
      }
      contentGroups[contentId].push(c.id)
    })

    // Create edges between concepts in the same content
    Object.values(contentGroups).forEach((conceptIds) => {
      if (conceptIds.length > 1) {
        for (let i = 0; i < conceptIds.length; i++) {
          for (let j = i + 1; j < conceptIds.length; j++) {
            // Sort to avoid duplicates
            const [from, to] = [conceptIds[i], conceptIds[j]].sort()
            const edgeKey = `${from}-${to}`
            if (!edgeSet.has(edgeKey)) {
              edgeSet.add(edgeKey)
              edges.push({
                from: `${from}`,
                to: `${to}`,
                weight: 1,
              })
            }
          }
        }
      }
    })

    return NextResponse.json({
      nodes,
      edges,
    })
  } catch (error) {
    console.error('GET /api/concepts/relationships error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
