import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, activeCourse } = await req.json();
    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response: "⚠️ NVIDIA API key is currently missing in Vercel settings. Please add your secret 'NVIDIA_API_KEY' in the Vercel Environment Variables tab to enable real-time inference.",
      });
    }

    const systemPrompt = `You are Jinvexa Learning Coach, an expert AI pedagogical tutor powered by NVIDIA NIM cloud reasoning.
    The student is currently studying: "${activeCourse || "AI Systems & Technology"}".
    Provide clear, encouraging, highly structured technical explanations. Use formatting and concise code/math examples where appropriate.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    // NVIDIA NIM Cloud API Endpoint
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct", // Fixed guaranteed live NVIDIA NIM chat model
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        response: `⚠️ NVIDIA Reasoning Engine reported an issue (Status: ${res.status}). Please check your API key credits or try again in a moment.`,
      });
    }

    const data = await res.json();
    
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      return NextResponse.json({ response: data.choices[0].message.content });
    } else {
      return NextResponse.json({ response: "I am ready to assist! Please ask your specific coursework question." });
    }
  } catch (error: any) {
    console.error("Mentor Route Error:", error);
    return NextResponse.json({ response: "I experienced a temporary network interruption. Please send your message again!" });
  }
}
