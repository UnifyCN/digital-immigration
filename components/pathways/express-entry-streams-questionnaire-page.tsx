"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ExpressEntryStreamsQuestionnaire } from "@/components/pathways/express-entry-streams-questionnaire"
import { loadAssessment, saveAssessment } from "@/lib/storage"
import type { FollowUpQuestionSpec } from "@/lib/immigration/expressEntry/types"
import type { AssessmentData } from "@/lib/types"

const EXPRESS_ENTRY_OVERVIEW_PATH = "/assessment/results/pathways/express-entry"
const STREAM_RESULTS_PATH = "/assessment/results/pathways/express-entry/streams/results"

function buildAllStreamQuestions(assessment: AssessmentData): FollowUpQuestionSpec[] {
  const questions: FollowUpQuestionSpec[] = [
    {
      id: "shared.intentOutsideQuebec",
      program: "shared",
      fieldKey: "shared.intentOutsideQuebec",
      prompt: "Do you intend to live outside Quebec when applying under Express Entry?",
      controlType: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "auth.currentlyAuthorizedToWorkInCanada",
      program: "shared",
      fieldKey: "auth.currentlyAuthorizedToWorkInCanada",
      prompt: "Are you currently legally authorized to work in Canada?",
      controlType: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "language.primary.testType",
      program: "shared",
      fieldKey: "language.primary.testType",
      prompt: "Which approved language test did you take?",
      controlType: "select",
      required: true,
      options: [
        { value: "ielts-general-training", label: "IELTS General" },
        { value: "celpip-general", label: "CELPIP General" },
        { value: "tef-canada", label: "TEF Canada" },
        { value: "tcf-canada", label: "TCF Canada" },
        { value: "pte-core", label: "PTE Core" },
      ],
    },
    {
      id: "language.primary.testDate",
      program: "shared",
      fieldKey: "language.primary.testDate",
      prompt: "What is the test date?",
      controlType: "date",
      required: true,
    },
    {
      id: "language.primary.stream",
      program: "shared",
      fieldKey: "language.primary.stream",
      prompt: "Which stream is this language result from?",
      controlType: "radio",
      required: true,
      options: [
        { value: "general", label: "General" },
        { value: "n/a", label: "N/A" },
      ],
    },
    {
      id: "language.primary.scores",
      program: "shared",
      fieldKey: "language.primary.scores",
      prompt: "Enter L/R/W/S scores for your primary language test.",
      controlType: "text",
      required: true,
    },
    {
      id: "jobOffer.validity",
      program: "FSW",
      fieldKey: "jobOffer.validity",
      prompt: "Do you have a valid qualifying job offer for Express Entry?",
      controlType: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "funds.familySize",
      program: "shared",
      fieldKey: "funds.familySize",
      prompt: "How many people are in your family size for settlement funds?",
      controlType: "number",
      required: true,
    },
    {
      id: "funds.available",
      program: "shared",
      fieldKey: "funds.available",
      prompt: "How much settlement funds do you currently have available (CAD)?",
      controlType: "number",
      required: true,
    },
  ]

  const roles = assessment.workRoles ?? []
  const skilledRoleOptions = roles
    .filter((role) => role.teer === "0" || role.teer === "1" || role.teer === "2" || role.teer === "3")
    .map((role) => ({
      value: role.id,
      label: `${role.title || "Role"} (${role.noc2021Code || "NOC missing"})`,
    }))

  if (skilledRoleOptions.length > 0) {
    questions.push({
      id: "fsw.primaryOccupationRoleId",
      program: "FSW",
      fieldKey: "fsw.primaryOccupationRoleId",
      prompt: "Which job are you using as your primary occupation for FSW?",
      controlType: "select",
      required: true,
      options: skilledRoleOptions,
    })
  }

  questions.push({
    id: "fst.offer.path",
    program: "FST",
    fieldKey: "fst.offer.path",
    prompt: "Do you have a Canadian certificate of qualification or a valid 1-year full-time trade job offer?",
    controlType: "radio",
    required: true,
    options: [
      { value: "certificate", label: "Certificate" },
      { value: "job-offer", label: "Job offer" },
      { value: "neither", label: "Neither" },
    ],
  })

  questions.push({
    id: "fst.offer.employer.1",
    program: "FST",
    fieldKey: "fst.offer.employer.1",
    prompt: "Enter FST offer details (up to two employers): paid, continuous, full-time (30+ hrs/week), and duration of at least 1 year.",
    controlType: "text",
    required: true,
  })

  for (const role of roles) {
    questions.push(
      {
        id: `role.${role.id}.nocCode`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.nocCode`,
        prompt: `Select the NOC 2021 code for ${role.title || "this job"}.`,
        controlType: "text",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.nocDutiesMatchConfirmed`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.nocDutiesMatchConfirmed`,
        prompt: `Confirm duties for ${role.title || "this job"} match the NOC lead statement and most main duties.`,
        controlType: "checkbox",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.startDate`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.startDate`,
        prompt: `Enter start date for ${role.title || "this job"}.`,
        controlType: "date",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.endDate`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.endDate`,
        prompt: `Enter end date for ${role.title || "this job"}, or leave blank if present.`,
        controlType: "date",
        required: false,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.hoursPerWeek`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.hoursPerWeek`,
        prompt: `Enter average hours/week for ${role.title || "this job"}.`,
        controlType: "number",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.paid`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.paid`,
        prompt: `Was ${role.title || "this job"} paid?`,
        controlType: "radio",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.employmentType`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.employmentType`,
        prompt: `What was the employment type for ${role.title || "this job"}?`,
        controlType: "select",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.wasFullTimeStudent`,
        program: "shared",
        fieldKey: `work.roles.${role.id}.wasFullTimeStudent`,
        prompt: `Were you a full-time student during any part of ${role.title || "this job"}?`,
        controlType: "radio",
        required: true,
        roleId: role.id,
      },
      {
        id: `role.${role.id}.qualifiedToPracticeInCountry`,
        program: "FST",
        fieldKey: `work.roles.${role.id}.qualifiedToPracticeInCountry`,
        prompt: `Were you qualified to practice this trade where you gained ${role.title || "this job"} experience?`,
        controlType: "radio",
        required: true,
        roleId: role.id,
      },
    )

    const normalizedCountry = (role.country ?? "").trim().toLowerCase()
    const isCanadianRole = normalizedCountry === "canada" || normalizedCountry === "ca" || normalizedCountry === "can"

    if (isCanadianRole) {
      questions.push(
        {
          id: `role.${role.id}.wasAuthorizedInCanada`,
          program: "CEC",
          fieldKey: `work.roles.${role.id}.wasAuthorizedInCanada`,
          prompt: "Were you authorized to work for the entire period of this Canadian job?",
          controlType: "radio",
          required: true,
          roleId: role.id,
        },
        {
          id: `role.${role.id}.physicallyInCanada`,
          program: "CEC",
          fieldKey: `work.roles.${role.id}.physicallyInCanada`,
          prompt: `If remote, were you physically in Canada while working ${role.title || "this job"}?`,
          controlType: "radio",
          required: true,
          roleId: role.id,
        },
      )
    }
  }

  return questions
}

export function ExpressEntryStreamsQuestionnairePage() {
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentData | null>(() => loadAssessment())

  const questions = useMemo(() => {
    if (!assessment) return []
    return buildAllStreamQuestions(assessment)
  }, [assessment])

  if (!assessment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No assessment found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Start your assessment first to classify Express Entry streams.</p>
            <Button asChild>
              <Link href="/assessment">Start assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
              <Link href={EXPRESS_ENTRY_OVERVIEW_PATH}>Express Entry</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Stream Questionnaire</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link href={EXPRESS_ENTRY_OVERVIEW_PATH}>
          <ArrowLeft className="size-4" />
          Back to Express Entry
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Express Entry Stream Questionnaire</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete this full stream questionnaire to classify CEC, FSW, and FST eligibility.
          </p>
        </CardHeader>
      </Card>

      <ExpressEntryStreamsQuestionnaire
        questions={questions}
        assessment={assessment}
        onChange={(next) => {
          setAssessment(next)
          saveAssessment(next)
        }}
      />

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={() => {
            if (assessment) saveAssessment(assessment)
            router.push(STREAM_RESULTS_PATH)
          }}
        >
          See Stream Classification Results
        </Button>
      </div>
    </div>
  )
}
