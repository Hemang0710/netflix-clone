/**
 * Extract JSON from an LLM response. Models often wrap JSON in markdown
 * fences or prose, so plain JSON.parse on the raw text fails intermittently.
 * Returns the parsed value, or `fallback` if nothing parseable is found.
 */
export function parseAIJson(text, fallback = null) {
  if (!text || typeof text !== "string") return fallback;

  // 1. Try the whole string
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Try fenced code blocks: ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // 3. Try the first {...} or [...] span in the text
  const start = text.search(/[[{]/);
  if (start !== -1) {
    const open = text[start];
    const close = open === "[" ? "]" : "}";
    const end = text.lastIndexOf(close);
    if (end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {}
    }
  }

  return fallback;
}
