import { Groq } from 'groq-sdk';
import { prisma } from './prisma';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function generateStudyPlan({
  userId,
  hoursPerWeek,
  goal,
  targetCareer,
  preferences
}) {
  try {
    // Get user's enrolled paths and related content
    const enrollments = await prisma.pathEnrollment.findMany({
      where: { userId },
      include: {
        path: {
          include: {
            enrollments: true
          }
        }
      }
    });

    // Extract video IDs from enrolled paths
    const pathVideos = enrollments.flatMap(e => {
      try {
        return JSON.parse(e.path.videoIds || '[]');
      } catch {
        return [];
      }
    });

    // Get content details
    const videos = await prisma.content.findMany({
      where: { id: { in: pathVideos } },
      select: {
        id: true,
        title: true,
        duration: true,
        difficulty: true
      }
    });

    // If no videos in paths, get some suggested content based on difficulty
    let contentToLearn = videos;
    if (contentToLearn.length === 0) {
      contentToLearn = await prisma.content.findMany({
        where: { isFree: true },
        select: {
          id: true,
          title: true,
          duration: true,
          difficulty: true
        },
        take: 10
      });
    }

    // Build prompt for AI schedule generation
    const prompt = `You are an expert learning planner. Generate a detailed weekly study schedule for a learner.

LEARNER PROFILE:
- Available time per week: ${hoursPerWeek} hours
- Goal: ${goal}
- Target career: ${targetCareer || 'Not specified'}
- Preferences: ${JSON.stringify(preferences)}

CONTENT TO LEARN (with duration in minutes):
${contentToLearn.map(v => `- ${v.title} (${v.duration || 60} min, difficulty: ${v.difficulty})`).join('\n')}

REQUIREMENTS:
1. Create a realistic weekly schedule that totals ${hoursPerWeek} hours per week
2. Respect the learner's time preferences (${preferences?.preferMorning ? 'morning preference' : 'flexible timing'})
3. Mix different activity types: watching videos, quizzes, flashcards, and review
4. Arrange difficulty progression - easier content early in week, harder later
5. Include breaks and recap sessions
6. Make the schedule sustainable and achievable

OUTPUT FORMAT - Return ONLY valid JSON, no markdown:
{
  "schedule": [
    {
      "day": "Monday",
      "time": "9:00 AM",
      "duration": 60,
      "activity": "Watch: Video Title",
      "contentId": 1,
      "type": "watch_lesson"
    }
  ],
  "reasoning": "Brief explanation"
}`;

    const response = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse AI response
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    let planJson;

    try {
      planJson = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from response if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Convert to database format
    const schedule = planJson.schedule || [];
    const tasks = [];

    // Get the next Monday as start date
    let baseDate = new Date();
    const daysUntilMonday = (1 - baseDate.getDay() + 7) % 7;
    baseDate.setDate(baseDate.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));

    // Process each scheduled item
    for (const item of schedule) {
      try {
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(item.day);
        if (dayIndex === -1) continue;

        const taskDate = new Date(baseDate);
        const currentDayOffset = (dayIndex - baseDate.getDay() + 7) % 7;
        taskDate.setDate(taskDate.getDate() + currentDayOffset);

        // Parse time (format: "9:00 AM" or "9 AM")
        const timeMatch = item.time.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const meridiem = timeMatch[3]?.toUpperCase();

          if (meridiem === 'PM' && hours !== 12) {
            hours += 12;
          } else if (meridiem === 'AM' && hours === 12) {
            hours = 0;
          }

          taskDate.setHours(hours, minutes, 0, 0);
        }

        tasks.push({
          title: item.activity,
          taskType: item.type || 'watch_lesson',
          duration: item.duration || 60,
          contentId: item.contentId ? Number(item.contentId) : null,
          scheduledFor: taskDate
        });
      } catch (err) {
        console.error('Error processing task:', err);
        continue;
      }
    }

    return {
      schedule,
      tasks,
      reasoning: planJson.reasoning
    };
  } catch (error) {
    console.error('Plan generation error:', error);
    throw new Error(`Failed to generate study plan: ${error.message}`);
  }
}

export async function adjustSchedule(planId, reason) {
  try {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: planId },
      include: {
        tasks: {
          orderBy: { scheduledFor: 'asc' }
        }
      }
    });

    if (!plan) throw new Error('Plan not found');

    // Create adjustment record
    const adjustment = await prisma.scheduleAdjustment.create({
      data: {
        planId,
        reason,
        adjustment: JSON.stringify({
          adjustedAt: new Date().toISOString(),
          reason,
          note: `Schedule adjusted due to ${reason}`
        })
      }
    });

    // If falling behind, extend deadline or reduce scope
    if (reason === 'fell_behind') {
      const incompleteTasks = plan.tasks.filter(t => !t.completed);
      if (incompleteTasks.length > 0) {
        // Extend future tasks by 1 day
        await Promise.all(
          incompleteTasks.map(task =>
            prisma.studyTask.update({
              where: { id: task.id },
              data: {
                scheduledFor: new Date(task.scheduledFor.getTime() + 24 * 60 * 60 * 1000)
              }
            })
          )
        );
      }
    }

    return adjustment;
  } catch (error) {
    console.error('Schedule adjustment error:', error);
    throw error;
  }
}
