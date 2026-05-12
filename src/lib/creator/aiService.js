import { Anthropic } from '@anthropic-ai/sdk';
import prisma from '@/lib/prisma';

const client = new Anthropic();

export async function generateScript(topic, duration, style, userContext = {}) {
  const prompt = `Generate a comprehensive video script for the following:
Topic: ${topic}
Duration: ${duration} minutes
Style: ${style}
${userContext.targetAudience ? `Target Audience: ${userContext.targetAudience}` : ''}
${userContext.keyPoints ? `Key Points to Cover: ${userContext.keyPoints}` : ''}

Format the script with:
- Clear sections/segments
- Estimated time for each section
- Speaker notes
- Key transitions
- Call-to-action at the end

Make it engaging and educational.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    script: response.content[0].text,
    wordCount: response.content[0].text.split(' ').length,
    estimatedDuration: duration,
    generatedAt: new Date(),
  };
}

export async function generateThumbnail(title, mood, style, userContext = {}) {
  const prompt = `Generate a detailed DALL-E prompt for creating a YouTube thumbnail with:
Title: ${title}
Mood: ${mood}
Style: ${style}
${userContext.colors ? `Preferred Colors: ${userContext.colors}` : ''}
${userContext.elements ? `Key Elements: ${userContext.elements}` : ''}

Requirements:
- Create a prompt suitable for DALL-E 3
- The thumbnail should be eye-catching and clickable
- Include text overlay suggestions
- Suggest layout and composition
- Make it professional yet engaging

Return ONLY the DALL-E prompt, followed by layout and design suggestions on a new line.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const [dallePrompt, ...suggestions] = content.split('\n\n');

  return {
    dallePrompt: dallePrompt.trim(),
    designSuggestions: suggestions.join('\n\n').trim(),
    mood,
    style,
    generatedAt: new Date(),
  };
}

export async function generateCourseOutline(subject, level, numModules, userContext = {}) {
  const prompt = `Create a comprehensive course outline for:
Subject: ${subject}
Level: ${level} (Beginner/Intermediate/Advanced)
Number of Modules: ${numModules}
${userContext.targetAudience ? `Target Audience: ${userContext.targetAudience}` : ''}
${userContext.objectives ? `Learning Objectives: ${userContext.objectives}` : ''}

Structure the outline with:
- Module title and description
- Learning outcomes for each module
- Estimated duration (hours)
- Key topics and subtopics
- Assessment methods
- Prerequisites
- Resources needed

Make it practical and implementable.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const outline = parseOutlineResponse(response.content[0].text);

  return {
    subject,
    level,
    moduleCount: numModules,
    outline,
    totalEstimatedHours: calculateTotalHours(outline),
    generatedAt: new Date(),
  };
}

function parseOutlineResponse(text) {
  const modules = [];
  const moduleRegex = /Module\s+(\d+)[:\s]+(.*?)(?=Module\s+\d+|$)/gis;
  let match;

  while ((match = moduleRegex.exec(text)) !== null) {
    modules.push({
      moduleNumber: parseInt(match[1]),
      content: match[2].trim(),
    });
  }

  return modules.length > 0 ? modules : [{ moduleNumber: 1, content: text }];
}

function calculateTotalHours(outline) {
  let total = 0;
  const hourRegex = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/gi;

  outline.forEach((module) => {
    const matches = module.content.match(hourRegex);
    if (matches) {
      matches.forEach((match) => {
        const hours = parseFloat(match.match(/\d+(?:\.\d+)?/)[0]);
        total += hours;
      });
    }
  });

  return total || outline.length * 2;
}

export async function analyzeContentGapsWithAI(contentId, confusionTopics) {
  if (!confusionTopics || confusionTopics.length === 0) return null;

  const prompt = `Based on the following confusion topics that viewers experienced in a video:
${confusionTopics.join('\n')}

Provide:
1. Root cause analysis for each confusion point
2. Suggested explanation or additional content needed
3. Where to insert it in the video
4. Estimated duration for the clarification
5. Resources or examples to include

Format as actionable recommendations for a content creator.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    analysis: response.content[0].text,
    contentId,
    analyzedAt: new Date(),
  };
}

export async function generateThumbnailImage(dallePrompt) {
  try {
    // Note: In production, you'd use DALL-E 3 API
    // For now, return the prompt for manual generation or external API call
    return {
      prompt: dallePrompt,
      status: 'ready_for_generation',
      note: 'Use DALL-E 3 API to generate image from prompt',
    };
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}
