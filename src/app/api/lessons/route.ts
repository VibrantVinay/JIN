import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, lessonTitle } = await req.json();

    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.OPENROUTER_API_KEY;

    const fallbackLesson = {
      content: `### ${lessonTitle || "Lesson Overview"}

Welcome to **${lessonTitle || "this module"}** in the **${topic || "Specialization"}** track.

#### Key Principles & Overview
In this module, we explore the core engineering principles behind ${topic || "this topic"}. 

1. **System Fundamentals**: Establishing basic mathematical and logical frameworks.
2. **Practical Implementation**: Applying theory to physical or software implementations.
3. **Optimization & Control**: Fine-tuning latency, accuracy, and operational efficiency.

#### Practical Application
To put this into practice, analyze how ${lessonTitle || "this concept"} handles unexpected input variance and edge-case execution.`,
    };

    if (!apiKey) {
      return NextResponse.json(fallbackLesson);
    }

    const systemPrompt = `You are Jinvexa AI Professor. Write an engaging, highly detailed, 3-paragraph educational lesson transcript for:
    Specialization Topic: "${topic}"
    Lesson Title: "${lessonTitle}"
    
    Include 3 structured headings, clear technical explanations, and a short code or mathematical example relevant to "${topic}".`;

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
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) return NextResponse.json(fallbackLesson);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    return NextResponse.json({ content: content || fallbackLesson.content });
  } catch (error) {
    return NextResponse.json({
      content: `### Core Fundamentals
Welcome to your lesson. Explore the core principles of your selected specialization.`,
    });
  }
}
