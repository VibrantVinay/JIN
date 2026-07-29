// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Session from "@/models/Session";

// GET: Load all sessions for a logged-in user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default_user";

    await connectToDatabase();

    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("MongoDB GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions from MongoDB" },
      { status: 500 }
    );
  }
}

// POST: Create or save a new specialization session to MongoDB
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const newSession = await Session.create({
      userId: body.userId || "default_user",
      topic: body.topic,
      mode: body.mode || "Goal-Based",
      created:
        body.created || new Date().toISOString().slice(0, 16).replace("T", " "),
      messages: body.messages || 1,
      progress: body.progress || "10%",
      lessonsGenerated: body.lessonsGenerated || 0,
      audioFiles: body.audioFiles || 0,
      textFiles: body.textFiles || 0,
      status: body.status || "Complete • Ready for Classroom",
      roadmap: body.roadmap || [],
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error: any) {
    console.error("MongoDB POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save session to MongoDB", details: error.message },
      { status: 500 }
    );
  }
}
