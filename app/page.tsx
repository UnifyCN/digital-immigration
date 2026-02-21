"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Lock, PenLine, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  hasDraft,
  clearAssessment,
  saveAssessment,
  sampleAssessmentData,
} from "@/lib/storage"

export default function LandingPage() {
  const [draftExists, setDraftExists] = useState(false)
  const [seedLoaded, setSeedLoaded] = useState(false)

  useEffect(() => {
    setDraftExists(hasDraft())
  }, [])

  function handleSeedToggle(checked: boolean) {
    if (checked) {
      saveAssessment(sampleAssessmentData)
      setDraftExists(true)
      setSeedLoaded(true)
    } else {
      clearAssessment()
      setDraftExists(false)
      setSeedLoaded(false)
    }
  }

  function handleReset() {
    clearAssessment()
    setDraftExists(false)
    setSeedLoaded(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 text-center">
        {/* Logo mark */}
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-6 text-primary-foreground"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            {"Let\u2019s understand your situation first."}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty">
            Answer a few questions to get a structured overview of your options
            and risks.
          </p>
        </div>

        {/* Trust chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-normal">
            <Clock className="size-3" />
            {"Takes ~5\u20138 minutes"}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-normal">
            <PenLine className="size-3" />
            You can edit later
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-normal">
            <Lock className="size-3" />
            Your data stays private
          </Badge>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-sm font-medium">
            <Link href="/assessment">
              Start Clarity Assessment
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          {draftExists && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/assessment">Resume assessment</Link>
            </Button>
          )}
        </div>

        {/* Reset + Seed controls */}
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Switch
              id="seed-toggle"
              checked={seedLoaded}
              onCheckedChange={handleSeedToggle}
            />
            <Label
              htmlFor="seed-toggle"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Load sample data (for demo)
            </Label>
          </div>

          {draftExists && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <RotateCcw className="size-3" />
              Reset assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
