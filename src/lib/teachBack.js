// Teach-back (Feynman) mode: the user explains a concept in their own words
// as if teaching someone else, and AI grades the explanation on the Feynman
// dimensions — accuracy, completeness, simplicity — surfacing knowledge gaps
// and unexplained jargon. Scores feed the same SM-2 queue (ConceptMastery)
// that daily review uses.
import { aiClient } from "@/lib/openai"
import { parseAIJson } from "@/lib/aiJson"

export const MIN_EXPLANATION_CHARS = 40
export const MAX_EXPLANATION_CHARS = 5000
const MAX_LIST_ITEMS = 5

export const AUDIENCES = {
  child: "a curious 12-year-old with no background in the subject",
  beginner: "a motivated beginner encountering this topic for the first time",
  expert: "a skeptical expert probing for shallow understanding",
}

const AI_MODEL =
  process.env.AI_PROVIDER === "openai"
    ? "gpt-4o-mini"
    : process.env.AI_PROVIDER === "gemini"
      ? "gemini-2.0-flash"
      : "llama-3.3-70b-versatile"

const clampScore = (n) => Math.min(Math.max(Math.round(Number(n) || 0), 0), 100)

const toStringList = (value) =>
  (Array.isArray(value) ? value : [])
    .filter((s) => typeof s === "string" && s.trim())
    .slice(0, MAX_LIST_ITEMS)
    .map((s) => s.trim().slice(0, 300))

/**
 * Map a 0-100 teach-back score onto SM-2 quality (0=Again … 3=Easy),
 * consistent with how daily-review self-ratings drive scheduling.
 */
export function scoreToQuality(score) {
  if (score >= 85) return 3
  if (score >= 65) return 2
  if (score >= 40) return 1
  return 0
}

/**
 * Grade a Feynman-style explanation with AI.
 * @returns {{ score, accuracy, completeness, simplicity, feedback, gaps, jargon, followUp }}
 * @throws {Error} when the model returns nothing parseable
 */
export async function gradeExplanation({ concept, definition, audience = "beginner", explanation }) {
  const audienceDesc = AUDIENCES[audience] || AUDIENCES.beginner

  const completion = await aiClient.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You grade Feynman-technique teaching attempts. A learner explains a concept in their own words; you assess whether they truly understand it. Be encouraging but honest — vague hand-waving and recited jargon signal gaps, not mastery.
Always respond with valid JSON only — no prose, no markdown fences.`,
      },
      {
        role: "user",
        content: `The learner is teaching this concept to ${audienceDesc}.

Concept: ${concept}
${definition ? `Reference definition: ${definition}\n` : ""}
Learner's explanation:
"""
${explanation.slice(0, MAX_EXPLANATION_CHARS)}
"""

Return ONLY this JSON shape:
{
  "accuracy": 0-100,        // is what they said actually correct?
  "completeness": 0-100,    // did they cover the essential ideas?
  "simplicity": 0-100,      // could the stated audience follow it? analogies/examples score high, unexplained jargon scores low
  "score": 0-100,           // overall Feynman grade weighing the three above
  "feedback": "2-3 sentence coaching note: what landed well, what to sharpen",
  "gaps": ["specific missing or wrong idea the learner should revisit"],
  "jargon": ["technical term used without explanation"],
  "followUp": "one probing question the audience would ask that tests the weakest part of this explanation"
}

Rules:
- gaps and jargon: max ${MAX_LIST_ITEMS} items each, empty arrays if none
- an explanation that just restates the definition verbatim is NOT understanding — cap simplicity at 40
- feedback speaks directly to the learner ("You explained X well…")`,
      },
    ],
    max_tokens: 700,
    temperature: 0.3,
  })

  const parsed = parseAIJson(completion.choices[0]?.message?.content, null)
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI grading failed — please try submitting again")
  }

  const accuracy = clampScore(parsed.accuracy)
  const completeness = clampScore(parsed.completeness)
  const simplicity = clampScore(parsed.simplicity)
  const score = clampScore(
    parsed.score ?? Math.round(accuracy * 0.4 + completeness * 0.3 + simplicity * 0.3)
  )

  return {
    score,
    accuracy,
    completeness,
    simplicity,
    feedback: typeof parsed.feedback === "string" ? parsed.feedback.trim().slice(0, 1000) : null,
    gaps: toStringList(parsed.gaps),
    jargon: toStringList(parsed.jargon),
    followUp: typeof parsed.followUp === "string" ? parsed.followUp.trim().slice(0, 500) : null,
  }
}
