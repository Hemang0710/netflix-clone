// Pure helpers for the universal learning inbox: source detection, URL safety,
// and HTML → readable-text extraction. No prisma/AI imports so these stay
// cheap to unit test.

/**
 * Extract YouTube video ID from any common YouTube URL format.
 * Mirrors /api/external/import.
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
    /youtube\.com\/live\/([\w-]{6,})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Classify a capture into a source type.
 * @param {{ url?: string, text?: string, fileName?: string, fileType?: string }} input
 * @returns {"youtube"|"article"|"pdf"|"text"|null} null when there is nothing usable
 */
export function detectSourceType({ url, text, fileName, fileType } = {}) {
  if (fileType === "application/pdf" || /\.pdf$/i.test(fileName || "")) return "pdf"
  if (fileName) return "text"
  if (url) {
    if (extractYouTubeId(url)) return "youtube"
    if (/\.pdf(\?|#|$)/i.test(url)) return "pdf"
    return "article"
  }
  if (text && text.trim()) {
    // A bare URL pasted into the text box counts as a URL capture
    const trimmed = text.trim()
    if (/^https?:\/\/\S+$/i.test(trimmed)) {
      return detectSourceType({ url: trimmed })
    }
    return "text"
  }
  return null
}

/** True when a pasted text blob is actually just a URL. */
export function textIsBareUrl(text) {
  return !!text && /^https?:\/\/\S+$/i.test(text.trim())
}

/**
 * Basic SSRF guard: refuse hostnames that resolve to obviously private /
 * local targets. Not a substitute for network-level egress rules, but stops
 * the easy "share http://169.254.169.254" tricks.
 */
export function isPrivateHost(hostname) {
  if (!hostname) return true
  const host = hostname.toLowerCase().replace(/\.$/, "")

  if (host === "localhost" || host.endsWith(".localhost")) return true
  if (host.endsWith(".local") || host.endsWith(".internal")) return true
  if (host === "metadata.google.internal") return true

  // IPv6 literals (URL.hostname keeps the brackets)
  const bare = host.replace(/^\[|\]$/g, "")
  if (bare === "::1" || bare === "::") return true
  if (/^(fc|fd)[0-9a-f]{2}:/i.test(bare)) return true // unique-local fc00::/7
  if (/^fe[89ab][0-9a-f]:/i.test(bare)) return true // link-local fe80::/10

  // IPv4 literals
  const ipv4 = bare.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a >= 224) return true // multicast/reserved
  }

  return false
}

/**
 * Validate that a capture URL is a public http(s) URL.
 * @returns {URL} parsed URL
 * @throws {Error} with a user-facing message
 */
export function assertPublicHttpUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error("That doesn't look like a valid URL")
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) links can be imported")
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("That URL points to a private or local address")
  }
  return parsed
}

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "'", lsquo: "'",
  rdquo: '"', ldquo: '"', copy: "©", trade: "™", reg: "®",
}

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16)
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : ""
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10)
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : ""
    })
    .replace(/&([a-z]+);/gi, (_, name) => ENTITIES[name.toLowerCase()] ?? " ")
}

/**
 * Pull the page title / site name out of raw HTML.
 * @returns {{ title: string|null, siteName: string|null }}
 */
export function extractHtmlMeta(html) {
  if (!html) return { title: null, siteName: null }
  const og = (prop) => {
    const re = new RegExp(
      `<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`,
      "i"
    )
    const m = html.match(re)
    return m ? decodeEntities((m[1] || m[2]).trim()) : null
  }
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return {
    title: og("title") || (titleTag ? decodeEntities(titleTag[1].trim()) : null),
    siteName: og("site_name"),
  }
}

/**
 * Convert an HTML document to readable plain text. Prefers <article>/<main>
 * regions, drops script/style/nav chrome, keeps paragraph breaks.
 */
export function htmlToText(html) {
  if (!html || typeof html !== "string") return ""

  let doc = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template|video|audio|canvas)[\s\S]*?<\/\1>/gi, " ")

  // Focus on the main content region when the page declares one
  const region =
    doc.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    doc.match(/<main[\s\S]*?<\/main>/i)?.[0] ||
    doc.match(/<body[\s\S]*?<\/body>/i)?.[0] ||
    doc

  let text = region
    .replace(/<(nav|header|footer|aside|form|button|figcaption)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|section|h[1-6]|li|tr|blockquote|pre)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")

  text = decodeEntities(text)

  return text
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Truncate to n chars without cutting mid-word when possible. */
export function truncateText(str, n) {
  if (!str || str.length <= n) return str || ""
  const cut = str.slice(0, n)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > n * 0.8 ? cut.slice(0, lastSpace) : cut) + "…"
}
