import OpenAI from "openai"
import { tr } from "zod/locales"

//-- Provider Config ---
const PROVIDER = process.env.AI_PROVIDER || "groq" // "groq" | "openai" | "gemini"

const PROVIDERS = {
    groq:{
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        transcriptionModel: "whisper-large-v3-turbo",
        summaryModel: "llama-3.3-70b-versatile",
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: undefined,
        transcriptionModel: "gpt-4o-mini-transcribe",
        summaryModel: "gpt-4o-mini",
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        transcriptionModel: "gemini-2.0-flash",
        summaryModel: "gemini-2.0-flash",
    },
}
const config = PROVIDERS[PROVIDER]

const aiClient = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL && {baseURL: config.baseURL}),
})

const GROQ_MAX_BYTES = 25 * 1024 * 1024 // 25MB Groq limit

export async function transcribesAudio(audioUrl) {
    try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error("Failed to download audio from S3")

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.byteLength > GROQ_MAX_BYTES) {
            throw new Error(
                `Audio file is too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB). Max allowed is 25MB.`
            )
        }

        const file = new File([buffer], "audio.mp4", {type: "video/mp4"})

        const transcription = await aiClient.audio.transcriptions.create({
            file,
            model: config.transcriptionModel,
            response_format: "text",
        })

        return transcription
    } catch (error) {
        console.error("Transcription error:", error.message)
        throw error
    }
}

export async function generateSummary(transcript, title) {
    try {
        const completion = await aiClient.chat.completions.create({
            model: config.summaryModel,
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant that creates concise,
                engaging summaries for video content. Keep summaries under
                150 words. Be specific and highlight key points.`,
                },
                {
                    role: "user",
                    content: `Create a summary for this video title "${title}".
        Transcript:
        ${transcript.slice(0, 4000)}`,
                },
            ],
            max_tokens: 200,
            temperature: 0.7,
        })

        return completion.choices[0].message.content
    } catch (error) {
        console.error("Summary error:", error.message)
        throw error
    }
}

export async function generateChapters(transcript, duration) {
    try {
        const completion = await aiClient.chat.completions.create({
            model: config.summaryModel,
            messages: [
                {
                    role: "system",
                    content: `You are a video chapter generator.
                    Analyze transcripts and create logical chapter breaks.
                    Always respond with valid JSON only - no other text.`,
                },
                {
                    role: "user",
                    content: `Create chapters for this video transcript.
                    Video duration: ${duration || "unknown"} seconds.

                Transcript:
                ${transcript.slice(0, 5000)}

                Return ONLY a JSON array like this:
                [
                {"time":0,"title":"Introduction"},
                {"time": 145, "title": "Main Concept"},
                {"time":380, "title": "Examples"}
                ]

                Rules:
                - time is in seconds (integer)
                - 4-8 chapters total
                - titles are short (2-5 words)
                - first chapter always starts at 0
                - space chapters evenly through the video`,
                },
            ],
            max_tokens: 300,
            temperature: 0.3,
        })

        const raw = completion.choices[0].message.content
        const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
        return JSON.parse(cleaned)
    } catch (error) {
        console.error("Chapter generation error:", error.message)
        return null
    }
}

export async function generateQuiz(transcript, title) {
  try {
    const completion = await aiClient.chat.completions.create({
      model: config.summaryModel,
      messages: [
        {
          role: "system",
          content: `You generate multiple choice quiz questions from video transcripts.
Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Create 5 quiz questions for the video "${title}".

Transcript:
${transcript.slice(0, 4000)}

Return ONLY this JSON format:
[
  {
    "question": "What is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- correct is the index (0-3) of the correct option
- Questions test understanding, not memorization
- Mix easy and medium difficulty
- Options should all be plausible`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    })

    const raw = completion.choices[0].message.content
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
    return JSON.parse(cleaned)

  } catch (error) {
    console.error("Quiz generation error:", error.message)
    return null
  }
}