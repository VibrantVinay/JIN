import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, activeCourse } = await req.json();
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response:
          "I am running in offline preview mode. Add an API key (like GROQ_API_KEY or NVIDIA_API_KEY) to enable live AI reasoning!",
      });
    }

    const systemPrompt = `You are Jinvexa Learning Coach, an encouraging AI tutor.
    Context: The student is studying "${activeCourse || "AI & Software Systems"}".
    Give direct, concise, highly helpful technical answers in 2-4 sentences max.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    // 🚨 4-Second Timeout Safety Cutoff
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const apiUrl = process.env.GROQ_API_KEY
      ? "https://api.groq.com/openai/v1/chat/completions"
      : process.env.NVIDIA_API_KEY
      ? "https://integrate.api.nvidia.com/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

    const modelName = process.env.GROQ_API_KEY
      ? "llama-3.1-8b-instant"
      : process.env.NVIDIA_API_KEY
      ? "meta/llama-3.3-70b-instruct"
      : "google/gemma-4-31b-it:free";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({
        response:
          "I am reviewing your course material. Please ask your specific question once more!",
      });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (reply) {
      return NextResponse.json({ response: reply });
    } else {
      return NextResponse.json({
        response:
          "Great question! In this module, we focus on modular architecture and scalability. What specific concept would you like me to break down?",
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      response:
        "Hello! I am ready to help you master this concept. What topic or code snippet should we analyze?",
    });
  }
}
