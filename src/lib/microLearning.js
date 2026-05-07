import Groq from "@anthropic-ai/sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateMicroLessons({
  transcript,
  duration,
  title,
  contentId,
}) {
  const prompt = `
You are an expert at breaking down educational videos into bite-sized lessons.

Video title: "${title}"
Total duration: ${duration} seconds
Transcript:
${transcript}

Identify natural concept boundaries in the transcript. For each concept, provide:
1. Concept name
2. Start and end timestamps (in seconds)
3. Brief description
4. Micro-lesson title

Output JSON format:
{
  "microLessons": [
    {
      "title": "Python Decorators: Overview",
      "concept": "decorators",
      "description": "Introduction to what decorators are and why they're useful",
      "startTimestamp": 0,
      "endTimestamp": 120,
      "duration": 120
    }
  ]
}

Constraints:
- Each micro-lesson should be 2-5 minutes (120-300 seconds)
- Maximum 15 micro-lessons per video
- Concepts should be atomic and self-contained
- Titles should be specific and descriptive
- Order matters: list them chronologically

Respond ONLY with valid JSON.
`;

  try {
    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const parsed = JSON.parse(response.content[0].text);

    const microLessons = parsed.microLessons.map((lesson, idx) => ({
      contentId,
      title: lesson.title,
      description: lesson.description,
      concept: lesson.concept,
      startTimestamp: lesson.startTimestamp,
      endTimestamp: lesson.endTimestamp,
      duration: lesson.duration,
      order: idx + 1,
      transcriptSegment: extractTranscriptSegment(
        transcript,
        lesson.startTimestamp,
        lesson.endTimestamp
      ),
    }));

    return { microLessons };
  } catch (error) {
    console.error("Error generating micro-lessons:", error);
    throw error;
  }
}

function extractTranscriptSegment(transcript, start, end) {
  if (!transcript) return "";

  const words = transcript.split(" ");
  const avgWordsPerSecond = words.length / 3600;

  const startIdx = Math.max(0, Math.floor(start * avgWordsPerSecond));
  const endIdx = Math.min(words.length, Math.floor(end * avgWordsPerSecond));

  return words.slice(startIdx, endIdx).join(" ").substring(0, 500);
}
