import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let goal = "AI & Technology";
  try {
    const body = await req.json();
    if (body?.goal) goal = body.goal;

    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.OPENROUTER_API_KEY;

    // Fast local fallback roadmap if API key is missing or request times out
    const fallbackRoadmap = {
      roadmap: [
        {
          phase: 1,
          title: "Core Foundations & Theory",
          hours: 15,
          topics: ["Syntax Fundamentals", "Core Concepts", "Environment Setup"],
          description: `Comprehensive foundational mastery of ${goal}.`,
        },
        {
          phase: 2,
          title: "Advanced Engineering & Frameworks",
          hours: 25,
          topics: [
            "Architecture Design",
            "API Integration",
            "Performance Optimization",
          ],
          description:
            "Hands-on implementation using industry-standard tooling and best practices.",
        },
        {
          phase: 3,
          title: "Production Capstone Deployment",
          hours: 20,
          topics: [
            "Full System Build",
            "Automated Testing",
            "Cloud Deployment",
          ],
          description:
            "End-to-end execution of a real-world autonomous production application.",
        },
      ],
    };

    if (!apiKey) {
      return NextResponse.json(fallbackRoadmap);
    }

    const systemPrompt = `You are Jinvexa AI, an ultra-fast curriculum architect.
    Analyze the goal: "${goal}".
    
    Return STRICT JSON ONLY without markdown fences or backticks:
    {
      "roadmap": [
        {
          "phase": 1,
          "title": "Module Title",
          "hours": 16,
          "topics": ["Topic 1", "Topic 2", "Topic 3"],
          "description": "Clear 2-sentence summary of what will be mastered."
        },
        {
          "phase": 2,
          "title": "Module Title",
          "hours": 20,
          "topics": ["Topic 1", "Topic 2"],
          "description": "Deep dive technical execution and tooling."
        },
        {
          "phase": 3,
          "title": "Capstone Project",
          "hours": 14,
          "topics": ["Full System Architecture"],
          "description": "Real-world autonomous implementation."
        }
      ]
    }`;

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
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a professional 3-phase specialization for: ${goal}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) return NextResponse.json(fallbackRoadmap);

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) return NextResponse.json(fallbackRoadmap);

    const cleanJson = rawContent.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    return NextResponse.json({
      roadmap: [
        {
          phase: 1,
          title: `Foundations of ${goal}`,
          hours: 15,
          topics: ["Core Theory", "Syntax Basics"],
          description: "Primary introductory module.",
        },
        {
          phase: 2,
          title: "Advanced Practical Application",
          hours: 22,
          topics: ["System Architecture", "Tooling"],
          description: "Deep-dive practical execution.",
        },
        {
          phase: 3,
          title: "Real-World Capstone",
          hours: 18,
          topics: ["Deployment", "Optimization"],
          description: "Final portfolio build.",
        },
      ],
    });
  }
}
