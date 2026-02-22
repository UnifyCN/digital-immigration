"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { MessageCircle, ArrowUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import type { AssessmentResults, NextStepAiAssistContext } from "@/lib/types"

interface ChatSupportDrawerProps {
  results: AssessmentResults
  resultsId: string
  pendingQuestion?: string | null
  pendingAssistContext?: NextStepAiAssistContext | null
  onQuestionConsumed?: () => void
  onAssistContextConsumed?: () => void
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const GREETING = "I've reviewed your snapshot \u2014 what do you want help with? (pathway choice, next steps, risk flags, documents)"

function buildResultsContext(results: AssessmentResults): string {
  const lines: string[] = []

  lines.push(`TIER: ${results.tier.label} (Level ${results.tier.level})`)
  if (results.tier.reasons.length > 0) {
    lines.push(`Reasons: ${results.tier.reasons.join("; ")}`)
  }

  lines.push("")
  lines.push("PATHWAYS:")
  for (const p of results.pathways) {
    lines.push(`- ${p.name} (Confidence: ${p.confidence})`)
    if (p.whyRelevant.length > 0) {
      lines.push(`  Why relevant: ${p.whyRelevant.join("; ")}`)
    }
    if (p.whatNext.length > 0) {
      lines.push(`  What you'd need next: ${p.whatNext.join("; ")}`)
    }
  }

  lines.push("")
  lines.push("RISK FLAGS:")
  if (results.riskFlags.length === 0) {
    lines.push("- None identified")
  } else {
    for (const f of results.riskFlags) {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.label}: ${f.action}`)
    }
  }

  lines.push("")
  lines.push("NEXT ACTIONS:")
  results.nextSteps.forEach((step, i) => {
    lines.push(`${i + 1}. [${step.priority.toUpperCase()}] ${step.title}: ${step.summary}`)
  })

  return lines.join("\n")
}

function buildNextStepPrompt(context: NextStepAiAssistContext): string {
  const profileBits = Object.entries(context.userProfileSummary)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("; ")

  const inputs = context.triggeredBy.inputs.length
    ? context.triggeredBy.inputs.join(", ")
    : "none listed"
  const pathways = context.triggeredBy.pathways.length
    ? context.triggeredBy.pathways.join(", ")
    : "none listed"
  const risks = context.triggeredBy.risks.length
    ? context.triggeredBy.risks.join(", ")
    : "none listed"

  return `Help me complete this next step: ${context.nextStepTitle}. Based on my profile: ${profileBits || "profile summary unavailable"}. Give me a tailored checklist, timelines, and what to prepare.

Triggered by:
- Inputs: ${inputs}
- Pathways: ${pathways}
- Risks: ${risks}`
}

export function ChatSupportDrawer({
  results,
  resultsId,
  pendingQuestion,
  pendingAssistContext,
  onQuestionConsumed,
  onAssistContextConsumed,
}: ChatSupportDrawerProps) {
  const storageKey = `unify_results_chat_${resultsId}`
  const initialMessages: Message[] = [{ role: "assistant", content: GREETING }]

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const [lastSentMessages, setLastSentMessages] = useState<Message[]>([])
  const [lastSentAssistContext, setLastSentAssistContext] = useState<NextStepAiAssistContext | null>(null)
  const [queuedQuestion, setQueuedQuestion] = useState<string | null>(null)
  const [queuedAssistContext, setQueuedAssistContext] = useState<NextStepAiAssistContext | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isOpenRef = useRef(isOpen)
  const messagesRef = useRef(messages)
  isOpenRef.current = isOpen
  messagesRef.current = messages

  const systemContext = useMemo(() => buildResultsContext(results), [results])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Message[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  function persistMessages(msgs: Message[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(msgs))
    } catch {
      // ignore
    }
  }

  const sendMessages = useCallback(async (
    msgsToSend: Message[],
    assistContext: NextStepAiAssistContext | null = null,
  ) => {
    setIsLoading(true)
    setError(null)
    setLastSentMessages(msgsToSend)
    setLastSentAssistContext(assistContext)

    try {
      const res = await fetch("/api/ai/results-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgsToSend,
          systemContext,
          assistContext,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      const reply: Message = { role: "assistant", content: data.message }
      const updated = [...msgsToSend, reply]
      setMessages(updated)
      persistMessages(updated)

      if (!isOpenRef.current) {
        setHasUnread(true)
      }
    } catch {
      setError("Failed to reach AI service. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [systemContext, storageKey])

  // Handle pending question from "Ask AI about this risk"
  useEffect(() => {
    if (!pendingQuestion) return
    if (isLoading) {
      setQueuedQuestion(pendingQuestion)
      return
    }
    setIsOpen(true)
    const userMsg: Message = { role: "user", content: pendingQuestion }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    persistMessages(updated)
    sendMessages(updated)
    onQuestionConsumed?.()
  }, [pendingQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pending assist context from "Ask AI about this next step"
  useEffect(() => {
    if (!pendingAssistContext) return
    if (isLoading) {
      setQueuedAssistContext(pendingAssistContext)
      return
    }
    setIsOpen(true)
    const userMsg: Message = { role: "user", content: buildNextStepPrompt(pendingAssistContext) }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    persistMessages(updated)
    sendMessages(updated, pendingAssistContext)
    onAssistContextConsumed?.()
  }, [pendingAssistContext]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush queued question when loading completes
  useEffect(() => {
    if (!isLoading && queuedQuestion) {
      setIsOpen(true)
      const userMsg: Message = { role: "user", content: queuedQuestion }
      const updated = [...messagesRef.current, userMsg]
      setMessages(updated)
      persistMessages(updated)
      sendMessages(updated)
      setQueuedQuestion(null)
      onQuestionConsumed?.()
    }
  }, [isLoading, queuedQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && queuedAssistContext) {
      setIsOpen(true)
      const userMsg: Message = { role: "user", content: buildNextStepPrompt(queuedAssistContext) }
      const updated = [...messagesRef.current, userMsg]
      setMessages(updated)
      persistMessages(updated)
      sendMessages(updated, queuedAssistContext)
      setQueuedAssistContext(null)
      onAssistContextConsumed?.()
    }
  }, [isLoading, queuedAssistContext]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { role: "user", content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    persistMessages(updated)
    setInput("")
    sendMessages(updated)
  }

  function handleRetry() {
    sendMessages(lastSentMessages, lastSentAssistContext)
  }

  function handleClear() {
    const reset = initialMessages
    setMessages(reset)
    setError(null)
    setHasUnread(false)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Fixed tab trigger */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Support chat"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-1.5 rounded-l-lg bg-primary px-2.5 py-4 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        {hasUnread && (
          <span className="absolute -left-1 -top-1 size-2.5 animate-pulse rounded-full bg-destructive" />
        )}
        <MessageCircle className="size-4" />
        <span
          className="text-[11px] font-medium leading-none"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          AI Support
        </span>
      </button>

      {/* Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:w-[420px] sm:max-w-[420px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b px-4 py-3 pr-12">
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-semibold">AI Support</SheetTitle>
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Clear chat
                </button>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Informational only, not legal advice
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>{error}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                className="ml-2 h-auto gap-1 p-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="size-3" />
                Retry
              </Button>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2 border-t px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your results..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="shrink-0"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
