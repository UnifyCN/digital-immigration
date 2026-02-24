"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  getProvinceFinderRequiredRadioKeys,
  isCompleteProvinceFinderAnswers,
  recommendationForProvince,
  validateProvinceFinderSupplementalAnswers,
  type ProvinceFinderAnswers,
  type ProvinceFinderDraftAnswers,
} from "@/lib/pathways/provinceFinder"
import {
  loadPNPProvinceFinderAnswers,
  loadPNPProvinceFinderEntryContext,
  savePNPProvinceFinderEntryContext,
  savePNPProvinceFinderResult,
  saveProvinceFinderRecommendations,
  savePNPProvinceFinderAnswers,
} from "@/lib/pathways/provinceFinderStorage"
import { buildPNPSignals } from "@/lib/pathways/pnpSignals"
import { buildPNPProvinceFinderSignals, mergeSignals, resolveMVPProvince } from "@/lib/pathways/pnpProvinceScope"
import { evaluatePNPProvince } from "@/lib/pathways/pnpProvinceEvaluator"
import { buildBCProvinceFinderResult } from "@/lib/pathways/pnpBcFamilyEvaluator"
import { getPNPProvinceRouterDecision } from "@/lib/pathways/pnpProvinceRouter"
import { PNP_PROVINCE_LABELS } from "@/lib/config/pnpScope"
import { loadAssessment } from "@/lib/storage"
import { isPNPInScope } from "@/lib/pnp-scope"
import { scorePNPRelevance } from "@/lib/pathways/pnpRelevanceScore"
import { derivePNPConfidence } from "@/lib/pathways/pnpConfidence"
import { buildPNPReadinessChecklistAll } from "@/lib/pathways/pnpReadinessChecklist"
import { generatePNPOpenQuestions } from "@/lib/pathways/pnpOpenQuestions"

type RadioQuestionKey = Exclude<keyof ProvinceFinderAnswers, "hourlyWage">

type RadioQuestion = {
  id: number
  key: RadioQuestionKey
  title: string
  options: Array<{ value: string; label: string }>
}

const PNP_OVERVIEW_PATH = "/assessment/results/pathways/pnp"
const BC_REFINEMENT_PATH = "/assessment/results/pathways/pnp/bc-refinement"
const FINDER_RESULTS_PATH = "/assessment/results/pathways/pnp/province-finder/results"
const CHOICE_CHIP_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
const NOC_CODE_REGEX = /^\d{4,5}$/

const RADIO_QUESTIONS: RadioQuestion[] = [
  {
    id: 1,
    key: "employerSupport",
    title: "Is your employer willing to support a provincial nomination application?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 2,
    key: "employerEmployeesInProvince",
    title: "How many employees does your employer have in the province?",
    options: [
      { value: "lt5", label: "Fewer than 5" },
      { value: "5to50", label: "5-50" },
      { value: "50plus", label: "50+" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 3,
    key: "monthsWithEmployer",
    title: "How long have you worked for your current employer?",
    options: [
      { value: "lt3", label: "Less than 3 months" },
      { value: "3to6", label: "3-6 months" },
      { value: "6to12", label: "6-12 months" },
      { value: "1plus", label: "1+ year" },
    ],
  },
  {
    id: 5,
    key: "ruralJobLocation",
    title: "Is your job located in a rural or non-major city area?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 6,
    key: "institutionType",
    title: "Was your institution:",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: 7,
    key: "programAtLeast8Months",
    title: "Did you complete a program that was at least 8 months in length?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 8,
    key: "graduatedWithin3Years",
    title: "Did you complete your program within the last 3 years?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: 9,
    key: "willingOutsideMajorCities",
    title: "Are you willing to live outside major cities (e.g., outside Vancouver/Toronto/Calgary)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ],
  },
  {
    id: 10,
    key: "committedToResideProvince",
    title: "If nominated by a province, are you committed to residing and working there long-term?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: 11,
    key: "occupationRegulated",
    title: "Is your occupation regulated in the province you're considering?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 12,
    key: "licensureStatus",
    title: "Do you currently hold provincial licensure (if required)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "in_progress", label: "In progress" },
    ],
  },
  {
    id: 13,
    key: "priorNomination",
    title: "Have you previously received a provincial nomination?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: 14,
    key: "priorPNPRefusal",
    title: "Have you previously applied to a provincial program and been refused?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: 15,
    key: "settlementFunds",
    title: "Do you have settlement funds available (if required)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: 16,
    key: "frenchIntermediatePlus",
    title: "Do you speak French at an intermediate or advanced level?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: 17,
    key: "prioritySectorEmployer",
    title: "Does your employer operate in a priority sector (e.g., healthcare, tech, trades, agriculture)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
]

const TEER_LEVEL_OPTIONS = [
  { value: "teer_0_management", label: "TEER 0 (management)" },
  { value: "teer_1_professional_roles", label: "TEER 1 (professional roles)" },
  { value: "teer_2_technical_skilled_trades", label: "TEER 2 (technical / skilled trades)" },
  { value: "teer_3_intermediate_skilled", label: "TEER 3 (intermediate skilled)" },
  { value: "teer_4_support_roles", label: "TEER 4 (support roles)" },
  { value: "teer_5_labour_roles", label: "TEER 5 (labour roles)" },
  { value: "not_sure", label: "Not sure" },
] as const

const CRS_RANGE_OPTIONS = [
  { value: "under_400", label: "Under 400" },
  { value: "400_449", label: "400–449" },
  { value: "450_499", label: "450–499" },
  { value: "500_plus", label: "500+" },
  { value: "not_sure", label: "Not sure" },
] as const

const EMPLOYER_OPERATION_OPTIONS = [
  { value: "lt_1_year", label: "Less than 1 year" },
  { value: "1_2_years", label: "1–2 years" },
  { value: "3_5_years", label: "3–5 years" },
  { value: "5_plus_years", label: "5+ years" },
  { value: "not_sure", label: "Not sure" },
] as const

const EMPLOYER_REVENUE_OPTIONS = [
  { value: "under_500k", label: "Under $500k" },
  { value: "500k_1m", label: "$500k–$1M" },
  { value: "1m_5m", label: "$1M–$5M" },
  { value: "5m_plus", label: "$5M+" },
  { value: "not_sure", label: "Not sure" },
] as const

const SETTLEMENT_FUNDS_AMOUNT_OPTIONS = [
  { value: "under_5000", label: "Under $5,000 CAD" },
  { value: "5000_9999", label: "$5,000–$9,999" },
  { value: "10000_14999", label: "$10,000–$14,999" },
  { value: "15000_24999", label: "$15,000–$24,999" },
  { value: "25000_plus", label: "$25,000+" },
  { value: "not_sure", label: "Not sure" },
] as const

function asDraftValue(
  key: RadioQuestionKey,
  value: string,
): ProvinceFinderDraftAnswers[RadioQuestionKey] | undefined {
  const question = RADIO_QUESTIONS.find((item) => item.key === key)
  if (!question) return undefined
  const isAllowedValue = question.options.some((option) => option.value === value)
  if (!isAllowedValue) return undefined
  return value as ProvinceFinderDraftAnswers[RadioQuestionKey]
}

export function ProvinceFinderQuestionnaire() {
  const router = useRouter()
  const [answers, setAnswers] = useState<ProvinceFinderDraftAnswers>(() => loadPNPProvinceFinderAnswers())
  const [entryContext] = useState(() => loadPNPProvinceFinderEntryContext())
  const [errors, setErrors] = useState<string[]>([])
  const assessment = useMemo(() => loadAssessment(), [])
  const { signals: mainSignals, meta } = useMemo(() => buildPNPSignals(assessment ?? {}), [assessment])
  const finderSignals = useMemo(() => buildPNPProvinceFinderSignals(answers), [answers])
  const mvpResolution = useMemo(
    () => resolveMVPProvince({ mainSignals, finderSignals }),
    [finderSignals, mainSignals],
  )
  const pnpInScope = useMemo(() => isPNPInScope(assessment ?? {}), [assessment])
  const pnpScoring = useMemo(
    () => scorePNPRelevance(mainSignals, { unknownRate: meta.unknownRate }),
    [mainSignals, meta.unknownRate],
  )
  const pnpConfidence = useMemo(
    () =>
      derivePNPConfidence({
        score: pnpScoring.score,
        unknownRate: meta.unknownRate,
        dampenersApplied: pnpScoring.dampenersApplied,
      }),
    [meta.unknownRate, pnpScoring.dampenersApplied, pnpScoring.score],
  )
  const pnpChecklistAll = useMemo(
    () =>
      buildPNPReadinessChecklistAll({
        signals: mainSignals,
        meta: { unknownRate: meta.unknownRate },
      }),
    [mainSignals, meta.unknownRate],
  )
  const pnpOpenQuestions = useMemo(
    () =>
      generatePNPOpenQuestions({
        signals: mainSignals,
        meta: { unknownRate: meta.unknownRate },
        dampenersApplied: pnpScoring.dampenersApplied,
        confidenceLevel: pnpConfidence.confidenceLevel,
        readinessChecklistAll: pnpChecklistAll,
      }),
    [mainSignals, meta.unknownRate, pnpChecklistAll, pnpConfidence.confidenceLevel, pnpScoring.dampenersApplied],
  )
  const provinceRouterDecision = useMemo(
    () =>
      entryContext ??
      getPNPProvinceRouterDecision({
        pnpInScope,
        pnpFitScore: pnpScoring.score,
        pnpConfidence: pnpConfidence.confidenceLevel,
        missingItems: pnpOpenQuestions.openQuestions.map((item) => ({
          id: item.id,
          prompt: item.prompt,
        })),
      }),
    [entryContext, pnpConfidence.confidenceLevel, pnpInScope, pnpOpenQuestions.openQuestions, pnpScoring.score],
  )
  const hasJobOffer = assessment?.hasCanadianJobOffer === "yes"
  const currentlyWorkingInCanada = assessment?.currentlyWorkingInCanada === "yes"
  const outsideCanada = assessment?.currentLocation === "outside-canada"
  const showEmployerEligibilityDetails = hasJobOffer || currentlyWorkingInCanada
  const showSettlementFundsAmount = outsideCanada || !hasJobOffer

  const requiredKeys = getProvinceFinderRequiredRadioKeys()
  const completedRequiredCount = useMemo(
    () => requiredKeys.filter((key) => Boolean(answers[key])).length,
    [answers, requiredKeys],
  )
  const supplementalRequiredCount =
    2 +
    (answers.noc_known === "yes" || answers.noc_known === "no_not_sure" ? 1 : 0) +
    (answers.ee_profile_active === "yes" && answers.ee_crs_known ? 1 : 0) +
    (showEmployerEligibilityDetails ? 1 : 0)
  const supplementalCompletedCount =
    (answers.noc_known ? 1 : 0) +
    (answers.noc_known === "yes"
      ? answers.noc_code?.trim() && NOC_CODE_REGEX.test(answers.noc_code.trim())
        ? 1
        : 0
      : answers.noc_known === "no_not_sure"
        ? answers.teer_level_guess
          ? 1
          : 0
        : 0) +
    (answers.ee_profile_active ? 1 : 0) +
    (answers.ee_profile_active === "yes"
      ? answers.ee_crs_known === "yes"
        ? answers.ee_crs_score != null
          ? 1
          : 0
        : answers.ee_crs_known === "no"
          ? answers.ee_crs_range
            ? 1
            : 0
          : 0
      : 0) +
    (showEmployerEligibilityDetails && answers.employer_operation_years_in_province ? 1 : 0)
  const totalQuestions = requiredKeys.length + 1 + supplementalRequiredCount
  const progressText = `${Math.min(totalQuestions, completedRequiredCount + 1 + supplementalCompletedCount)}/${totalQuestions}`

  useEffect(() => {
    if (answers.noc_known !== "yes" && answers.noc_code) {
      updateAnswer("noc_code", undefined)
    }
    if (answers.noc_known !== "no_not_sure" && answers.teer_level_guess) {
      updateAnswer("teer_level_guess", undefined)
    }
    if (answers.ee_profile_active !== "yes") {
      if (answers.ee_crs_known) updateAnswer("ee_crs_known", undefined)
      if (answers.ee_crs_score != null) updateAnswer("ee_crs_score", null)
      if (answers.ee_crs_range) updateAnswer("ee_crs_range", undefined)
    } else if (answers.ee_crs_known === "yes") {
      if (answers.ee_crs_range) updateAnswer("ee_crs_range", undefined)
    } else if (answers.ee_crs_known === "no") {
      if (answers.ee_crs_score != null) updateAnswer("ee_crs_score", null)
    }
    if (!showEmployerEligibilityDetails) {
      if (answers.employer_operation_years_in_province) updateAnswer("employer_operation_years_in_province", undefined)
      if (answers.employer_annual_revenue_range) updateAnswer("employer_annual_revenue_range", undefined)
    }
    if (!hasJobOffer && answers.job_location_postal_code) {
      updateAnswer("job_location_postal_code", undefined)
    }
    if (!showSettlementFundsAmount && answers.settlement_funds_amount_range) {
      updateAnswer("settlement_funds_amount_range", undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    answers.noc_known,
    answers.noc_code,
    answers.teer_level_guess,
    answers.ee_profile_active,
    answers.ee_crs_known,
    answers.ee_crs_score,
    answers.ee_crs_range,
    answers.employer_operation_years_in_province,
    answers.employer_annual_revenue_range,
    answers.job_location_postal_code,
    answers.settlement_funds_amount_range,
    showEmployerEligibilityDetails,
    hasJobOffer,
    showSettlementFundsAmount,
  ])

  function updateAnswer<K extends keyof ProvinceFinderDraftAnswers>(
    key: K,
    value: ProvinceFinderDraftAnswers[K],
  ) {
    const updated = {
      ...answers,
      [key]: value,
    }
    setAnswers(updated)
    savePNPProvinceFinderAnswers(updated)
  }

  function onContinue() {
    const newErrors: string[] = []

    for (const key of requiredKeys) {
      if (!answers[key]) newErrors.push(`Please answer question ${RADIO_QUESTIONS.find((q) => q.key === key)?.id}.`)
    }

    if (answers.hourlyWage !== null && answers.hourlyWage < 0) {
      newErrors.push("Hourly wage must be zero or greater.")
    }

    newErrors.push(
      ...validateProvinceFinderSupplementalAnswers({
        draft: answers,
        context: {
          hasJobOffer,
          currentlyWorkingInCanada,
          outsideCanada,
        },
      }),
    )

    setErrors(newErrors)
    if (newErrors.length > 0) return
    if (!isCompleteProvinceFinderAnswers(answers)) return

    const currentFinderSignals = buildPNPProvinceFinderSignals(answers)
    const combinedSignals = mergeSignals(mainSignals, currentFinderSignals)
    const currentMVPResolution = resolveMVPProvince({
      mainSignals,
      finderSignals: currentFinderSignals,
    })
    const provinceCode = currentMVPResolution.provinceCode
    const evaluation = evaluatePNPProvince({
      provinceCode,
      combinedSignals,
    })
    if (!evaluation.supported) {
      setErrors([
        "MVP: Province refinement is currently available for British Columbia only.",
      ])
      return
    }

    const bcRecommendation = recommendationForProvince(answers, provinceCode)
    if (!bcRecommendation) {
      setErrors([
        "We couldn't build a British Columbia refinement result yet. Please try again.",
      ])
      return
    }

    const familyResult = buildBCProvinceFinderResult({
      combinedSignals,
      meta,
    })

    saveProvinceFinderRecommendations([bcRecommendation], answers, currentMVPResolution)
    savePNPProvinceFinderResult(familyResult)
    router.push(FINDER_RESULTS_PATH)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/assessment/results">Results</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={PNP_OVERVIEW_PATH}>PNP</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Province Finder</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link href={PNP_OVERVIEW_PATH}>
          <ArrowLeft className="size-4" />
          Back to PNP
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Province Finder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Answer a few questions to see which provinces may align with your profile.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              MVP: {PNP_PROVINCE_LABELS.BC} only (more provinces coming)
            </Badge>
          </div>
          {mvpResolution.mvpProvinceNotice ? (
            <p className="text-xs text-amber-700">
              MVP: Province refinement is currently available for British Columbia only.
              {mvpResolution.requestedProvinceInput
                ? ` You selected ${mvpResolution.requestedProvinceInput}.`
                : ""}{" "}
              You can still explore BC pathways.
            </p>
          ) : null}
          {provinceRouterDecision.bannerStyle !== "none" ? (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                provinceRouterDecision.bannerStyle === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {provinceRouterDecision.bannerTitle ? (
                <p className="font-medium">{provinceRouterDecision.bannerTitle}</p>
              ) : null}
              {provinceRouterDecision.bannerBody ? (
                <p className="mt-1">{provinceRouterDecision.bannerBody}</p>
              ) : null}
              {provinceRouterDecision.bannerMissingItems && provinceRouterDecision.bannerMissingItems.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {provinceRouterDecision.bannerMissingItems.map((item) => (
                    <li key={item.id}>{item.prompt}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Mode: {provinceRouterDecision.mode === "guided" ? "Guided refinement" : "Explore mode"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              savePNPProvinceFinderEntryContext(provinceRouterDecision)
              router.push(BC_REFINEMENT_PATH)
            }}
          >
            Figure out which BC stream fits me
          </Button>
          <p className="text-xs text-muted-foreground">Progress: {progressText}</p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {RADIO_QUESTIONS.filter((question) => question.id < 5).map((question) => {
          const currentValue = answers[question.key]

          return (
            <div key={question.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {question.id}) {question.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <fieldset>
                    <legend className="sr-only">{question.title}</legend>
                    <RadioGroup
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onValueChange={(value) => {
                        const nextValue = asDraftValue(question.key, value)
                        if (nextValue !== undefined) updateAnswer(question.key, nextValue)
                      }}
                      className="flex flex-wrap gap-3"
                      aria-label={question.title}
                    >
                      {question.options.map((option) => {
                        const id = `${question.key}-${option.value}`
                        return (
                          <Label
                            key={option.value}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                          >
                            <RadioGroupItem value={option.value} id={id} />
                            <span className="text-foreground">{option.label}</span>
                          </Label>
                        )
                      })}
                    </RadioGroup>
                  </fieldset>
                </CardContent>
              </Card>
            </div>
          )
        })}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4) What is your current hourly wage?</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="hourlyWage" className="mb-2 block text-sm text-muted-foreground">
              Numeric input (CAD). Optional.
            </Label>
            <Input
              id="hourlyWage"
              name="hourlyWage"
              type="number"
              min={0}
              step="0.01"
              value={answers.hourlyWage ?? ""}
              onChange={(event) => {
                const raw = event.target.value
                if (raw === "") {
                  updateAnswer("hourlyWage", null)
                  return
                }
                const next = Number(raw)
                updateAnswer("hourlyWage", Number.isNaN(next) ? null : next)
              }}
            />
          </CardContent>
        </Card>

        {RADIO_QUESTIONS.filter((question) => question.id >= 5).map((question) => {
          const currentValue = answers[question.key]

          return (
            <div key={question.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {question.id}) {question.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <fieldset>
                    <legend className="sr-only">{question.title}</legend>
                    <RadioGroup
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onValueChange={(value) => {
                        const nextValue = asDraftValue(question.key, value)
                        if (nextValue !== undefined) updateAnswer(question.key, nextValue)
                      }}
                      className="flex flex-wrap gap-3"
                      aria-label={question.title}
                    >
                      {question.options.map((option) => {
                        const id = `${question.key}-${option.value}`
                        return (
                          <Label
                            key={option.value}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                          >
                            <RadioGroupItem value={option.value} id={id} />
                            <span className="text-foreground">{option.label}</span>
                          </Label>
                        )
                      })}
                    </RadioGroup>
                  </fieldset>
                </CardContent>
              </Card>
            </div>
          )
        })}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">18) Do you know your NOC code?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset>
              <legend className="sr-only">Do you know your NOC code?</legend>
              <RadioGroup
                value={answers.noc_known ?? ""}
                onValueChange={(value) => {
                  if (value === "yes" || value === "no_not_sure") {
                    updateAnswer("noc_known", value)
                  }
                }}
                className="flex flex-wrap gap-3"
                aria-label="Do you know your NOC code?"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no_not_sure", label: "No / Not sure" },
                ].map((option) => {
                  const id = `noc-known-${option.value}`
                  return (
                    <Label key={option.value} htmlFor={id} className={CHOICE_CHIP_CLASS}>
                      <RadioGroupItem value={option.value} id={id} />
                      <span className="text-foreground">{option.label}</span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </fieldset>

            {answers.noc_known === "yes" ? (
              <div className="space-y-2">
                <Label htmlFor="noc_code" className="text-sm">
                  Enter your NOC (e.g., 21231)
                </Label>
                <Input
                  id="noc_code"
                  name="noc_code"
                  inputMode="numeric"
                  placeholder="e.g., 21231"
                  maxLength={5}
                  value={answers.noc_code ?? ""}
                  onChange={(event) => updateAnswer("noc_code", event.target.value)}
                />
              </div>
            ) : null}

            {answers.noc_known === "no_not_sure" ? (
              <div className="space-y-2">
                <Label htmlFor="teer_level_guess" className="text-sm">
                  Choose your TEER level (best guess)
                </Label>
                <Select
                  value={answers.teer_level_guess ?? ""}
                  onValueChange={(value) => updateAnswer("teer_level_guess", value as ProvinceFinderDraftAnswers["teer_level_guess"])}
                >
                  <SelectTrigger id="teer_level_guess" className="w-full">
                    <SelectValue placeholder="Select TEER level" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEER_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              This helps match you to PNP streams that require specific skill levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">19) Do you currently have an active Express Entry profile?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset>
              <legend className="sr-only">Do you currently have an active Express Entry profile?</legend>
              <RadioGroup
                value={answers.ee_profile_active ?? ""}
                onValueChange={(value) => {
                  if (value === "yes" || value === "no" || value === "not_sure") {
                    updateAnswer("ee_profile_active", value)
                  }
                }}
                className="flex flex-wrap gap-3"
                aria-label="Do you currently have an active Express Entry profile?"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "not_sure", label: "Not sure" },
                ].map((option) => {
                  const id = `ee-profile-active-${option.value}`
                  return (
                    <Label key={option.value} htmlFor={id} className={CHOICE_CHIP_CLASS}>
                      <RadioGroupItem value={option.value} id={id} />
                      <span className="text-foreground">{option.label}</span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </fieldset>

            {answers.ee_profile_active === "yes" ? (
              <>
                <fieldset>
                  <legend className="sr-only">Do you know your CRS score?</legend>
                  <Label className="mb-2 block text-sm">Do you know your CRS score?</Label>
                  <RadioGroup
                    value={answers.ee_crs_known ?? ""}
                    onValueChange={(value) => {
                      if (value === "yes" || value === "no") {
                        updateAnswer("ee_crs_known", value)
                      }
                    }}
                    className="flex flex-wrap gap-3"
                    aria-label="Do you know your CRS score?"
                  >
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ].map((option) => {
                      const id = `ee-crs-known-${option.value}`
                      return (
                        <Label key={option.value} htmlFor={id} className={CHOICE_CHIP_CLASS}>
                          <RadioGroupItem value={option.value} id={id} />
                          <span className="text-foreground">{option.label}</span>
                        </Label>
                      )
                    })}
                  </RadioGroup>
                </fieldset>

                {answers.ee_crs_known === "yes" ? (
                  <div className="space-y-2">
                    <Label htmlFor="ee_crs_score" className="text-sm">
                      Enter your CRS score
                    </Label>
                    <Input
                      id="ee_crs_score"
                      name="ee_crs_score"
                      type="number"
                      min={0}
                      max={1200}
                      value={answers.ee_crs_score ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value
                        if (raw === "") {
                          updateAnswer("ee_crs_score", null)
                          return
                        }
                        const value = Number(raw)
                        updateAnswer("ee_crs_score", Number.isNaN(value) ? null : value)
                      }}
                    />
                  </div>
                ) : null}

                {answers.ee_crs_known === "no" ? (
                  <div className="space-y-2">
                    <Label htmlFor="ee_crs_range" className="text-sm">
                      Estimate your CRS range
                    </Label>
                    <Select
                      value={answers.ee_crs_range ?? ""}
                      onValueChange={(value) => updateAnswer("ee_crs_range", value as ProvinceFinderDraftAnswers["ee_crs_range"])}
                    >
                      <SelectTrigger id="ee_crs_range" className="w-full">
                        <SelectValue placeholder="Select CRS range" />
                      </SelectTrigger>
                      <SelectContent>
                        {CRS_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Some provincial streams are aligned to Express Entry.
            </p>
          </CardContent>
        </Card>

        {showEmployerEligibilityDetails ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                20) How long has your employer operated in the province where the job is located?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={answers.employer_operation_years_in_province ?? ""}
                onValueChange={(value) =>
                  updateAnswer(
                    "employer_operation_years_in_province",
                    value as ProvinceFinderDraftAnswers["employer_operation_years_in_province"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYER_OPERATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label htmlFor="employer_annual_revenue_range" className="text-sm">
                  Approximate employer annual revenue (optional)
                </Label>
                <Select
                  value={answers.employer_annual_revenue_range ?? ""}
                  onValueChange={(value) =>
                    updateAnswer(
                      "employer_annual_revenue_range",
                      value as ProvinceFinderDraftAnswers["employer_annual_revenue_range"],
                    )
                  }
                >
                  <SelectTrigger id="employer_annual_revenue_range" className="w-full">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYER_REVENUE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                Some employer-driven PNP streams have employer eligibility requirements.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {hasJobOffer ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">21) Enter the job location postal code (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                value={answers.job_location_postal_code ?? ""}
                onChange={(event) => updateAnswer("job_location_postal_code", event.target.value)}
                placeholder="e.g. A1A 1A1"
              />
              <p className="text-xs text-muted-foreground">
                This helps identify regional or rural pathways when applicable.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {showSettlementFundsAmount ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                22) If required, approximately how much settlement funds do you have available? (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={answers.settlement_funds_amount_range ?? ""}
                onValueChange={(value) =>
                  updateAnswer(
                    "settlement_funds_amount_range",
                    value as ProvinceFinderDraftAnswers["settlement_funds_amount_range"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select amount range" />
                </SelectTrigger>
                <SelectContent>
                  {SETTLEMENT_FUNDS_AMOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Some pathways may require proof of funds depending on your situation.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {errors.length > 0 ? (
        <Card className="mt-4 border-destructive/40">
          <CardContent className="pt-6">
            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onContinue}>Continue</Button>
        <Button variant="outline" asChild>
          <Link href={PNP_OVERVIEW_PATH}>Back to PNP</Link>
        </Button>
      </div>
    </div>
  )
}
