"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import {
  MessageCircle,
  ArrowUp,
  RefreshCw,
  X,
  Copy,
  Check,
  ChevronDown,
  ArrowDown,
  Trash2,
  Sparkles,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AssessmentResults, NextStepAiAssistContext } from "@/lib/types"

// ── Types ──

interface Message {
  role: "user" | "assistant"
  content: string
}

// ── Constants ──

const GREETING =
  "I've reviewed your snapshot — what do you want help with? (pathway choice, next steps, risk flags, documents)"

const INITIAL_MESSAGES: Message[] = [{ role: "assistant", content: GREETING }]

const MIN_WIDTH = 360
const MAX_WIDTH = 640
const DEFAULT_WIDTH = 420
const STREAM_INTERVAL_MS = 14
const STREAM_CHUNK_MIN = 2
const STREAM_CHUNK_MAX = 7
const SCROLL_NEAR_BOTTOM_PX = 80

const FOLLOW_UP_CHIPS = [
  "Explain this risk",
  "Compare Express Entry vs PNP",
  "What should I do next?",
  "What documents are needed?",
]

// ── localStorage helpers ──

function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function storageSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded or SSR */
  }
}

// ── Context builders (unchanged core logic) ──

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
    if (p.whyRelevant.length > 0)
      lines.push(`  Why relevant: ${p.whyRelevant.join("; ")}`)
    if (p.whatNext.length > 0)
      lines.push(`  What you'd need next: ${p.whatNext.join("; ")}`)
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
    lines.push(
      `${i + 1}. [${step.priority.toUpperCase()}] ${step.title}: ${step.summary}`,
    )
  })

  return lines.join("\n")
}

function buildNextStepPrompt(context: NextStepAiAssistContext): string {
  const profileBits = Object.entries(context.userProfileSummary)
    .map(
      ([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
    )
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

// ── Chat message sub-component ──

function ChatMessage({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === "user"

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("group flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary/8 text-foreground"
            : "bg-muted/50 text-foreground",
        )}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {msg.content}
      </div>
      {!isUser && (
        <button
          onClick={handleCopy}
          className="mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
          aria-label={copied ? "Copied" : "Copy message"}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ── Main component ──

interface ChatSupportDrawerProps {
  results: AssessmentResults
  resultsId: string
  pendingQuestion?: string | null
  pendingAssistContext?: NextStepAiAssistContext | null
  onQuestionConsumed?: () => void
  onAssistContextConsumed?: () => void
}

export function ChatSupportDrawer({
  results,
  resultsId,
  pendingQuestion,
  pendingAssistContext,
  onQuestionConsumed,
  onAssistContextConsumed,
}: ChatSupportDrawerProps) {
  const isMobile = useIsMobile()

  // Storage keys
  const chatKey = `unify_results_chat_${resultsId}`
  const widthKey = "unify_chat_width"

  // Refs
  const drawerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isOpenRef = useRef(false)
  const messagesRef = useRef<Message[]>(INITIAL_MESSAGES)

  // Core state
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)

  // Streaming
  const [streamingContent, setStreamingContent] = useState<string | null>(null)

  // Smart autoscroll
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  // Context panel
  const [contextExpanded, setContextExpanded] = useState(false)

  // Pill animation (first load only)
  const [pillVisible, setPillVisible] = useState(false)

  // Resize
  const [isResizing, setIsResizing] = useState(false)

  // Retry state
  const [lastSentMessages, setLastSentMessages] = useState<Message[]>([])
  const [lastSentAssistContext, setLastSentAssistContext] =
    useState<NextStepAiAssistContext | null>(null)

  // Queued external questions
  const [queuedQuestion, setQueuedQuestion] = useState<string | null>(null)
  const [queuedAssistContext, setQueuedAssistContext] =
    useState<NextStepAiAssistContext | null>(null)

  // Hydration flag
  const [hydrated, setHydrated] = useState(false)

  // Keep refs in sync
  isOpenRef.current = isOpen
  messagesRef.current = messages

  const systemContext = useMemo(() => buildResultsContext(results), [results])

  // Derived context header values
  const topPathway = results.pathways[0]?.name ?? "Your pathways"
  const riskCount = results.riskFlags.length

  // ── Hydration: load persisted state ──

  useEffect(() => {
    const storedWidth = storageGet<number>(widthKey, DEFAULT_WIDTH)
    const storedMessages = storageGet<Message[]>(chatKey, INITIAL_MESSAGES)

    setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedWidth)))
    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      setMessages(storedMessages)
    }
    setHydrated(true)
  }, [chatKey, widthKey])

  // ── Persist on change (only after hydration) ──

  useEffect(() => {
    if (!hydrated) return
    storageSet(widthKey, width)
  }, [width, widthKey, hydrated])

  useEffect(() => {
    if (!hydrated) return
    storageSet(chatKey, messages)
  }, [messages, chatKey, hydrated])

  // ── Pill entrance animation ──

  useEffect(() => {
    const timer = setTimeout(() => setPillVisible(true), 400)
    return () => clearTimeout(timer)
  }, [])

  // ── Focus textarea when opened ──

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => textareaRef.current?.focus(), 320)
    }
  }, [isOpen])

  // ── Global keyboard shortcuts ──

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        setIsOpen(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  // ── Focus trap (mobile full-screen only) ──

  useEffect(() => {
    if (!isOpen || !isMobile || !drawerRef.current) return
    const drawer = drawerRef.current
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return
      const els = Array.from(drawer.querySelectorAll(selector)) as HTMLElement[]
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    drawer.addEventListener("keydown", trap)
    return () => drawer.removeEventListener("keydown", trap)
  }, [isOpen, isMobile])

  // ── Smart autoscroll ──

  function handleMessagesScroll() {
    const el = scrollRef.current
    if (!el) return
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_NEAR_BOTTOM_PX
    setUserScrolledUp(!nearBottom)
  }

  useEffect(() => {
    if (!userScrolledUp && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, isLoading, userScrolledUp])

  function jumpToLatest() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
      setUserScrolledUp(false)
    }
  }

  // ── Cleanup streaming on unmount ──

  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [])

  // ── Resize handler ──

  function handleResizeStart(e: React.MouseEvent | React.TouchEvent) {
    if (isMobile) return
    e.preventDefault()
    setIsResizing(true)
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX
    const startWidth = width

    function onMove(ev: MouseEvent | TouchEvent) {
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX
      const delta = startX - clientX
      setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta)))
    }

    function onEnd() {
      setIsResizing(false)
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onEnd)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onEnd)
    document.addEventListener("touchmove", onMove)
    document.addEventListener("touchend", onEnd)
  }

  // ── Streaming simulation ──

  function startStreaming(fullText: string, msgsWithoutReply: Message[]) {
    let idx = 0
    setStreamingContent("")

    streamRef.current = setInterval(() => {
      const chunk =
        Math.floor(Math.random() * (STREAM_CHUNK_MAX - STREAM_CHUNK_MIN + 1)) +
        STREAM_CHUNK_MIN
      idx = Math.min(idx + chunk, fullText.length)
      setStreamingContent(fullText.slice(0, idx))

      if (idx >= fullText.length) {
        if (streamRef.current) clearInterval(streamRef.current)
        streamRef.current = null
        setStreamingContent(null)
        const final: Message[] = [
          ...msgsWithoutReply,
          { role: "assistant", content: fullText },
        ]
        setMessages(final)
        setIsLoading(false)
        if (!isOpenRef.current) setHasUnread(true)
      }
    }, STREAM_INTERVAL_MS)
  }

  // ── Send messages ──

  const sendMessages = useCallback(
    async (
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
          setIsLoading(false)
          return
        }

        startStreaming(data.message, msgsToSend)
      } catch {
        setError("Failed to reach AI service. Please try again.")
        setIsLoading(false)
      }
    },
    [systemContext], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ── External question handling ──

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
    sendMessages(updated)
    onQuestionConsumed?.()
  }, [pendingQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pendingAssistContext) return
    if (isLoading) {
      setQueuedAssistContext(pendingAssistContext)
      return
    }
    setIsOpen(true)
    const userMsg: Message = {
      role: "user",
      content: buildNextStepPrompt(pendingAssistContext),
    }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    sendMessages(updated, pendingAssistContext)
    onAssistContextConsumed?.()
  }, [pendingAssistContext]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && queuedQuestion) {
      setIsOpen(true)
      const userMsg: Message = { role: "user", content: queuedQuestion }
      const updated = [...messagesRef.current, userMsg]
      setMessages(updated)
      sendMessages(updated)
      setQueuedQuestion(null)
      onQuestionConsumed?.()
    }
  }, [isLoading, queuedQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && queuedAssistContext) {
      setIsOpen(true)
      const userMsg: Message = {
        role: "user",
        content: buildNextStepPrompt(queuedAssistContext),
      }
      const updated = [...messagesRef.current, userMsg]
      setMessages(updated)
      sendMessages(updated, queuedAssistContext)
      setQueuedAssistContext(null)
      onAssistContextConsumed?.()
    }
  }, [isLoading, queuedAssistContext]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── User actions ──

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    const userMsg: Message = { role: "user", content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput("")
    sendMessages(updated)
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleSendChip(text: string) {
    if (isLoading) return
    const userMsg: Message = { role: "user", content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    sendMessages(updated)
  }

  function handleRetry() {
    sendMessages(lastSentMessages, lastSentAssistContext)
  }

  function handleClear() {
    if (streamRef.current) {
      clearInterval(streamRef.current)
      streamRef.current = null
    }
    setMessages(INITIAL_MESSAGES)
    setStreamingContent(null)
    setError(null)
    setHasUnread(false)
    setIsLoading(false)
    setUserScrolledUp(false)
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Derived flags ──

  const showChips =
    !isLoading &&
    streamingContent === null &&
    !error &&
    messages.length > 1 &&
    messages[messages.length - 1].role === "assistant"

  const showJumpButton =
    userScrolledUp && (isLoading || streamingContent !== null)

  // ── Render ──

  return (
    <>
      {/* ── Pill trigger (top right, fully visible) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Support"
          aria-expanded={false}
          className="fixed right-4 top-4 z-40 flex items-center gap-2.5 rounded-2xl border border-border bg-background px-3.5 py-3 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.10)] hover:shadow-lg"
          style={{
            transform: `translateX(${pillVisible ? "0" : "100%"})`,
            opacity: pillVisible ? 1 : 0,
            transition:
              "transform 600ms cubic-bezier(0.32, 0.72, 0, 1), opacity 600ms ease, box-shadow 200ms ease",
          }}
        >
          <div className="relative">
            <MessageCircle className="size-[18px] text-foreground" />
            {hasUnread && (
              <span className="absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-primary" />
            )}
          </div>
          <span className="hidden text-[13px] font-medium text-foreground sm:inline">
            Ask about your results
          </span>
        </button>
      )}

      {/* ── Subtle backdrop (desktop, non-blocking) ── */}
      <div
        className="fixed inset-0 z-40 bg-black/[0.04] transition-opacity duration-300"
        style={{
          opacity: isOpen && !isMobile ? 1 : 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* ── Mobile backdrop (blocks interaction, closes drawer) ── */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer panel ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="AI Support"
        aria-modal={isMobile ? true : undefined}
        className={cn(
          "fixed z-50 flex flex-col border-l border-border bg-background",
          isMobile ? "inset-0" : "inset-y-0 right-0",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0",
          isResizing ? "duration-0" : "duration-300",
        )}
        style={{
          width: isMobile ? "100%" : `${width}px`,
          transitionProperty: "transform, opacity",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: isOpen ? "-8px 0 30px -12px rgba(0,0,0,0.10)" : "none",
        }}
        inert={!isOpen}
      >
        {/* ── Resize handle (desktop) ── */}
        {!isMobile && (
          <div
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="group absolute -left-1 inset-y-0 z-10 w-2 cursor-col-resize transition-colors hover:bg-primary/10 active:bg-primary/15"
            aria-label="Resize drawer"
          >
            <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-50">
              <GripVertical className="size-3 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                AI Support
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleClear}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close drawer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Context summary line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="truncate">Reviewing: {topPathway}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">
              {riskCount === 0
                ? "No risks"
                : `${riskCount} risk${riskCount !== 1 ? "s" : ""}`}
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setContextExpanded((p) => !p)}
              className="flex shrink-0 items-center gap-0.5 text-primary/80 transition-colors hover:text-primary"
            >
              Context active
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-200",
                  contextExpanded && "rotate-180",
                )}
              />
            </button>
          </div>

          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Informational only, not legal advice
          </p>
        </div>

        {/* ── Expandable context panel ── */}
        <div
          className={cn(
            "overflow-hidden border-b border-border bg-muted/30 transition-all duration-200 ease-out",
            contextExpanded ? "max-h-64 px-4 py-3" : "max-h-0 px-4 py-0",
          )}
        >
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">Tier:</span>{" "}
              {results.tier.label} (Level {results.tier.level})
            </div>
            {results.pathways.length > 0 && (
              <div>
                <span className="font-semibold text-foreground">Pathways:</span>
                <ul className="mt-0.5 space-y-0.5 pl-3">
                  {results.pathways.map((p) => (
                    <li key={p.id}>
                      • {p.name}{" "}
                      <span className="text-muted-foreground/60">
                        ({p.confidence})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.riskFlags.length > 0 && (
              <div>
                <span className="font-semibold text-foreground">Risks:</span>
                <ul className="mt-0.5 space-y-0.5 pl-3">
                  {results.riskFlags.map((f) => (
                    <li key={f.id}>
                      •{" "}
                      <span className="capitalize">[{f.severity}]</span>{" "}
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Messages area ── */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleMessagesScroll}
            className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}

            {/* Streaming response (token-by-token reveal) */}
            {streamingContent !== null && (
              <div className="flex flex-col items-start">
                <div
                  className="max-w-[88%] rounded-xl bg-muted/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {streamingContent}
                  <span className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-foreground/30 align-text-bottom" />
                </div>
              </div>
            )}

            {/* Typing indicator (waiting for API) */}
            {isLoading && streamingContent === null && (
              <div className="flex items-start">
                <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="size-[5px] animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-muted-foreground/40" />
                  <span className="size-[5px] animate-[bounce_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-muted-foreground/40" />
                  <span className="size-[5px] animate-[bounce_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-muted-foreground/40" />
                </div>
              </div>
            )}

            {/* Follow-up chips */}
            {showChips && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {FOLLOW_UP_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendChip(chip)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Jump to latest */}
          {showJumpButton && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <button
                onClick={jumpToLatest}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-md transition-colors hover:text-foreground"
              >
                <ArrowDown className="size-3" />
                Jump to latest
              </button>
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-destructive/8 px-3 py-2 text-[12px] text-destructive">
            <span className="line-clamp-2">{error}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRetry}
              className="ml-2 h-auto shrink-0 gap-1 p-1 text-[11px] text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="size-3" />
              Retry
            </Button>
          </div>
        )}

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Ask about your results…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
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
              className="size-9 shrink-0 rounded-lg"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/50">
            <span>Shift+Enter for new line</span>
            <span className="hidden sm:inline">⌘/ to toggle</span>
          </div>
        </div>
      </div>
    </>
  )
}
