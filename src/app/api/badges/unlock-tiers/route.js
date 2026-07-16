import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Badge unlock tiers based on engagement
const BADGE_TIERS = {
  // Streak badges
  "Week Warrior": { requirement: 7, type: "streak", icon: "⚔️", unlock: "tools.group_challenges" },
  "Month Master": { requirement: 30, type: "streak", icon: "👑", unlock: "tools.ai_coach" },
  "Century Strong": {
    requirement: 100,
    type: "streak",
    icon: "💯",
    unlock: "tools.custom_paths",
  },

  // Activity badges
  "100 Learners": {
    requirement: 100,
    type: "activities",
    icon: "📚",
    unlock: "features.leaderboard_boost",
  },
  "Quiz Master": {
    requirement: 50,
    type: "quizzes_completed",
    icon: "🎯",
    unlock: "tools.debate_partner_ai",
  },

  // Community badges
  "Study Group Legend": {
    requirement: 10,
    type: "group_messages",
    icon: "🤝",
    unlock: "tools.group_hosting",
  },
  "Helpful Mentor": {
    requirement: 20,
    type: "helpful_comments",
    icon: "🧑‍🏫",
    unlock: "features.mentor_badge",
  },

  // Mastery badges
  "Concept Champion": {
    requirement: 10,
    type: "concepts_mastered",
    icon: "🏆",
    unlock: "tools.concept_mapping",
  },
  "Course Completer": {
    requirement: 5,
    type: "courses_completed",
    icon: "🎓",
    unlock: "features.certificate_share",
  },
};

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(user.userId);

    // Get user stats
    const [
      streak,
      quizAttempts,
      activitiesCount,
      groupMessages,
      concepts,
      courses,
      comments,
      existingBadges,
    ] = await Promise.all([
      prisma.studyStreak.findUnique({ where: { userId } }),
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.activeLearner.count({ where: { userId } }),
      prisma.studyGroupMessage.count({ where: { authorId: userId } }),
      prisma.conceptMastery.count({
        where: { userId, masteryScore: { gte: 0.8 } },
      }),
      prisma.watchProgress.count({
        where: { userId, completed: true },
      }),
      prisma.comment.count({ where: { userId, helpful: true } }),
      prisma.badgeIssuance.findMany({ where: { userId } }),
    ]);

    const userStats = {
      streak: streak?.current || 0,
      quizzes_completed: quizAttempts,
      activities: activitiesCount,
      group_messages: groupMessages,
      concepts_mastered: concepts,
      courses_completed: courses,
      helpful_comments: comments,
    };

    // Check which badges are unlocked
    const unlockedBadges = [];
    const nextBadges = [];

    Object.entries(BADGE_TIERS).forEach(([badgeName, config]) => {
      const requirement = config.requirement;
      const stat = userStats[config.type];
      const alreadyEarned = existingBadges.some((b) => b.badgeId === badgeName);

      if (stat >= requirement && !alreadyEarned) {
        unlockedBadges.push({
          name: badgeName,
          icon: config.icon,
          stat,
          requirement,
          unlocksFeature: config.unlock,
          readyToClaim: true,
        });
      } else if (!alreadyEarned) {
        const progress = Math.round((stat / requirement) * 100);
        nextBadges.push({
          name: badgeName,
          icon: config.icon,
          stat,
          requirement,
          progress,
          unlocksFeature: config.unlock,
        });
      }
    });

    // Sort next badges by progress (closest to unlock first)
    nextBadges.sort((a, b) => b.progress - a.progress);

    return Response.json({
      unlockedBadges,
      nextBadges: nextBadges.slice(0, 3),
      userStats,
      progressToNextUnlock:
        nextBadges.length > 0 ? nextBadges[0].progress : 100,
    });
  } catch (error) {
    console.error("Badge tier error:", error);
    return Response.json({ error: "Failed to calculate badges" }, { status: 500 });
  }
}

// Claim an unlocked badge
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { badgeName } = await req.json();
    const userId = Number(user.userId);

    if (!BADGE_TIERS[badgeName]) {
      return Response.json({ error: "Invalid badge" }, { status: 400 });
    }

    // Create badge issuance
    const badge = await prisma.badgeIssuance.create({
      data: {
        userId,
        badgeId: badgeName,
        issuedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      badge,
      unlockedFeature: BADGE_TIERS[badgeName].unlock,
    });
  } catch (error) {
    console.error("Claim badge error:", error);
    return Response.json({ error: "Failed to claim badge" }, { status: 500 });
  }
}
