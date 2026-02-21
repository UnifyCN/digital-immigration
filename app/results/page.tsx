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
          asChild
          className="mb-4 gap-1.5 text-muted-foreground"
        >
          <Link href="/">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </Button>

        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Your Clarity Assessment
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on the information you provided. This is a structured overview,
          not legal advice.
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
          Want to change your answers or start fresh?
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
            Reset assessment
          </Button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-8 text-center text-[10px] leading-relaxed text-muted-foreground">
        This tool provides a structured overview based on publicly available
        immigration requirements. It does not constitute legal advice and
        should not be relied upon as such. For professional guidance, consult a
        licensed immigration consultant or lawyer.
      </p>
    </div>
  )
}
