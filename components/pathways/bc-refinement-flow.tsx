"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { loadAssessment } from "@/lib/storage"
import { buildPNPSignals } from "@/lib/pathways/pnpSignals"
import { buildPNPProvinceFinderSignals, mergeSignals } from "@/lib/pathways/pnpProvinceScope"
import { evaluateBCFamilies } from "@/lib/pathways/pnpBcFamilyEvaluator"
import { applyBCRefinementAnswersToSignals } from "@/lib/pathways/applyBCRefinementAnswers"
import { selectBCRefinementQuestions } from "@/lib/pathways/selectBCRefinementQuestions"
import {
  loadPNPBCRefinementAnswers,
  loadPNPProvinceFinderAnswers,
  loadPNPProvinceFinderEntryContext,
  savePNPBCRefinementAnswers,
  savePNPProvinceFinderResult,
} from "@/lib/pathways/provinceFinderStorage"

const PNP_PATH = "/assessment/results/pathways/pnp"
const BC_RESULTS_PATH = "/assessment/results/pathways/pnp/province-finder/results"

export function BCRefinementFlow() {
  const router = useRouter()
  const assessment = useMemo(() => loadAssessment(), [])
  const initialRefinementAnswers = useMemo(() => loadPNPBCRefinementAnswers(), [])
  const [answers, setAnswers] = useState<Record<string, string | number | null>>(initialRefinementAnswers)
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signals: mainSignals, meta } = useMemo(() => buildPNPSignals(assessment ?? {}), [assessment])
  const finderAnswers = useMemo(() => loadPNPProvinceFinderAnswers(), [])
  const finderSignals = useMemo(() => buildPNPProvinceFinderSignals(finderAnswers), [finderAnswers])
  const combinedSignals = useMemo(() => mergeSignals(mainSignals, finderSignals), [finderSignals, mainSignals])
  const mode = useMemo(
    () => loadPNPProvinceFinderEntryContext()?.mode ?? "guided",
    [],
  )

  const initialSignals = useMemo(
    () => applyBCRefinementAnswersToSignals(combinedSignals as typeof combinedSignals & Record<string, unknown>, initialRefinementAnswers),
    [combinedSignals, initialRefinementAnswers],
  )
  const initialEvaluation = useMemo(
    () => evaluateBCFamilies({ combinedSignals: initialSignals, meta }),
    [initialSignals, meta],
  )
  const selectedQuestions = useMemo(
    () =>
      selectBCRefinementQuestions({
        evaluation: initialEvaluation,
        signals: initialSignals,
        mode,
      }),
    [initialEvaluation, initialSignals, mode],
  )

  function setAnswer(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value }
    setAnswers(next)
    savePNPBCRefinementAnswers(next)
  }

  function handleSubmit() {
    const missing = selectedQuestions
      .filter((question) => answers[question.id] === undefined || answers[question.id] === null || answers[question.id] === "")
      .map((question) => `Please answer: ${question.title}`)
    setErrors(missing)
    if (missing.length > 0) return

    setIsSubmitting(true)
    try {
      const refinedSignals = applyBCRefinementAnswersToSignals(
        combinedSignals as typeof combinedSignals & Record<string, unknown>,
        answers,
      )
      const reevaluated = evaluateBCFamilies({ combinedSignals: refinedSignals, meta })
      savePNPBCRefinementAnswers(answers)
      savePNPProvinceFinderResult(reevaluated)
      router.push(BC_RESULTS_PATH)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No assessment found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Start your assessment first to refine BC pathway matching.</p>
            <Button asChild>
              <Link href="/assessment">Start assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedQuestions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
          <Link href={PNP_PATH}>
            <ArrowLeft className="size-4" />
            Back to PNP
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>BC refinement is already complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your BC recommendation is already based on the key details we need.
            </p>
            <Button asChild>
              <Link href={BC_RESULTS_PATH}>View BC pathway details</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link href={PNP_PATH}>
          <ArrowLeft className="size-4" />
          Back to PNP
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Figure out which BC stream fits me</CardTitle>
          <p className="text-sm text-muted-foreground">
            We only ask high-impact missing details to refine your BC pathway match.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">MVP: British Columbia only (more provinces coming)</Badge>
            <Badge variant="outline">{mode === "guided" ? "Guided mode" : "Explore mode"}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {selectedQuestions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}) {question.title}
              </CardTitle>
              {question.helperText ? (
                <p className="text-xs text-muted-foreground">{question.helperText}</p>
              ) : null}
            </CardHeader>
            <CardContent>
              {question.answerType === "single_select" ? (
                <fieldset>
                  <legend className="sr-only">{question.title}</legend>
                  <RadioGroup
                    value={typeof answers[question.id] === "string" ? (answers[question.id] as string) : ""}
                    onValueChange={(value) => setAnswer(question.id, value)}
                    className="flex flex-wrap gap-3"
                    aria-label={question.title}
                  >
                    {(question.options ?? []).map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={`${question.id}-${option.value}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                      >
                        <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                        <span className="text-foreground">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </fieldset>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {errors.length > 0 ? (
        <Card className="mt-4 border-destructive/40">
          <CardContent className="pt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Updating BC recommendations..." : "Update BC recommendations"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={BC_RESULTS_PATH}>Skip and view current BC results</Link>
        </Button>
      </div>
    </div>
  )
}
