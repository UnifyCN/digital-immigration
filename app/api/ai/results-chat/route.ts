import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT_TEMPLATE = `You are Unify AI Support, an immigration information assistant for Unify Social.
You are informational only — not a lawyer or legal advisor.
Never make definitive eligibility determinations or guarantees.
Focus on: explaining risk flags, comparing pathway options, evidence strength, and process sequencing.
Ask 1–3 clarifying questions when key details are missing.

ASSESSMENT CONTEXT (use as ground truth for this user's situation):
{systemContext}

ACTIVE ASSIST CONTEXT (if present, prioritize this user intent):
{assistContext}`

// ── Simple in-memory rate limiter ──
const MAX_REQUESTS_PER_WINDOW = 20
const WINDOW_MS = 60_000 // 1 minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false
  entry.count++
  return true
}

// ── Input limits ──
const MAX_MESSAGES = 50
const MAX_SYSTEM_CONTEXT_CHARS = 8_000
const MAX_ASSIST_CONTEXT_CHARS = 6_000
const FETCH_TIMEOUT_MS = 30_000

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI support is not configured." }, { status: 503 })
  }

  let body: {
    messages: { role: string; content: string }[]
    systemContext: string
    assistContext?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { messages, systemContext, assistContext } = body
  if (!Array.isArray(messages) || typeof systemContext !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  // Validate message roles — only allow user/assistant, block system injection
  for (const msg of messages) {
    if (
      (msg.role !== "user" && msg.role !== "assistant") ||
      typeof msg.content !== "string"
    ) {
      return NextResponse.json({ error: "Invalid message role or content." }, { status: 400 })
    }
  }

  // Cap input sizes
  const cappedMessages = messages.slice(-MAX_MESSAGES)
  const cappedContext = systemContext.slice(0, MAX_SYSTEM_CONTEXT_CHARS)
  const assistContextText = assistContext
    ? JSON.stringify(assistContext, null, 2).slice(0, MAX_ASSIST_CONTEXT_CHARS)
    : "None"

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"
  const systemMessage = SYSTEM_PROMPT_TEMPLATE
    .replace("{systemContext}", cappedContext)
    .replace("{assistContext}", assistContextText)

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
          ...cappedMessages,
        ],
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
