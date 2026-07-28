import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, activeCourse } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: "⚠️ API key not configured in Vercel. Please set OPENROUTER_API_KEY in Vercel Environment Variables.",
      });
    }

    const systemPrompt = `You are Jinvexa Mentor, an encouraging, deeply intelligent technical tutor powered by Google Gemma 4 31B. 
    Context: You are helping the student with their active learning journey: ${activeCourse || "General Technology & AI"}.
    Be articulate, concise, structured, and use relevant technical examples.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

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
        messages: formattedMessages,
        temperature: 0.5,
      }),
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    return NextResponse.json({ response: "Error generating mentor response: " + error.message });
  }
}
