"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { classifyExpressEntryStreams } from "@/lib/immigration/expressEntry/streamsEngine"
import type { ExpressEntryStreamsResult } from "@/lib/immigration/expressEntry/types"
import { getStreamStatusMeta } from "@/lib/immigration/expressEntry/statusMeta"
import type { AssessmentData } from "@/lib/types"
import { saveAssessment } from "@/lib/storage"
import { ExpressEntryStreamsQuestionnaire } from "@/components/pathways/express-entry-streams-questionnaire"

type ExpressEntryStreamsPanelProps = {
  assessment: AssessmentData
  onAssessmentUpdated: (next: AssessmentData) => void
}

function topReasons(reasons: string[]): string[] {
  return reasons.slice(0, 5)
}

export function ExpressEntryStreamsPanel({ assessment, onAssessmentUpdated }: ExpressEntryStreamsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<AssessmentData>(assessment)
  const [result, setResult] = useState<ExpressEntryStreamsResult | null>(null)
  const assessmentUpdatedRef = useRef(onAssessmentUpdated)

  useEffect(() => {
    setDraft(assessment)
  }, [assessment])

  useEffect(() => {
    assessmentUpdatedRef.current = onAssessmentUpdated
  }, [onAssessmentUpdated])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      setResult(classifyExpressEntryStreams(draft))
      saveAssessment(draft)
      assessmentUpdatedRef.current(draft)
    }, 300)

    return () => clearTimeout(timer)
  }, [draft, isOpen])

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
                const meta = getStreamStatusMeta(programResult.status)
                return (
                  <section key={program} className="rounded-lg border border-border/70 bg-card">
                    <div className="border-b px-4 py-3">
                      <h3 className="flex items-center justify-between text-sm font-semibold">
                        <span>{program}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </h3>
                    </div>
                    <div className="px-4 py-3">
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {topReasons(programResult.reasons).map((reason, index) => (
                          <li key={`${program}-${index}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
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
