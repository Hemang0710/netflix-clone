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
    const contentId = searchParams.get("contentId");
    const color = searchParams.get("color");

    const where = { userId: Number(user.userId) };
    if (contentId) where.contentId = parseInt(contentId);
    if (color) where.color = color;

    const highlights = await prisma.highlight.findMany({
      where,
      include: {
        content: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also get notes for comprehensive view
    const notes = await prisma.note.findMany({
      where: { userId: Number(user.userId) },
      include: { content: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const stats = {
      totalHighlights: highlights.length,
      totalNotes: notes.length,
      highlightsByColor: highlights.reduce((acc, h) => {
        acc[h.color] = (acc[h.color] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      highlights,
      notes,
      stats,
    });
  } catch (error) {
    console.error("[HIGHLIGHTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, text, startTime, color, summary } = body;

    if (!contentId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const highlight = await prisma.highlight.create({
      data: {
        userId: Number(user.userId),
        contentId: parseInt(contentId),
        text,
        startTime: startTime ? parseFloat(startTime) : null,
        color: color || "yellow",
        summary,
      },
      include: { content: { select: { id: true, title: true } } },
    });

    return NextResponse.json(highlight, { status: 201 });
  } catch (error) {
    console.error("[HIGHLIGHTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create highlight" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Highlight ID required" },
        { status: 400 }
      );
    }

    const highlight = await prisma.highlight.findUnique({
      where: { id: parseInt(id) },
    });

    if (!highlight || highlight.userId !== Number(user.userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.highlight.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HIGHLIGHTS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete highlight" },
      { status: 500 }
    );
  }
}
