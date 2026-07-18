import OpenAI from "openai"

let groq = null

// Lazy singleton — constructing OpenAI at module scope throws during
// `next build` when GROQ_API_KEY is not set in the build environment.
export function getGroqClient() {
  if (!groq) {
    groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  }
  return groq
}
