import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { goal, currentStep, userResponse } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: "Missing API Key. Please add OPENROUTER_API_KEY in Vercel environment variables.",
      }, { status: 400 });
    }

    const systemPrompt = `You are Jinvexa AI, an expert autonomous curriculum generator powered by Google Gemma 4 31B.
    Analyze the user's goal: "${goal}".
    
    Return a STRICT JSON response ONLY with no markdown formatting or commentary:
    {
      "question": "Diagnostic question to assess user baseline knowledge...",
      "options": ["Option 1", "Option 2", "Option 3"],
      "roadmap": [
        {
          "phase": 1,
          "title": "Phase Title",
          "hours": 16,
          "topics": ["Topic 1", "Topic 2", "Topic 3"],
          "description": "Comprehensive explanation of what will be learned"
        },
        {
          "phase": 2,
          "title": "Phase Title",
          "hours": 16,
          "topics": ["Topic 1", "Topic 2"],
          "description": "Deep dive technical implementation"
        },
        {
          "phase": 3,
          "title": "Phase Title",
          "hours": 12,
          "topics": ["Topic 1", "Topic 2"],
          "description": "Advanced specialized concepts"
        },
        {
          "phase": 4,
          "title": "Capstone Project",
          "hours": 10,
          "topics": ["Full System Build"],
          "description": "Real-world practical execution"
        }
      ]
    }`;

    // Call OpenRouter Gemma 4 31B Endpoint
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jinvexa.vercel.app", // Optional site URL
        "X-Title": "Jinvexa Learning AI", // Optional site title
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User Goal: ${goal}. Step: ${currentStep}. User Previous Answer: ${userResponse || "None"}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
  }
}
