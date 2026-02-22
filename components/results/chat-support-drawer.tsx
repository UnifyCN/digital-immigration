"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MessageCircle, ArrowUp, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import type { AssessmentResults } from "@/lib/types"

interface ChatSupportDrawerProps {
  results: AssessmentResults
  resultsId: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const GREETING = "I've reviewed your snapshot — what do you want help with? (pathway choice, next steps, risk flags, documents)"

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
  results.nextActions.forEach((a, i) => {
    lines.push(`${i + 1}. ${a}`)
  })

  return lines.join("\n")
}

export function ChatSupportDrawer({ results, resultsId }: ChatSupportDrawerProps) {
  const storageKey = `unify_results_chat_${resultsId}`
  const initialMessages: Message[] = [{ role: "assistant", content: GREETING }]

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const [lastSentMessages, setLastSentMessages] = useState<Message[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const sendMessages = useCallback(async (msgsToSend: Message[]) => {
    setIsLoading(true)
    setError(null)
    setLastSentMessages(msgsToSend)

    try {
      const res = await fetch("/api/ai/results-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgsToSend,
          systemContext: buildResultsContext(results),
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      const reply: Message = { role: "assistant", content: data.message }
      setMessages((prev) => {
        const updated = [...prev, reply]
        persistMessages(updated)
        return updated
      })

      if (!isOpen) {
        setHasUnread(true)
      }
    } catch {
      setError("Failed to reach AI service. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [results, isOpen, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
    sendMessages(lastSentMessages)
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
          <div className="flex items-start justify-between border-b px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">AI Support</p>
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
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-sm opacity-70 hover:opacity-100"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
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
