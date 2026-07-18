// Universal learning inbox pipeline: fetch/extract text from a capture
// (article URL, YouTube link, PDF, raw text), mine it for concepts with AI,
// and feed the concepts into the SM-2 review queue (ConceptMastery).
import prisma from "@/lib/prisma"
import { aiClient } from "@/lib/openai"
import { parseAIJson } from "@/lib/aiJson"
import {
  assertPublicHttpUrl,
  detectSourceType,
  extractHtmlMeta,
  extractYouTubeId,
  htmlToText,
  textIsBareUrl,
  truncateText,
} from "@/lib/inboxExtract"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const FETCH_TIMEOUT_MS = 12_000
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024 // refuse >5MB downloads
const MAX_STORED_TEXT = 50_000 // chars of rawText persisted per item
const MAX_AI_INPUT = 12_000 // chars sent to the concept miner
const MAX_CONCEPTS = 8

const AI_MODEL =
  process.env.AI_PROVIDER === "openai"
    ? "gpt-4o-mini"
    : process.env.AI_PROVIDER === "gemini"
      ? "gemini-2.0-flash"
      : "llama-3.3-70b-versatile"

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "LearnAI-Inbox/1.0 (+learning inbox importer)",
        Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function readCapped(response) {
  const buf = Buffer.from(await response.arrayBuffer())
  if (buf.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error("That page/file is too large to import (max 5MB)")
  }
  return buf
}

/** Extract text from a PDF buffer via the optional `unpdf` package. */
export async function extractPdfText(buffer) {
  let unpdf
  try {
    unpdf = await import("unpdf")
  } catch {
    throw new Error("PDF import isn't available on this server (missing 'unpdf' package)")
  }
  const pdf = await unpdf.getDocumentProxy(new Uint8Array(buffer))
  const { text } = await unpdf.extractText(pdf, { mergePages: true })
  const cleaned = (text || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  if (cleaned.length < 80) {
    throw new Error("Couldn't extract readable text from that PDF (it may be scanned images)")
  }
  return cleaned
}

/**
 * Download an article (or linked PDF / plain-text file) and return
 * { title, siteName, text }.
 */
export async function fetchArticle(url) {
  assertPublicHttpUrl(url)
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`The site responded with ${response.status} — try sharing the text directly`)
  }
  // Redirects may land somewhere private; re-check the final URL
  if (response.url) assertPublicHttpUrl(response.url)

  const contentType = (response.headers.get("content-type") || "").toLowerCase()
  const buf = await readCapped(response)

  if (contentType.includes("application/pdf")) {
    return { title: null, siteName: null, text: await extractPdfText(buf) }
  }
  if (contentType.includes("text/plain")) {
    return { title: null, siteName: null, text: buf.toString("utf8").trim() }
  }

  const html = buf.toString("utf8")
  const meta = extractHtmlMeta(html)
  const text = htmlToText(html)
  if (text.length < 200) {
    throw new Error(
      "Couldn't extract a readable article from that page (it may be behind a login or heavily scripted) — try sharing the text directly"
    )
  }
  return { ...meta, text }
}

/**
 * Fetch a YouTube video's title (oEmbed, no API key) and transcript
 * (Supadata, same service the library import uses).
 */
export async function fetchYouTube(url) {
  const videoId = extractYouTubeId(url)
  if (!videoId) throw new Error("Not a valid YouTube URL")

  let title = null
  let siteName = "YouTube"
  try {
    const oembed = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    )
    if (oembed.ok) {
      const data = await oembed.json()
      title = data.title || null
      if (data.author_name) siteName = `YouTube · ${data.author_name}`
    }
  } catch {
    // title is cosmetic — keep going without it
  }

  let text = null
  if (process.env.SUPADATA_API_KEY) {
    const res = await fetchWithTimeout(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
      { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
    )
    if (res.ok) {
      const data = await res.json()
      text = data.content?.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim() || null
    }
  }

  // Fallback: video description via YouTube Data API
  if (!text && process.env.YOUTUBE_API_KEY) {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (res.ok) {
      const data = await res.json()
      const snippet = data.items?.[0]?.snippet
      if (snippet) {
        title = title || snippet.title
        if (snippet.description?.length > 200) {
          text = `[Video description]\n${snippet.description}`
        }
      }
    }
  }

  if (!text) {
    throw new Error("No transcript available for this video (captions may be disabled)")
  }
  return { title, siteName, text, videoId }
}

/**
 * Mine a text for learnable concepts.
 * @returns {{ title: string, summary: string, concepts: Array<{name: string, definition: string}> }}
 */
export async function extractKnowledge({ title, text }) {
  const completion = await aiClient.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You mine educational content for the key concepts a learner should retain long-term.
Always respond with valid JSON only — no prose, no markdown fences.`,
      },
      {
        role: "user",
        content: `Analyze this content and extract the concepts worth remembering.

Title: ${title || "Untitled"}

Content:
${text.slice(0, MAX_AI_INPUT)}

Return ONLY this JSON shape:
{
  "title": "short cleaned-up title for this content",
  "summary": "what this content teaches, under 80 words",
  "concepts": [
    { "name": "Concept Name", "definition": "self-contained 1-2 sentence definition a learner can be quizzed on" }
  ]
}

Rules:
- 3 to ${MAX_CONCEPTS} concepts, ordered most→least important
- name: 1-4 words, Title Case, no trailing punctuation
- definition: max 220 characters, must stand alone without the article
- only include concepts the content actually teaches or explains
- skip promotional/navigation noise`,
      },
    ],
    max_tokens: 900,
    temperature: 0.3,
  })

  const parsed = parseAIJson(completion.choices[0]?.message?.content, null)
  const concepts = (parsed?.concepts || [])
    .filter((c) => c?.name && c?.definition)
    .slice(0, MAX_CONCEPTS)
    .map((c) => ({
      name: String(c.name).trim().slice(0, 80),
      definition: String(c.definition).trim().slice(0, 300),
    }))

  if (!concepts.length) {
    throw new Error("AI couldn't identify learnable concepts in this content")
  }
  return {
    title: parsed.title ? String(parsed.title).trim().slice(0, 200) : null,
    summary: parsed.summary ? String(parsed.summary).trim().slice(0, 1000) : null,
    concepts,
  }
}

/**
 * Create ConceptMastery rows for newly-met concepts and reuse existing ones,
 * so re-encountering "Recursion" reinforces the same card instead of forking it.
 * @returns JSON-able [{ name, definition, conceptMasteryId, isNew }]
 */
export async function saveConceptsForItem(userId, inboxItemId, concepts) {
  const results = []
  for (const { name, definition } of concepts) {
    const existing = await prisma.conceptMastery.findFirst({
      where: { userId, concept: { equals: name, mode: "insensitive" } },
      select: { id: true, concept: true },
    })
    if (existing) {
      results.push({ name: existing.concept, definition, conceptMasteryId: existing.id, isNew: false })
      continue
    }
    const created = await prisma.conceptMastery.create({
      data: { userId, contentId: null, inboxItemId, concept: name, source: "inbox" },
      select: { id: true },
    })
    results.push({ name, definition, conceptMasteryId: created.id, isNew: true })
  }
  return results
}

/**
 * Turn a JSON capture { url?, text?, title? } into create-ready fields, or
 * null when there's nothing usable. Share sheets often put the link in
 * `text`, so a bare-URL text blob is promoted to a URL capture.
 */
export function normalizeCapture({ url, text, title }) {
  if (!url && textIsBareUrl(text)) {
    url = text.trim()
    text = null
  }
  const sourceType = detectSourceType({ url, text })
  if (!sourceType) return null

  if (sourceType === "text") {
    const body = text.trim()
    if (body.length < 80) return null // too short to mine for concepts
    return { sourceType, title, rawText: body }
  }
  return { sourceType, url, title }
}

/**
 * Handle multipart captures (PWA share-target posts, UI uploads).
 * Files are extracted eagerly (PDF → text) so processing never re-reads them.
 * @throws {Error} user-facing message for oversized/unreadable files
 */
export async function captureFromFormData(form) {
  const title = form.get("title")?.toString().slice(0, 200) || null
  const text = form.get("text")?.toString() || null
  const url = form.get("url")?.toString() || null

  const files = form.getAll("files").filter((f) => typeof f === "object" && f?.arrayBuffer)
  const file = files[0]

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("File too large (max 10MB)")
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "")
    const buffer = Buffer.from(await file.arrayBuffer())
    if (isPdf) {
      return {
        sourceType: "pdf",
        title: title || file.name?.replace(/\.pdf$/i, "") || null,
        rawText: await extractPdfText(buffer),
      }
    }
    // Treat everything else as text (txt/md/subtitles); binary junk will
    // simply fail concept extraction downstream.
    return {
      sourceType: "text",
      title: title || file.name || null,
      rawText: buffer.toString("utf8").slice(0, 100_000),
    }
  }

  return normalizeCapture({ url, text, title })
}

/**
 * Run the full pipeline for one inbox item. Safe to call again after a
 * failure; refuses to double-process ready/in-flight items.
 * @returns the updated InboxItem
 */
export async function processInboxItem(itemId, userId) {
  const item = await prisma.inboxItem.findFirst({
    where: { id: itemId, userId },
  })
  if (!item) throw new Error("Inbox item not found")
  if (item.status === "ready" || item.status === "processing") return item

  await prisma.inboxItem.update({
    where: { id: item.id },
    data: { status: "processing", error: null },
  })

  try {
    let extracted // { title, siteName, text }
    if (item.sourceType === "youtube") {
      extracted = await fetchYouTube(item.url)
    } else if (item.sourceType === "article" || (item.sourceType === "pdf" && item.url)) {
      extracted = await fetchArticle(item.url)
    } else if (item.rawText) {
      // "text" captures and pre-extracted uploads (txt/md/pdf files parsed at upload)
      extracted = { title: item.title, siteName: item.siteName, text: item.rawText }
    } else {
      throw new Error("Nothing to process — no URL or text on this item")
    }

    const knowledge = await extractKnowledge({
      title: item.title || extracted.title,
      text: extracted.text,
    })
    const savedConcepts = await saveConceptsForItem(userId, item.id, knowledge.concepts)

    return await prisma.inboxItem.update({
      where: { id: item.id },
      data: {
        title: item.title || extracted.title || knowledge.title || "Untitled capture",
        siteName: item.siteName || extracted.siteName || null,
        rawText: truncateText(extracted.text, MAX_STORED_TEXT),
        summary: knowledge.summary,
        concepts: JSON.stringify(savedConcepts),
        status: "ready",
        error: null,
        processedAt: new Date(),
      },
    })
  } catch (error) {
    console.error(`[INBOX_PROCESS] item ${item.id} failed:`, error.message)
    return await prisma.inboxItem.update({
      where: { id: item.id },
      data: { status: "failed", error: String(error.message || "Processing failed").slice(0, 500) },
    })
  }
}
