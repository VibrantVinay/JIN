import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();
    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    // Bulletproof Fallback Curriculum in case API is missing or times out
    const fallbackRoadmap = {
      roadmap: [
        {
          phase: 1,
          title: "Foundations & Architectural Principles",
          hours: 18,
          topics: ["Core Theory", "Mathematical Syntax", "System Setup"],
          description: `Comprehensive foundational dive into ${goal || "the target discipline"}.`
        },
        {
          phase: 2,
          title: "Advanced Engineering & Tooling",
          hours: 22,
          topics: ["Framework Integration", "Optimization", "Debugging"],
          description: "Hands-on implementation using industry-standard enterprise tooling."
        },
        {
          phase: 3,
          title: "Autonomous Capstone Deployment",
          hours: 15,
          topics: ["Production Build", "Testing", "Live Deployment"],
          description: "End-to-end execution of a production-grade specialized project."
        }
      ]
    };

    if (!apiKey) {
      return NextResponse.json(fallbackRoadmap);
    }

    const systemPrompt = `You are Jinvexa AI, an enterprise curriculum architect powered by NVIDIA Nemotron.
    Analyze the user's career/learning goal: "${goal}".
    
    Return STRICT JSON ONLY without any markdown code fences, commentary, or backticks:
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

    // NVIDIA NIM Cloud API Endpoint
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct", // High-reasoning NVIDIA model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a professional 3-phase specialization for: ${goal}` }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.warn("NVIDIA API returned status:", res.status);
      return NextResponse.json(fallbackRoadmap);
    }

    const data = await res.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json(fallbackRoadmap);
    }

    // Safely strip markdown formatting fences before parsing
    const cleanJson = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("Discovery Route Error:", error);
    return NextResponse.json({
      roadmap: [
        { phase: 1, title: "Core System Principles", hours: 16, topics: ["Theory", "Syntax"], description: "Initial curriculum module." },
        { phase: 2, title: "Practical Application", hours: 20, topics: ["Execution", "Tooling"], description: "Advanced hands-on implementation." }
      ]
    });
  }
}
