import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordVideoWatch, recordQuizAttempt, recordConceptMastery } from "@/lib/learningMetrics";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { activityType, contentId, data } = body;

    if (!activityType) {
      return NextResponse.json(
        { error: "Activity type required" },
        { status: 400 }
      );
    }

    let result;

    switch (activityType) {
      case "video_watch":
        if (!contentId || !data?.duration) {
          return NextResponse.json(
            { error: "Missing video watch data" },
            { status: 400 }
          );
        }
        result = await recordVideoWatch(Number(user.userId), parseInt(contentId), data.duration);
        break;

      case "quiz_complete":
        if (!contentId || data?.score === undefined) {
          return NextResponse.json(
            { error: "Missing quiz data" },
            { status: 400 }
          );
        }
        result = await recordQuizAttempt(Number(user.userId), parseInt(contentId), data.score);
        break;

      case "concept_mastery":
        if (!data?.concept || data?.score === undefined) {
          return NextResponse.json(
            { error: "Missing concept mastery data" },
            { status: 400 }
          );
        }
        result = await recordConceptMastery(
          Number(user.userId),
          data.concept,
          data.score,
          contentId ? parseInt(contentId) : null
        );
        break;

      default:
        return NextResponse.json(
          { error: "Unknown activity type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error("[TRACK_ACTIVITY]", error);
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    );
  }
}
