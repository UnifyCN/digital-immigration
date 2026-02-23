"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  computeProvinceRecommendations,
  getProvinceFinderRequiredRadioKeys,
  isCompleteProvinceFinderAnswers,
  type ProvinceFinderAnswers,
  type ProvinceFinderDraftAnswers,
} from "@/lib/pathways/provinceFinder"
import {
  loadProvinceFinderDraft,
  saveProvinceFinderDraft,
  saveProvinceFinderRecommendations,
} from "@/lib/pathways/provinceFinderStorage"

type RadioQuestionKey = Exclude<keyof ProvinceFinderAnswers, "hourlyWage">

type RadioQuestion = {
  id: number
  key: RadioQuestionKey
  title: string
  options: Array<{ value: string; label: string }>
}

const PNP_OVERVIEW_PATH = "/assessment/results/pathways/pnp"
const FINDER_RESULTS_PATH = "/assessment/results/pathways/pnp/province-finder/results"

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
  const [answers, setAnswers] = useState<ProvinceFinderDraftAnswers>(() => loadProvinceFinderDraft())
  const [errors, setErrors] = useState<string[]>([])

  const requiredKeys = getProvinceFinderRequiredRadioKeys()
  const completedRequiredCount = useMemo(
    () => requiredKeys.filter((key) => Boolean(answers[key])).length,
    [answers, requiredKeys],
  )
  const totalQuestions = requiredKeys.length + 1
  const progressText = `${Math.min(totalQuestions, completedRequiredCount + 1)}/${totalQuestions}`

  function updateAnswer<K extends keyof ProvinceFinderDraftAnswers>(
    key: K,
    value: ProvinceFinderDraftAnswers[K],
  ) {
    const updated = {
      ...answers,
      [key]: value,
    }
    setAnswers(updated)
    saveProvinceFinderDraft(updated)
  }

  function onContinue() {
    const newErrors: string[] = []

    for (const key of requiredKeys) {
      if (!answers[key]) newErrors.push(`Please answer question ${RADIO_QUESTIONS.find((q) => q.key === key)?.id}.`)
    }

    if (answers.hourlyWage !== null && answers.hourlyWage < 0) {
      newErrors.push("Hourly wage must be zero or greater.")
    }

    setErrors(newErrors)
    if (newErrors.length > 0) return
    if (!isCompleteProvinceFinderAnswers(answers)) return

    const recommendations = computeProvinceRecommendations(answers)
    saveProvinceFinderRecommendations(recommendations, answers)
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
