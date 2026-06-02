import prisma from "@/lib/prisma";

export async function trackLearningMetric(userId, metricType, value, unit, subject = null, contentId = null) {
  try {
    const metric = await prisma.learningMetric.create({
      data: {
        userId,
        metricType,
        value,
        unit,
        subject,
        contentId,
      },
    });

    // Update study streak
    await updateStudyStreak(userId);

    // Update learning goals progress
    await updateGoalsProgress(userId, metricType, value);

    return metric;
  } catch (error) {
    console.error("[TRACK_LEARNING_METRIC]", error);
  }
}

export async function updateStudyStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = await prisma.studyStreak.findUnique({
      where: { userId },
    });

    const lastActivityDate = streak?.lastActivityDate
      ? new Date(streak.lastActivityDate)
      : null;
    lastActivityDate?.setHours(0, 0, 0, 0);

    if (!streak) {
      streak = await prisma.studyStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          streakStartDate: today,
        },
      });
      return streak;
    }

    const isTodayAlreadyRecorded =
      lastActivityDate?.getTime() === today.getTime();

    if (isTodayAlreadyRecorded) {
      return streak;
    }

    const isConsecutiveDay =
      lastActivityDate?.getTime() === yesterday.getTime();

    let newCurrentStreak = isConsecutiveDay ? streak.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);
    const newStreakStartDate = isConsecutiveDay ? streak.streakStartDate : today;

    const updated = await prisma.studyStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
        streakStartDate: newStreakStartDate,
      },
    });

    return updated;
  } catch (error) {
    console.error("[UPDATE_STUDY_STREAK]", error);
  }
}

export async function updateGoalsProgress(userId, metricType, value) {
  try {
    const now = new Date();

    const goals = await prisma.learningGoal.findMany({
      where: {
        userId,
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const goal of goals) {
      let increment = 0;

      if (
        goal.category === "time_spent" &&
        metricType === "time_spent"
      ) {
        if (goal.unit === "hours") {
          increment = value / 60;
        } else if (goal.unit === "minutes") {
          increment = value;
        }
      } else if (
        goal.category === "completion_rate" &&
        metricType === "videos_watched"
      ) {
        increment = value;
      } else if (
        goal.category === "quiz_score" &&
        metricType === "quiz_completed"
      ) {
        increment = value / 100;
      }

      if (increment > 0) {
        const newProgress = Math.min(
          goal.currentProgress + increment,
          goal.target
        );

        let status = goal.status;
        if (newProgress >= goal.target) {
          status = "completed";
        }

        await prisma.learningGoal.update({
          where: { id: goal.id },
          data: {
            currentProgress: newProgress,
            status,
          },
        });
      }
    }
  } catch (error) {
    console.error("[UPDATE_GOALS_PROGRESS]", error);
  }
}

export async function recordQuizAttempt(userId, contentId, score) {
  try {
    await trackLearningMetric(userId, "quiz_completed", score, "score", null, contentId);
  } catch (error) {
    console.error("[RECORD_QUIZ_ATTEMPT]", error);
  }
}

export async function recordVideoWatch(userId, contentId, duration) {
  try {
    await trackLearningMetric(userId, "time_spent", duration, "minutes", null, contentId);
  } catch (error) {
    console.error("[RECORD_VIDEO_WATCH]", error);
  }
}

export async function recordConceptMastery(userId, concept, score, contentId = null) {
  try {
    await prisma.conceptMastery.upsert({
      where: {
        userId_contentId_concept: {
          userId,
          contentId: contentId || 0,
          concept,
        },
      },
      create: {
        userId,
        contentId,
        concept,
        masteryScore: score,
        lastScore: score,
        lastReviewAt: new Date(),
      },
      update: {
        masteryScore: Math.max(score, 0),
        lastScore: score,
        reviewCount: { increment: 1 },
        lastReviewAt: new Date(),
      },
    });

    await updateStudyStreak(userId);
  } catch (error) {
    console.error("[RECORD_CONCEPT_MASTERY]", error);
  }
}

export async function getLearningSummary(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.learningMetric.findMany({
      where: {
        userId,
        recordedAt: { gte: startDate },
      },
    });

    const summary = {
      totalMetrics: metrics.length,
      timeSpent: 0,
      videosWatched: 0,
      quizzesCompleted: 0,
      avgQuizScore: 0,
      byType: {},
    };

    let totalQuizScore = 0;
    let quizCount = 0;

    for (const metric of metrics) {
      summary.byType[metric.metricType] =
        (summary.byType[metric.metricType] || 0) + metric.value;

      if (metric.metricType === "time_spent" && metric.unit === "minutes") {
        summary.timeSpent += metric.value;
      } else if (metric.metricType === "videos_watched") {
        summary.videosWatched += metric.value;
      } else if (metric.metricType === "quiz_completed") {
        summary.quizzesCompleted += 1;
        totalQuizScore += metric.value;
        quizCount += 1;
      }
    }

    if (quizCount > 0) {
      summary.avgQuizScore = Math.round(totalQuizScore / quizCount);
    }

    return summary;
  } catch (error) {
    console.error("[GET_LEARNING_SUMMARY]", error);
    return null;
  }
}
