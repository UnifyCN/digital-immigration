"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classifyExpressEntryStreams } from "@/lib/immigration/expressEntry/streamsEngine"
import type { ExpressEntryStreamsResult } from "@/lib/immigration/expressEntry/types"
import type { AssessmentData } from "@/lib/types"
import { saveAssessment } from "@/lib/storage"
import { ExpressEntryStreamsQuestionnaire } from "@/components/pathways/express-entry-streams-questionnaire"

type ExpressEntryStreamsPanelProps = {
  assessment: AssessmentData
  onAssessmentUpdated: (next: AssessmentData) => void
}

function statusLabel(status: "eligible" | "ineligible" | "needs_more_info") {
  if (status === "eligible") return { label: "Eligible", variant: "default" as const }
  if (status === "needs_more_info") return { label: "Needs more info", variant: "secondary" as const }
  return { label: "Ineligible", variant: "outline" as const }
}

function topReasons(reasons: string[]): string[] {
  return reasons.slice(0, 5)
}

export function ExpressEntryStreamsPanel({ assessment, onAssessmentUpdated }: ExpressEntryStreamsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<AssessmentData>(assessment)
  const [result, setResult] = useState<ExpressEntryStreamsResult | null>(null)

  useEffect(() => {
    setDraft(assessment)
  }, [assessment])

  useEffect(() => {
    if (!isOpen) return
    const computed = classifyExpressEntryStreams(draft)
    setResult(computed)
  }, [draft, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      saveAssessment(draft)
      onAssessmentUpdated(draft)
    }, 300)

    return () => clearTimeout(timer)
  }, [draft, isOpen, onAssessmentUpdated])

  const hasQuestions = (result?.nextQuestions.length ?? 0) > 0
  const eligibleProgramsLabel = useMemo(() => {
    if (!result || result.eligiblePrograms.length === 0) return "None yet"
    return result.eligiblePrograms.join(", ")
  }, [result])

  return (
    <div className="space-y-3">
      {!isOpen ? (
        <div className="space-y-2">
          <Button type="button" onClick={() => {
            const computed = classifyExpressEntryStreams(assessment)
            setDraft(assessment)
            setResult(computed)
            setIsOpen(true)
          }}>
            Determine which Express Entry streams you qualify for
          </Button>
          <p className="text-xs text-muted-foreground">
            Stream classification here is authoritative and can differ from earlier provisional pathway signals.
          </p>
        </div>
      ) : null}

      {isOpen && result ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stream classification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ruleset date: {result.rulesetDate}. As of: {result.asOfDate}. Eligible stream set: {eligibleProgramsLabel}.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {([
                ["CEC", result.programResults.CEC],
                ["FSW", result.programResults.FSW],
                ["FST", result.programResults.FST],
              ] as const).map(([program, programResult]) => {
                const meta = statusLabel(programResult.status)
                return (
                  <Card key={program} className="border-border/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>{program}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {topReasons(programResult.reasons).map((reason, index) => (
                          <li key={`${program}-${index}`}>{reason}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>

          {hasQuestions ? (
            <ExpressEntryStreamsQuestionnaire
              questions={result.nextQuestions}
              assessment={draft}
              onChange={setDraft}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">No additional follow-up questions are required right now.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
