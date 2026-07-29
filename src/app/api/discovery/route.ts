import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();

    // The URL of your new Python FastAPI server
    // (Use localhost:8000 for local testing, or your deployed URL later)
    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    // Forward the request to your Python Agents
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/api/agents/generate-course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, model: "google/gemma-4-31b-it:free" }),
    });

    if (!pythonResponse.ok) {
      throw new Error("Python Agent Backend failed to respond");
    }

    const data = await pythonResponse.json();

    // Return the agent-processed Gemma output back to your React frontend
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Discovery Engine Error:", error);
    return NextResponse.json({ error: "Failed to generate specialization" }, { status: 500 });
  }
}
