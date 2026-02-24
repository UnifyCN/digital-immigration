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
import type { AssessmentData } from "@/lib/types"
import {
  buildComprehensiveFollowUpFieldList,
  buildFollowUpQuestions,
} from "@/lib/immigration/expressEntry/followUpQuestions"
import { buildProfileFromAnswers } from "@/lib/immigration/expressEntry/streamsEngine"

const EXPRESS_ENTRY_OVERVIEW_PATH = "/assessment/results/pathways/express-entry"
const STREAM_RESULTS_PATH = "/assessment/results/pathways/express-entry/streams/results"

export function ExpressEntryStreamsQuestionnairePage() {
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentData | null>(() => loadAssessment())

  const questions = useMemo(() => {
    if (!assessment) return []
    const profile = buildProfileFromAnswers(assessment)
    const allFields = buildComprehensiveFollowUpFieldList(profile)
    return buildFollowUpQuestions(allFields, profile)
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
