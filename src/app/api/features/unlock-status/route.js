import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Progressive feature unlocks
const FEATURE_UNLOCKS = {
  "Group Challenges": {
    icon: "⚔️",
    description: "Challenge friends to quiz duels",
    requirement: { type: "streak", value: 7 },
    enabled: false,
  },
  "AI Study Coach": {
    icon: "🤖",
    description: "Personalized AI tutor and study planner",
    requirement: { type: "streak", value: 30 },
    enabled: false,
  },
  "Custom Learning Paths": {
    icon: "🗺️",
    description: "Design your own curriculum",
    requirement: { type: "concepts_mastered", value: 10 },
    enabled: false,
  },
  "Debate Partner AI": {
    icon: "💬",
    description: "AI opponent for concept debates",
    requirement: { type: "quizzes_completed", value: 50 },
    enabled: false,
  },
  "Concept Mapping": {
    icon: "🧠",
    description: "Visual knowledge mapping tools",
    requirement: { type: "concepts_mastered", value: 5 },
    enabled: false,
  },
  "Group Hosting": {
    icon: "🎙️",
    description: "Host your own study groups",
    requirement: { type: "group_messages", value: 10 },
    enabled: false,
  },
  "Study Streak Boost": {
    icon: "⚡",
    description: "Accelerate your streak with challenges",
    requirement: { type: "streak", value: 14 },
    enabled: false,
  },
  "Certification Export": {
    icon: "📜",
    description: "Export and share certificates",
    requirement: { type: "courses_completed", value: 3 },
    enabled: false,
  },
};

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(user.userId);

    // Get user stats
    const [streak, quizzes, concepts, groups, courses, activities] = await Promise.all([
      prisma.studyStreak.findUnique({ where: { userId } }),
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.conceptMastery.count({
        where: { userId, masteryScore: { gte: 0.8 } },
      }),
      prisma.studyGroupMessage.count({ where: { userId } }),
      prisma.watchProgress.count({ where: { userId, completed: true } }),
      prisma.activeLearner.count({ where: { userId } }),
    ]);

    const stats = {
      streak: streak?.currentStreak || 0,
      quizzes_completed: quizzes,
      concepts_mastered: concepts,
      group_messages: groups,
      courses_completed: courses,
      activities,
    };

    // Check which features are unlocked
    const unlocked = [];
    const locked = [];

    Object.entries(FEATURE_UNLOCKS).forEach(([featureName, config]) => {
      const req = config.requirement;
      const stat = stats[req.type];
      const isUnlocked = stat >= req.value;

      if (isUnlocked) {
        unlocked.push({
          name: featureName,
          icon: config.icon,
          description: config.description,
          unlockedAt: new Date(), // Would be stored in DB
        });
      } else {
        const progress = Math.round((stat / req.value) * 100);
        locked.push({
          name: featureName,
          icon: config.icon,
          description: config.description,
          requirement: req.value,
          type: req.type,
          progress,
          remaining: Math.max(0, req.value - stat),
        });
      }
    });

    // Sort locked by progress (closest to unlock first)
    locked.sort((a, b) => b.progress - a.progress);

    return Response.json({
      unlocked,
      locked: locked.slice(0, 3),
      totalFeatures: Object.keys(FEATURE_UNLOCKS).length,
      unlockedCount: unlocked.length,
      stats,
    });
  } catch (error) {
    console.error("Unlock status error:", error);
    return Response.json({ error: "Failed to get unlock status" }, { status: 500 });
  }
}
