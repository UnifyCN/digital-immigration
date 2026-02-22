import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT_TEMPLATE = `You are Unify AI Support, an immigration information assistant for Unify Social.
You are informational only — not a lawyer or legal advisor.
Never make definitive eligibility determinations or guarantees.
Focus on: explaining risk flags, comparing pathway options, evidence strength, and process sequencing.
Ask 1–3 clarifying questions when key details are missing.

ASSESSMENT CONTEXT (use as ground truth for this user's situation):
{systemContext}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI support is not configured." }, { status: 503 })
  }

  let body: { messages: { role: string; content: string }[]; systemContext: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { messages, systemContext } = body
  if (!Array.isArray(messages) || typeof systemContext !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"
  const systemMessage = SYSTEM_PROMPT_TEMPLATE.replace("{systemContext}", systemContext)

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://unifysocial.ca",
        "X-Title": "Unify AI Support",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("OpenRouter error:", response.status, text)
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 })
    }

    const data = await response.json()
    const message = data?.choices?.[0]?.message?.content
    if (!message) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 })
    }

    return NextResponse.json({ message })
  } catch (err) {
    console.error("Results chat error:", err)
    return NextResponse.json({ error: "Failed to reach AI service." }, { status: 502 })
  }
}
