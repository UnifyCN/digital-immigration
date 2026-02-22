"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Clock, Lock, PenLine, RotateCcw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { hasDraft, clearAssessment, saveAssessment, saveStep, demoAssessmentData } from "@/lib/storage"

export default function LandingPage() {
  const router = useRouter()
  const [draftExists, setDraftExists] = useState(false)

  useEffect(() => {
    setDraftExists(hasDraft())
  }, [])

  function handleReset() {
    clearAssessment()
    setDraftExists(false)
  }

  function handleAutoFill() {
    saveAssessment(demoAssessmentData)
    saveStep(7)
    router.push("/results")
  }

  return (
    <div className="relative flex min-h-[calc(100vh-2.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute -left-8 top-10 h-14 w-56 rounded-full bg-accent/28" />
      <div className="pointer-events-none absolute -right-12 bottom-9 h-12 w-80 rounded-full bg-accent/36" />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-9 text-center">
        <div className="rounded-full border border-border bg-card px-6 py-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[17px]">
          Immigration Snapshot
        </div>

        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-heading text-[clamp(2.25rem,5vw,5.2rem)] font-medium leading-[1.14] tracking-[-0.02em] text-foreground">
            Let’s understand your situation first.
          </h1>
          <p className="mx-auto max-w-3xl text-[clamp(1.1rem,2.1vw,2rem)] leading-[1.5] text-muted-foreground">
            Answer a few questions to get a warm, structured overview of
            pathway options, likely blockers, and your most practical next
            steps.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant="secondary" className="gap-2 rounded-[15px] px-5 py-2.5 text-[clamp(0.95rem,1.1vw,1.3rem)] font-semibold">
            <Clock className="size-5" />
            Takes 5 to 8 minutes
          </Badge>
          <Badge variant="secondary" className="gap-2 rounded-[15px] px-5 py-2.5 text-[clamp(0.95rem,1.1vw,1.3rem)] font-semibold">
            <PenLine className="size-5" />
            Friendly, editable answers
          </Badge>
          <Badge variant="secondary" className="gap-2 rounded-[15px] px-5 py-2.5 text-[clamp(0.95rem,1.1vw,1.3rem)] font-semibold">
            <Lock className="size-5" />
            Private on your device
          </Badge>
        </div>

        <div className="flex flex-col items-center gap-5">
          <Button asChild size="lg" className="h-14 rounded-[20px] px-10 text-[clamp(1.1rem,1.25vw,1.8rem)] font-semibold">
            <Link href="/assessment">
              Start assessment
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            className="gap-2 text-muted-foreground"
          >
            <Zap className="size-3.5" />
            Skip to demo results
          </Button>

          {draftExists && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/assessment">Resume snapshot</Link>
            </Button>
          )}
        </div>

        {draftExists && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Reset snapshot
          </Button>
        )}
      </div>
    </div>
  )
}
