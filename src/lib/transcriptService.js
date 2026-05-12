// src/lib/transcriptService.js
import prisma from "@/lib/prisma"

/**
 * Transcript generation fallback strategies when generation fails
 * 1. Use existing transcript from DB
 * 2. Generate summary from description
 * 3. Return empty/placeholder for AI to work with context from title
 */

export async function getOrGenerateTranscript(contentId) {
  try {
    // Step 1: Check if transcript exists
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { 
        transcript: true, 
        title: true, 
        description: true, 
        aiSummary: true,
        status: true
      },
    })

    if (!content) {
      throw new Error(`Content ${contentId} not found`)
    }

    // Step 2: Return existing transcript if available
    if (content.transcript && content.transcript.length > 100) {
      return {
        success: true,
        source: "database",
        transcript: content.transcript,
        contentId,
      }
    }

    // Step 3: Fallback 1 - Use AI summary if available
    if (content.aiSummary && content.aiSummary.length > 50) {
      return {
        success: true,
        source: "ai_summary_fallback",
        transcript: `[AI Summary]\n${content.aiSummary}`,
        contentId,
      }
    }

    // Step 4: Fallback 2 - Use description as transcript backup
    if (content.description && content.description.length > 50) {
      return {
        success: true,
        source: "description_fallback",
        transcript: `[Content Description]\n${content.description}`,
        contentId,
      }
    }

    // Step 5: Fallback 3 - Minimal context with title only
    // AI can still answer questions using title as context
    return {
      success: true,
      source: "title_only_fallback",
      transcript: `[Video Title]\n${content.title}\n\nNote: Full transcript unavailable. AI will answer based on title and general knowledge.`,
      contentId,
      isMinimalContext: true,
    }

  } catch (error) {
    console.error("❌ Transcript retrieval error:", error.message)
    
    // Final fallback: return minimal context with error info
    return {
      success: false,
      source: "error_fallback",
      transcript: "[Transcript unavailable - AI will provide general assistance based on available context]",
      contentId,
      error: error.message,
    }
  }
}

/**
 * Check transcript generation status and return appropriate context
 */
export async function getTranscriptContext(contentId) {
  const result = await getOrGenerateTranscript(contentId)
  
  // Log the fallback strategy for monitoring
  if (result.source !== "database") {
    console.warn(`⚠️ Using ${result.source} for content ${contentId}`)
  }

  return result
}

/**
 * Batch process transcripts for multiple contents
 * Useful for dashboard pre-loading
 */
export async function getTranscriptsForContents(contentIds) {
  return Promise.all(
    contentIds.map(id => getOrGenerateTranscript(id))
  )
}
