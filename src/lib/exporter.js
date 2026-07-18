// Knowledge export: turn a user's learning graph (concepts, sources, inbox
// captures, teach-back history, project bridges) into a Markdown bundle that
// drops straight into an Obsidian vault or imports into Notion, plus a CSV
// for Notion databases. Pure functions — routes fetch, this file formats.
import { estimateRetention } from "@/lib/forgetting"

export const EXPORT_FORMATS = ["obsidian", "notion", "json"]

const pad = (n) => String(n).padStart(2, "0")
const dateOnly = (d) => new Date(d).toISOString().slice(0, 10)

/** Filesystem- and Obsidian-safe note name (no path or wikilink breakers). */
export function sanitizeFileName(name, fallback = "Untitled") {
  const clean = String(name || "")
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .trim()
  return clean || fallback
}

const yamlEscape = (v) => `"${String(v ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`

export function csvEscape(value) {
  const s = String(value ?? "")
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Link to another note: Obsidian wikilink vs plain-Markdown relative link. */
function noteLink(name, folder, flavor) {
  if (flavor === "obsidian") return `[[${name}]]`
  return `[${name}](${encodeURIComponent(folder)}/${encodeURIComponent(name)}.md)`
}

function masteryTag(score) {
  if (score >= 80) return "mastered"
  if (score >= 50) return "developing"
  return "learning"
}

/** Assign unique note names within a folder (dedupe with " 2", " 3", …). */
function uniqueNamer() {
  const used = new Map()
  return (raw, fallback) => {
    const base = sanitizeFileName(raw, fallback)
    const key = base.toLowerCase()
    const count = used.get(key) || 0
    used.set(key, count + 1)
    return count === 0 ? base : `${base} ${count + 1}`
  }
}

/**
 * Notion-importable CSV of the concept database.
 * @param {Array} concepts ConceptMastery rows (with content: { title }?)
 */
export function buildConceptsCsv(concepts, now = new Date()) {
  const header = [
    "Name", "Mastery", "Status", "Retention %", "Due", "Interval (days)",
    "Reviews", "Source", "From",
  ]
  const rows = (concepts || []).map((c) => [
    c.concept,
    Math.round(c.masteryScore || 0),
    masteryTag(c.masteryScore || 0),
    Math.round(estimateRetention(c, now)),
    c.dueDate ? dateOnly(c.dueDate) : "",
    c.interval ?? "",
    c.reviewCount ?? 0,
    c.source || "",
    c.content?.title || c.inboxItem?.title || "",
  ])
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n"
}

/**
 * Build the export bundle as { path, content } markdown files.
 *
 * @param {object} data { concepts, notes, highlights, inboxItems, teachBackSessions, projectBriefs }
 *   concepts include content: { id, title } and inboxItem: { id, title }.
 * @param {{ flavor?: "obsidian" | "notion", now?: Date, appUrl?: string }} opts
 */
export function buildExportFiles(data, { flavor = "obsidian", now = new Date(), appUrl = "" } = {}) {
  const {
    concepts = [],
    notes = [],
    highlights = [],
    inboxItems = [],
    teachBackSessions = [],
    projectBriefs = [],
  } = data || {}

  const files = []
  const conceptNamer = uniqueNamer()

  // Group supporting material
  const sessionsByConcept = new Map()
  for (const s of teachBackSessions) {
    const key = s.conceptMasteryId
    if (!key) continue
    if (!sessionsByConcept.has(key)) sessionsByConcept.set(key, [])
    sessionsByConcept.get(key).push(s)
  }
  const notesByContent = groupBy(notes, (n) => n.contentId)
  const highlightsByContent = groupBy(highlights, (h) => h.contentId)

  // Source notes (one per course/video that concepts/notes/highlights reference)
  const sourceNamer = uniqueNamer()
  const sourceNoteByContentId = new Map()
  const contents = new Map()
  for (const c of concepts) if (c.content) contents.set(c.content.id, c.content)
  for (const n of notes) if (n.content) contents.set(n.content.id, n.content)
  for (const h of highlights) if (h.content) contents.set(h.content.id, h.content)
  for (const content of contents.values()) {
    sourceNoteByContentId.set(content.id, sourceNamer(content.title, `Source ${content.id}`))
  }

  const inboxNamer = uniqueNamer()
  const inboxNoteByItemId = new Map()
  for (const item of inboxItems) {
    inboxNoteByItemId.set(item.id, inboxNamer(item.title, `Capture ${item.id}`))
  }

  // --- Concept notes ---------------------------------------------------------
  const conceptNoteById = new Map()
  for (const c of concepts) {
    conceptNoteById.set(c.id, conceptNamer(c.concept, `Concept ${c.id}`))
  }

  for (const c of concepts) {
    const name = conceptNoteById.get(c.id)
    const retention = Math.round(estimateRetention(c, now))
    const lines = [
      "---",
      `concept: ${yamlEscape(c.concept)}`,
      `mastery: ${Math.round(c.masteryScore || 0)}`,
      `retention: ${retention}`,
      `status: ${masteryTag(c.masteryScore || 0)}`,
      `due: ${c.dueDate ? dateOnly(c.dueDate) : ""}`,
      `interval-days: ${c.interval ?? 1}`,
      `reviews: ${c.reviewCount ?? 0}`,
      `source: ${yamlEscape(c.source || "")}`,
      `exported: ${dateOnly(now)}`,
      `tags: [learnai, concept, ${masteryTag(c.masteryScore || 0)}]`,
      "---",
      "",
      `# ${c.concept}`,
      "",
      `**Mastery ${Math.round(c.masteryScore || 0)}%** · estimated retention ${retention}% · ` +
        `next review ${c.dueDate ? dateOnly(c.dueDate) : "unscheduled"}`,
      "",
    ]

    if (c.content) {
      lines.push(`Learned from ${noteLink(sourceNoteByContentId.get(c.content.id), "Sources", flavor)}`, "")
    } else if (c.inboxItem && inboxNoteByItemId.has(c.inboxItem.id)) {
      lines.push(`Captured via ${noteLink(inboxNoteByItemId.get(c.inboxItem.id), "Inbox", flavor)}`, "")
    }

    const sessions = (sessionsByConcept.get(c.id) || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sessions.length) {
      lines.push("## Teach-back history", "")
      for (const s of sessions.slice(0, 5)) {
        lines.push(`### ${dateOnly(s.createdAt)} — scored ${s.score}/100 (audience: ${s.audience})`, "")
        lines.push(s.explanation.trim(), "")
        if (s.feedback) lines.push(`> **Coach feedback:** ${s.feedback.trim()}`, "")
      }
    }

    files.push({ path: `Concepts/${name}.md`, content: lines.join("\n") })
  }

  // --- Source notes ----------------------------------------------------------
  for (const content of contents.values()) {
    const name = sourceNoteByContentId.get(content.id)
    const related = concepts.filter((c) => c.content?.id === content.id)
    const contentNotes = notesByContent.get(content.id) || []
    const contentHighlights = highlightsByContent.get(content.id) || []
    const lines = [
      "---",
      `title: ${yamlEscape(content.title)}`,
      `type: source`,
      `exported: ${dateOnly(now)}`,
      "tags: [learnai, source]",
      "---",
      "",
      `# ${content.title}`,
      "",
    ]
    if (related.length) {
      lines.push("## Concepts", "")
      for (const c of related) {
        lines.push(`- ${noteLink(conceptNoteById.get(c.id), "Concepts", flavor)} — mastery ${Math.round(c.masteryScore || 0)}%`)
      }
      lines.push("")
    }
    if (contentHighlights.length) {
      lines.push("## Highlights", "")
      for (const h of contentHighlights) {
        lines.push(`> ${h.text.trim().replace(/\r?\n/g, "\n> ")}`)
        if (h.summary) lines.push(`> — *${h.summary.trim()}*`)
        lines.push("")
      }
    }
    if (contentNotes.length) {
      lines.push("## Notes", "")
      for (const n of contentNotes) {
        const stamp = n.timestamp != null ? ` (at ${Math.floor(n.timestamp / 60)}:${pad(Math.floor(n.timestamp % 60))})` : ""
        lines.push(`- ${dateOnly(n.createdAt)}${stamp}: ${n.body.trim().replace(/\r?\n/g, " ")}`)
      }
      lines.push("")
    }
    files.push({ path: `Sources/${name}.md`, content: lines.join("\n") })
  }

  // --- Inbox capture notes ---------------------------------------------------
  for (const item of inboxItems) {
    const name = inboxNoteByItemId.get(item.id)
    const related = concepts.filter((c) => c.inboxItem?.id === item.id)
    const lines = [
      "---",
      `title: ${yamlEscape(item.title || "Untitled capture")}`,
      `type: capture`,
      `source-type: ${item.sourceType || "article"}`,
      ...(item.url ? [`url: ${yamlEscape(item.url)}`] : []),
      `captured: ${dateOnly(item.createdAt)}`,
      "tags: [learnai, inbox]",
      "---",
      "",
      `# ${item.title || "Untitled capture"}`,
      "",
      ...(item.url ? [`Source: ${item.url}`, ""] : []),
      ...(item.summary ? ["## Summary", "", item.summary.trim(), ""] : []),
    ]
    if (related.length) {
      lines.push("## Concepts extracted", "")
      for (const c of related) {
        lines.push(`- ${noteLink(conceptNoteById.get(c.id), "Concepts", flavor)}`)
      }
      lines.push("")
    }
    files.push({ path: `Inbox/${name}.md`, content: lines.join("\n") })
  }

  // --- Project bridge notes --------------------------------------------------
  const projectNamer = uniqueNamer()
  for (const brief of projectBriefs) {
    const name = projectNamer(brief.title, `Project ${brief.id}`)
    const checkpoints = (brief.checkpoints || []).slice().sort((a, b) => a.order - b.order)
    const lines = [
      "---",
      `title: ${yamlEscape(brief.title)}`,
      `type: project`,
      `status: ${brief.status}`,
      `difficulty: ${brief.difficulty}`,
      `created: ${dateOnly(brief.createdAt)}`,
      ...(brief.completedAt ? [`completed: ${dateOnly(brief.completedAt)}`] : []),
      "tags: [learnai, project]",
      "---",
      "",
      `# ${brief.title}`,
      "",
      brief.pitch?.trim() || "",
      "",
      `**Deliverable:** ${brief.deliverable}`,
      "",
    ]
    if (checkpoints.length) {
      lines.push("## Checkpoints", "")
      for (const cp of checkpoints) {
        lines.push(`- [${cp.status === "passed" ? "x" : " "}] **${cp.title}** — ${cp.task}`)
        if (cp.status === "passed" && cp.submission) {
          lines.push(`  - What I built: ${cp.submission.trim().replace(/\r?\n/g, " ").slice(0, 400)}`)
        }
      }
      lines.push("")
    }
    files.push({ path: `Projects/${name}.md`, content: lines.join("\n") })
  }

  // --- Index note ------------------------------------------------------------
  const mastered = concepts.filter((c) => (c.masteryScore || 0) >= 80).length
  const index = [
    "---",
    `exported: ${dateOnly(now)}`,
    "tags: [learnai]",
    "---",
    "",
    "# LearnAI knowledge export",
    "",
    `Exported ${dateOnly(now)}${appUrl ? ` from ${appUrl}` : ""}.`,
    "",
    `- **${concepts.length}** concepts (${mastered} mastered)`,
    `- **${contents.size}** sources · **${inboxItems.length}** inbox captures`,
    `- **${projectBriefs.length}** projects · **${teachBackSessions.length}** teach-back sessions`,
    "",
    "Folders: `Concepts/` (one note per spaced-repetition card), `Sources/`",
    "(courses and videos), `Inbox/` (captured articles/videos/PDFs),",
    "`Projects/` (learn-to-do project bridges).",
    "",
    flavor === "obsidian"
      ? "Open this folder as an Obsidian vault (or drop it into one) — links between notes are wikilinks and the graph view will show your knowledge map."
      : "Import into Notion via *Settings → Import → Markdown & CSV*, selecting this folder. `concepts.csv` can also be imported on its own as a Notion database.",
    "",
  ]
  files.push({ path: "LearnAI Index.md", content: index.join("\n") })

  if (flavor === "notion") {
    files.push({ path: "concepts.csv", content: buildConceptsCsv(concepts, now) })
  }

  return files
}

function groupBy(rows, keyFn) {
  const map = new Map()
  for (const row of rows || []) {
    const key = keyFn(row)
    if (key == null) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return map
}
