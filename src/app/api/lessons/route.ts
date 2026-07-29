import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, lessonTitle } = await req.json();

    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.OPENROUTER_API_KEY;

    const fallbackLesson = {
      content: `# Complete Study Guide: ${lessonTitle || "Module Overview"}
**Specialization:** ${topic || "Enterprise Technical Track"}

---

## 1. Deep Theoretical & Mathematical Foundations
In professional engineering environments, mastering **${lessonTitle || "this topic"}** requires a rigorous understanding of its underlying mechanical and computational principles. Rather than relying on superficial abstractions, robust systems engineering examines how data structures, state transitions, and memory allocations behave under high-concurrency loads.

### Key Architectural Constraints
1. **Deterministic vs. Probabilistic Behavior:** Systems must be designed to handle both predictable input schemas and stochastic edge cases without dropping availability.
2. **Throughput and Latency Optimization:** By minimizing I/O bottlenecks and optimizing cache locality, enterprise pipelines achieve sub-millisecond response times.
3. **Fault Tolerance and Recovery:** Implementing idempotent operations and dead-letter queues ensures zero data loss during node failures.

---

## 2. Practical Syntax, Implementation & Code Workflows
To implement **${lessonTitle || "this architecture"}** in production, engineers utilize standardized design patterns. Below is an architectural reference model demonstrating how components interact:

\`\`\`text
[Client Request] --> (API Gateway / Load Balancer)
                           |
            +--------------+--------------+
            v                             v
  [Stateless Worker A]          [Stateless Worker B]
            |                             |
            +--------------+--------------+
                           v
              (Distributed Write-Ahead Log)
\`\`\`

### Production Implementation Rules
* Never block the primary event loop when executing heavy computational transformations.
* Always decouple ingestion from storage using asynchronous buffering layers.

---

## 3. Real-World Case Study & Production Verification
Consider a high-frequency financial trading platform or an autonomous robotics control loop implementing **${lessonTitle || "these principles"}**. During peak market volatility or rapid sensor drift, the architecture must automatically scale horizontally while preserving strict sequential ordering.`,
    };

    if (!apiKey) {
      return NextResponse.json(fallbackLesson);
    }

    const systemPrompt = `You are Jinvexa Distinguished Professor of Engineering. Write a deeply comprehensive, advanced, 500-to-800-word university study guide for:
    Specialization: "${topic}"
    Lesson Title: "${lessonTitle}"

    Your response MUST include:
    1. A deep theoretical explanation of core mechanics, mathematics, and architectural trade-offs.
    2. A structured text-based architecture diagram or ASCII chart.
    3. Practical engineering implementation rules and clean code/syntax examples.
    4. A real-world production case study analyzing edge cases and failure modes.
    Use rich Markdown formatting (H2/H3 headings, bold text, bullet points, and code blocks).`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) return NextResponse.json(fallbackLesson);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    return NextResponse.json({
      content: content || fallbackLesson.content,
    });
  } catch (error) {
    return NextResponse.json({
      content: `# Comprehensive Study Guide: ${lessonTitle}\n\nWelcome to your advanced lesson in **${topic}**.\n\n### 1. Architectural Foundations\nMastering this concept requires evaluating latency, throughput, and system reliability under load.\n\n### 2. Implementation Workflow\nAlways decouple state transformations from ingestion layers to ensure horizontal scalability.`,
    });
  }
}
