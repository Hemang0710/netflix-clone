import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month"; // week | month | year | all

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);

    if (range === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "year") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Time breakdown by day
    const dailyTime = await prisma.$queryRaw`
      SELECT
        DATE(wp."updatedAt") as date,
        SUM(wp.duration) / 60.0 as hours_spent,
        COUNT(DISTINCT wp."contentId") as lessons_watched
      FROM "WatchProgress" wp
      WHERE wp."userId" = ${Number(user.userId)}
        AND wp."updatedAt" >= ${startDate}
      GROUP BY DATE(wp."updatedAt")
      ORDER BY date DESC
    `;

    // Time by lesson
    const timePerLesson = await prisma.$queryRaw`
      SELECT
        c.title,
        c.genre,
        wp.duration / 60.0 as hours_spent,
        ROUND(
          CASE
            WHEN c.duration > 0 THEN (wp.duration / c.duration) * 100
            ELSE 0
          END
        ) as percent_watched,
        wp.completed,
        wp."updatedAt"
      FROM "WatchProgress" wp
      JOIN "Content" c ON wp."contentId" = c.id
      WHERE wp."userId" = ${Number(user.userId)}
        AND wp."updatedAt" >= ${startDate}
      ORDER BY wp."updatedAt" DESC
      LIMIT 50
    `;

    // Total time summary
    const totalHours =
      dailyTime.length > 0
        ? dailyTime.reduce((sum, d) => sum + (parseFloat(d.hours_spent) || 0), 0)
        : 0;

    const avgDailyHours =
      dailyTime.length > 0 ? (totalHours / dailyTime.length).toFixed(2) : 0;

    const daysActive = dailyTime.length;

    // Study consistency score (0-100)
    const daysSinceStart = Math.max(
      1,
      Math.floor((now - startDate) / (24 * 60 * 60 * 1000))
    );
    const consistencyScore = Math.round((daysActive / daysSinceStart) * 100);

    // Session breakdown
    const sessionData = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT DATE(wp."updatedAt")) as study_days,
        AVG(session_duration) as avg_session_hours,
        MAX(session_duration) as longest_session_hours
      FROM (
        SELECT
          wp."userId",
          DATE(wp."updatedAt") as date,
          SUM(wp.duration) / 60.0 as session_duration
        FROM "WatchProgress" wp
        WHERE wp."userId" = ${Number(user.userId)}
          AND wp."updatedAt" >= ${startDate}
        GROUP BY wp."userId", DATE(wp."updatedAt")
      ) sessions
    `;

    // Best study hours (most common learning time)
    const bestStudyHours = await prisma.$queryRaw`
      SELECT
        EXTRACT(HOUR FROM wp."updatedAt")::int as hour,
        COUNT(*) as frequency,
        SUM(wp.duration) / 60.0 as total_hours
      FROM "WatchProgress" wp
      WHERE wp."userId" = ${Number(user.userId)}
        AND wp."updatedAt" >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM wp."updatedAt")
      ORDER BY total_hours DESC
      LIMIT 3
    `;

    return NextResponse.json({
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        avgDailyHours: parseFloat(avgDailyHours),
        daysActive,
        consistencyScore,
        daysSinceStart,
      },
      dailyTime: dailyTime.map((d) => ({
        date: d.date,
        hoursSpent: Math.round(parseFloat(d.hours_spent) * 10) / 10,
        lessonsWatched: d.lessons_watched,
      })),
      timePerLesson: timePerLesson.map((t) => ({
        title: t.title,
        genre: t.genre,
        hoursSpent: Math.round(parseFloat(t.hours_spent) * 10) / 10,
        percentWatched: t.percent_watched,
        completed: t.completed,
        date: t.updatedAt,
      })),
      sessionStats: {
        studyDays: sessionData[0]?.study_days || 0,
        avgSessionHours: sessionData[0]?.avg_session_hours
          ? Math.round(parseFloat(sessionData[0].avg_session_hours) * 10) / 10
          : 0,
        longestSession: sessionData[0]?.longest_session_hours
          ? Math.round(parseFloat(sessionData[0].longest_session_hours) * 10) /
            10
          : 0,
      },
      bestStudyHours: bestStudyHours.map((h) => ({
        hour: h.hour,
        frequency: h.frequency,
        totalHours: Math.round(parseFloat(h.total_hours) * 10) / 10,
      })),
      range,
    });
  } catch (error) {
    console.error("[TIME_ANALYTICS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch time analytics" },
      { status: 500 }
    );
  }
}
