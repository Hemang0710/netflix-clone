import { base64url } from "jose"
import OpenAI from "openai"

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
    baseURL: undefined, // uses default OpenAI URL
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

// //Single instance - reused across requests
// const openai = new OpenAI ({
//     apiKey: process.env.OPENAI_API_KEY,
// })

//Single client - works with ALL providers (OpenAI-compatible)
const aiClient = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL && {baseURL:config.baseURL}),
})

//Transcribe audio from a URL (downloads from S3 then transcribes)
export async function transcribesAudio(audioUrl) {
    // Download the file from S3
    try{
    const response = await fetch(audioUrl)
    if(!response.ok) throw new Error("Failed to download audio from S3")

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    //OpenAI needs a File object with a name
    const file = new File([buffer], "audio.mp4", {type:"video/mp4"})

    //Send to OpenAI - using latest model from docs
    const transcription = await openai.audio.transcriptions.create({
        file,
        model: "config.transcriptionModel",
        response_format:"text",
    })

    return transcription
} catch (error){
    console.error("Transcription error:", error.message)
    throw error
}
}

//Generate AI summary from transript
export async function generateSummary(transcript, title) {
    try {
    const completion = await aiClient.chat.completions.create({
        model: "config.summaryModel",
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
        ${transcript.slice(0, 4000)}`, // limit to 4000 chars to save tokens
            },
        ],
        max_tokens: 200,
        temperature: 0.7,
    })

    return completion.choices[0].message.content
    
} catch(error){
    console.error("Summary error:", error.message)
    throw error
}
}
