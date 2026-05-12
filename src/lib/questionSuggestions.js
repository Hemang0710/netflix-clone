/**
 * Generates relevant question suggestions based on video transcript and title
 * Uses content analysis to create context-aware questions
 */

const GENERIC_QUESTIONS = [
  "Summarize the key points",
  "What's the main concept?",
  "Explain this simply",
  "What should I remember?",
  "What are the key takeaways?",
]

/**
 * Extract key concepts from transcript
 * Looks for:
 * - Words in ALL CAPS (often emphasize concepts)
 * - Terms after "is", "called", "means"
 * - Repeated terms (frequency = importance)
 */
function extractKeyTerms(transcript) {
  if (!transcript || transcript.length < 100) return []

  const lines = transcript.split("\n").slice(0, 20) // First 20 lines
  const terms = new Set()

  lines.forEach(line => {
    // Extract ALL CAPS terms
    const capsMatches = line.match(/\b[A-Z]{2,}\b/g)
    if (capsMatches) capsMatches.forEach(t => terms.add(t))

    // Extract terms after "called", "is", "means"
    const defMatches = line.match(/(?:called|is|means|refers to|known as)\s+([A-Za-z\s]+?)(?:\.|,|$)/i)
    if (defMatches) terms.add(defMatches[1].trim())
  })

  return Array.from(terms).slice(0, 5)
}

/**
 * Generate questions based on video type/topic
 */
function generateContextQuestions(title, terms) {
  const questions = []

  // Q1: Definition/explanation question
  if (terms.length > 0) {
    questions.push(`What does "${terms[0]}" mean?`)
  } else {
    questions.push("Explain this concept")
  }

  // Q2: Application/implementation question
  if (title.toLowerCase().includes("how to") || title.toLowerCase().includes("tutorial")) {
    questions.push("How do I apply this practically?")
  } else if (title.toLowerCase().includes("why") || title.toLowerCase().includes("understanding")) {
    questions.push("Why is this important?")
  } else {
    questions.push("What's a real-world example?")
  }

  // Q3: Summary question
  questions.push("Summarize the main points")

  // Q4: Deeper dive
  if (terms.length > 1) {
    questions.push(`How does "${terms[0]}" relate to "${terms[1]}"?`)
  } else {
    questions.push("What else should I know about this?")
  }

  // Q5: Practice/assessment question
  questions.push("Give me a quiz question on this")

  return questions.filter((q, i, a) => a.indexOf(q) === i) // Remove duplicates
}

/**
 * Main function to generate suggestions
 */
export function generateQuestionSuggestions(videoTitle, videoTranscript) {
  // If no transcript, use generic questions based on title
  if (!videoTranscript || videoTranscript.length < 50) {
    return [
      `Explain "${videoTitle}"`,
      "What are the key points?",
      "Summarize this for me",
    ].filter(q => q.length > 0)
  }

  // Extract key terms from transcript
  const terms = extractKeyTerms(videoTranscript)

  // Generate context-aware questions
  const suggestions = generateContextQuestions(videoTitle, terms)

  // Return top 4 questions
  return suggestions.slice(0, 4)
}

/**
 * Generate a follow-up question based on previous user question
 */
export function generateFollowUpQuestions(lastUserQuestion, assistantResponse) {
  const followUps = [
    "Can you explain that differently?",
    "Give me a practical example",
    "How does this relate to the video?",
    "What's the next step?",
    "Tell me more about this",
  ]

  // Simple shuffle and return top 3
  return followUps.sort(() => Math.random() - 0.5).slice(0, 3)
}
