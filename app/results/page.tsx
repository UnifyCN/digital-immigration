"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PenLine, RotateCcw, ArrowLeft } from "lucide-react"
import { TierClassification } from "@/components/results/tier-classification"
import { PathwayCards } from "@/components/results/pathway-cards"
import { RiskFlagsPanel } from "@/components/results/risk-flags-panel"
import { NextActions } from "@/components/results/next-actions"
import { loadAssessment, clearAssessment } from "@/lib/storage"
import { computeResults } from "@/lib/scoring"
import type { AssessmentData, AssessmentResults } from "@/lib/types"

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const data = loadAssessment()
    if (!data) {
      router.push("/")
      return
    }
    const computed = computeResults(data as AssessmentData)
    setResults(computed)
    setIsLoaded(true)
  }, [router])

  function handleReset() {
    clearAssessment()
    router.push("/")
  }

  function handleBackToHome() {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }

  if (!isLoaded || !results) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
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
          <>
            <ArrowLeft className="size-3.5" />
            Back to home
          </>
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

        <RiskFlagsPanel flags={results.riskFlags} />

        <Separator />

        <NextActions actions={results.nextActions} />
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
  )
}
