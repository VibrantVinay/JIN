import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, topic, userAnswers } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    if (action === "generate") {
      const prompt = `You are an AI Evaluator powered by Google Gemma 4 31B. Generate a 2-question technical assessment for topic: "${topic}".
      Return STRICT JSON ONLY:
      {
        "mcq": {
          "question": "Question text...",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 1
        },
        "essay": {
          "question": "Essay question text..."
        }
      }`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jinvexa.vercel.app",
          "X-Title": "Jinvexa Learning AI",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it:free",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
      });

      const data = await res.json();
      return NextResponse.json(JSON.parse(data.choices[0].message.content));
    }

    if (action === "evaluate") {
      const prompt = `You are an AI Evaluator powered by Google Gemma 4 31B. Evaluate student answers for topic "${topic}":
      User MCQ Selected Index: ${userAnswers.mcq}
      User Essay Answer: "${userAnswers.essay}"

      Return STRICT JSON ONLY:
      {
        "score": 85,
        "grade": "A",
        "passed": true,
        "feedback": "Detailed AI pedagogical feedback explaining strong points and areas to review..."
      }`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jinvexa.vercel.app",
          "X-Title": "Jinvexa Learning AI",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it:free",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
      });

      const data = await res.json();
      return NextResponse.json(JSON.parse(data.choices[0].message.content));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
