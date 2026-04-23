import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"

export async function GET(request) {
  try {
    // Rate limit search — prevent scraping
    const { success } = await checkRateLimit(request, "api")
    if (!success) {
      return NextResponse.json({ success: false }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, message: "Query too short" },
        { status: 400 }
      )
    }

    // Clean query — convert to tsquery format
    const cleanQuery = query
      .split(/\s+/)
      .filter(Boolean)
      .map(word => `${word}:*`)   // :* enables prefix matching
      .join(" & ")                // AND between words

    // Raw SQL for full-text search with ranking
    const results = await prisma.$queryRaw`
      SELECT
        id,
        title,
        description,
        genre,
        "thumbnailUrl",
        "isFree",
        price,
        views,
        "createdAt",
        ts_rank(
          to_tsvector(
            'english',
            coalesce(title, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(transcript, '') || ' ' ||
            coalesce(genre, '')
          ),
          to_tsquery('english', ${cleanQuery})
        ) AS rank
      FROM "Content"
      WHERE
        status = 'ready'
        AND to_tsvector(
          'english',
          coalesce(title, '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce(transcript, '') || ' ' ||
          coalesce(genre, '')
        ) @@ to_tsquery('english', ${cleanQuery})
      ORDER BY rank DESC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      query,
    })

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}