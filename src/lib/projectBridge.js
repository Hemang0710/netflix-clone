// Learn-to-do bridges: when a cluster of related concepts hits mastery, we
// generate a small real-world project brief that exercises those exact
// concepts, broken into checkpoints with acceptance criteria. The learner
// submits what they built at each checkpoint and AI reviews it against the
// criteria — closing the "watched everything, built nothing" gap.
import prisma from "@/lib/prisma"
import { aiClient } from "@/lib/openai"
import { parseAIJson } from "@/lib/aiJson"

export const MASTERY_THRESHOLD = 65 // a concept counts as mastered at this score
export const MIN_CLUSTER_SIZE = 3 // mastered concepts needed before a bridge unlocks
export const PASS_SCORE = 70 // checkpoint submissions at/above this pass
export const MIN_SUBMISSION_CHARS = 40
export const MAX_SUBMISSION_CHARS = 8000
export const STANDALONE_KEY = "standalone"
export const STANDALONE_LABEL = "Self-directed learning"

const MIN_CHECKPOINTS = 3
const MAX_CHECKPOINTS = 5
const DIFFICULTIES = new Set(["starter", "intermediate", "ambitious"])

const AI_MODEL =
  process.env.AI_PROVIDER === "openai"
    ? "gpt-4o-mini"
    : process.env.AI_PROVIDER === "gemini"
      ? "gemini-2.0-flash"
      : "llama-3.3-70b-versatile"

const clampScore = (n) => Math.min(Math.max(Math.round(Number(n) || 0), 0), 100)
const cleanString = (value, max) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null

const parseList = (json) => {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** Serialize a ProjectBrief row (with checkpoints included) for API responses. */
export const briefToJson = (b) => ({
  id: b.id,
  clusterKey: b.clusterKey,
  clusterLabel: b.clusterLabel,
  title: b.title,
  pitch: b.pitch,
  deliverable: b.deliverable,
  difficulty: b.difficulty,
  estimatedHours: b.estimatedHours,
  concepts: parseList(b.concepts),
  status: b.status,
  createdAt: b.createdAt,
  completedAt: b.completedAt,
  checkpoints: (b.checkpoints || []).map((cp) => ({
    id: cp.id,
    order: cp.order,
    title: cp.title,
    task: cp.task,
    acceptance: cp.acceptance,
    hint: cp.hint,
    status: cp.status,
    submission: cp.submission,
    feedback: cp.feedback,
    score: cp.score,
    attempts: cp.attempts,
    passedAt: cp.passedAt,
  })),
})

/**
 * Find concept clusters that have crossed the mastery threshold and are
 * ready to be bridged into a project. Concepts group by the content (course)
 * they came from; inbox/teach-back concepts without content pool into one
 * "self-directed" cluster. A cluster with an active brief is excluded —
 * finishing (or abandoning) a project makes its cluster eligible again.
 *
 * @returns {Promise<Array<{ key, label, concepts: [{ id, concept, masteryScore }], avgMastery }>>}
 */
export async function findMasteredClusters(userId) {
  const [mastered, activeBriefs] = await Promise.all([
    prisma.conceptMastery.findMany({
      where: { userId, masteryScore: { gte: MASTERY_THRESHOLD } },
      select: {
        id: true,
        concept: true,
        masteryScore: true,
        contentId: true,
        content: { select: { title: true } },
      },
      orderBy: { masteryScore: "desc" },
    }),
    prisma.projectBrief.findMany({
      where: { userId, status: "active" },
      select: { clusterKey: true },
    }),
  ])

  const busyKeys = new Set(activeBriefs.map((b) => b.clusterKey))

  const groups = new Map()
  for (const c of mastered) {
    const key = c.contentId ? `content:${c.contentId}` : STANDALONE_KEY
    const label = c.contentId ? c.content?.title || "Course" : STANDALONE_LABEL
    if (!groups.has(key)) groups.set(key, { key, label, concepts: [] })
    groups.get(key).concepts.push({ id: c.id, concept: c.concept, masteryScore: c.masteryScore })
  }

  return [...groups.values()]
    .filter((g) => g.concepts.length >= MIN_CLUSTER_SIZE && !busyKeys.has(g.key))
    .map((g) => ({
      ...g,
      // a project should exercise a focused set, not an entire course dump
      concepts: g.concepts.slice(0, 8),
      avgMastery: Math.round(
        g.concepts.reduce((sum, c) => sum + c.masteryScore, 0) / g.concepts.length
      ),
    }))
    .sort((a, b) => b.avgMastery - a.avgMastery)
}

/**
 * Generate a real-world project brief for a mastered concept cluster.
 * @returns {{ title, pitch, deliverable, difficulty, estimatedHours, checkpoints: [{ title, task, acceptance, hint }] }}
 * @throws {Error} when the model returns nothing usable
 */
export async function generateProjectBrief({ clusterLabel, concepts }) {
  const conceptList = concepts.map((c) => `- ${c.concept}`).join("\n")

  const completion = await aiClient.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You design small, real-world practice projects for learners who have mastered concepts in theory but haven't applied them. The project must be genuinely useful or shareable (portfolio-worthy), scoped to hours not weeks, and require NO resources the learner is unlikely to have. Every checkpoint must exercise the listed concepts — no filler steps.
Always respond with valid JSON only — no prose, no markdown fences.`,
      },
      {
        role: "user",
        content: `The learner just mastered these concepts${clusterLabel ? ` from "${clusterLabel}"` : ""}:
${conceptList}

Design ONE small real-world project that forces them to apply these concepts by actually building something. Return ONLY this JSON shape:
{
  "title": "short, motivating project name",
  "pitch": "2-3 sentences: the real-world scenario and why building this proves the concepts stuck",
  "deliverable": "the single concrete artifact they will have at the end",
  "difficulty": "starter" | "intermediate" | "ambitious",
  "estimatedHours": 2-12,
  "checkpoints": [
    {
      "title": "short step name",
      "task": "what to build/do in this step, specific enough to start immediately",
      "acceptance": "objective criteria a reviewer checks the learner's write-up against — what must exist and work",
      "hint": "one nudge for when they get stuck, without giving the answer"
    }
  ]
}

Rules:
- ${MIN_CHECKPOINTS}-${MAX_CHECKPOINTS} checkpoints, ordered so each builds on the last
- each checkpoint names which concept(s) it exercises inside its task text
- acceptance criteria must be checkable from a written description of the work — never require screenshots or live demos`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  })

  const parsed = parseAIJson(completion.choices[0]?.message?.content, null)
  const checkpoints = (Array.isArray(parsed?.checkpoints) ? parsed.checkpoints : [])
    .map((cp) => ({
      title: cleanString(cp?.title, 120),
      task: cleanString(cp?.task, 1000),
      acceptance: cleanString(cp?.acceptance, 1000),
      hint: cleanString(cp?.hint, 500),
    }))
    .filter((cp) => cp.title && cp.task && cp.acceptance)
    .slice(0, MAX_CHECKPOINTS)

  const title = cleanString(parsed?.title, 120)
  if (!title || checkpoints.length < MIN_CHECKPOINTS) {
    throw new Error("Project generation failed — please try again")
  }

  return {
    title,
    pitch: cleanString(parsed.pitch, 1000) || "",
    deliverable: cleanString(parsed.deliverable, 500) || "",
    difficulty: DIFFICULTIES.has(parsed.difficulty) ? parsed.difficulty : "starter",
    estimatedHours: Math.min(Math.max(Math.round(Number(parsed.estimatedHours) || 0), 1), 40),
    checkpoints,
  }
}

/**
 * Review a learner's checkpoint submission against the acceptance criteria.
 * @returns {{ passed, score, feedback, nudge }}
 * @throws {Error} when the model returns nothing usable
 */
export async function reviewCheckpointSubmission({ brief, checkpoint, submission }) {
  const completion = await aiClient.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You review a learner's project checkpoint like a supportive senior colleague. They describe what they built; you check it against acceptance criteria. Pass work that genuinely meets the criteria — but a vague summary with no specifics about HOW it was built means they probably didn't build it: probe for that and fail it. Never fail for polish the criteria don't ask for.
Always respond with valid JSON only — no prose, no markdown fences.`,
      },
      {
        role: "user",
        content: `Project: ${brief.title}
Deliverable: ${brief.deliverable}

Checkpoint: ${checkpoint.title}
Task: ${checkpoint.task}
Acceptance criteria: ${checkpoint.acceptance}

Learner's write-up of what they built:
"""
${submission.slice(0, MAX_SUBMISSION_CHARS)}
"""

Return ONLY this JSON shape:
{
  "score": 0-100,          // how fully the write-up demonstrates the acceptance criteria are met
  "passed": true|false,    // does this genuinely satisfy the criteria? (${PASS_SCORE}+ work)
  "feedback": "2-3 sentences: what's solid, what's missing or unverified",
  "nudge": "if not passed: the single most useful next action; if passed: one stretch idea"
}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  })

  const parsed = parseAIJson(completion.choices[0]?.message?.content, null)
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Checkpoint review failed — please try submitting again")
  }

  const score = clampScore(parsed.score)
  return {
    // both the model's judgment and the score must agree — prevents a
    // generous score with a "but actually no" verdict from auto-passing
    passed: Boolean(parsed.passed) && score >= PASS_SCORE,
    score,
    feedback: cleanString(parsed.feedback, 1000),
    nudge: cleanString(parsed.nudge, 500),
  }
}
