"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PenLine, RotateCcw, ArrowLeft } from "lucide-react"
import { TierClassification } from "@/components/results/tier-classification"
import { PathwayCards } from "@/components/results/pathway-cards"
import { RiskFlagsPanel } from "@/components/results/risk-flags-panel"
import { NextActions } from "@/components/results/next-actions"
import { ReviewAnswers } from "@/components/results/review-answers"
import { ChatSupportDrawer } from "@/components/results/chat-support-drawer"
import { loadAssessment, clearAssessment } from "@/lib/storage"
import { computeResults } from "@/lib/scoring"
import type { AssessmentData, AssessmentResults } from "@/lib/types"

export default function ResultsPage() {
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [pendingAIQuestion, setPendingAIQuestion] = useState<string | null>(null)

  useEffect(() => {
    const data = loadAssessment()
    if (!data) {
      setIsLoaded(true)
      return
    }
    try {
      setAssessment(data)
      const computed = computeResults(data)
      setResults(computed)
    } catch (error) {
      console.error("Failed to compute assessment results", error)
      setAssessment(null)
      setResults(null)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const resultsId = useMemo(() => {
    if (!assessment) return "default"
    let hash = 5381
    const str = JSON.stringify(assessment)
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
      hash = hash >>> 0
    }
    return hash.toString(36)
  }, [assessment])

  function handleAskAI(_riskId: string, openerQuestion: string) {
    setPendingAIQuestion(openerQuestion)
  }

  function handleReset() {
    clearAssessment()
    router.push("/")
  }

  function handleBackToHome() {
    router.push("/")
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!assessment || !results) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="font-heading text-foreground">No assessment found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a new Clarity Assessment.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/assessment">Start assessment</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <ChatSupportDrawer
      results={results}
      resultsId={resultsId}
      pendingQuestion={pendingAIQuestion}
      onQuestionConsumed={() => setPendingAIQuestion(null)}
    />
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleBackToHome}
          className="mb-4 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Button>

        <h1 className="font-heading text-foreground">
          Your Unify Immigration Snapshot
        </h1>
        <p className="mt-2 type-body text-muted-foreground">
          This summary organizes your likely pathways and possible risk points
          from the answers you shared. It is informational, not legal advice.
        </p>
      </div>

      {/* Results sections */}
      <div className="flex flex-col gap-8">
        <TierClassification tier={results.tier} />

        <Separator />

        <PathwayCards pathways={results.pathways} />

        <Separator />

        <RiskFlagsPanel flags={results.riskFlags} onAskAI={handleAskAI} />

        <Separator />

        <NextActions actions={results.nextActions} />

        <Separator />

        <ReviewAnswers assessment={assessment} />
      </div>

      {/* Actions footer */}
      <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground text-center">
          Want to refine your answers or start again?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild className="gap-1.5">
            <Link href="/assessment">
              <PenLine className="size-3.5" />
              Edit answers
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset snapshot
          </Button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="type-caption mt-8 text-center text-muted-foreground">
        This Unify Social tool uses public immigration information to help
        organize your planning. It does not provide legal advice. For
        case-specific legal guidance, consult a licensed immigration consultant
        or lawyer.
      </p>
    </div>
    </>
  )
}
