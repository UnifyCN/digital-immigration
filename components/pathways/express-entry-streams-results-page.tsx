"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { loadAssessment } from "@/lib/storage"
import { classifyExpressEntryStreams } from "@/lib/immigration/expressEntry/streamsEngine"
import { getStreamStatusMeta } from "@/lib/immigration/expressEntry/statusMeta"

const QUESTIONNAIRE_PATH = "/assessment/results/pathways/express-entry/streams"
const EXPRESS_ENTRY_OVERVIEW_PATH = "/assessment/results/pathways/express-entry"

const streamInfo = {
  CEC: "Canadian Experience Class is for skilled workers with eligible recent Canadian work experience.",
  FSW: "Federal Skilled Worker requires a continuous year in one primary skilled occupation and 67-point grid pass.",
  FST: "Federal Skilled Trades is for eligible trade NOCs with 2 years of experience plus certificate or valid offer path.",
}

export function ExpressEntryStreamsResultsPage() {
  const [assessment] = useState(() => loadAssessment())
  const result = useMemo(
    () => (assessment ? classifyExpressEntryStreams(assessment) : null),
    [assessment],
  )

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
  if (!result) return null

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
            <BreadcrumbPage>Stream Results</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
        <Link href={QUESTIONNAIRE_PATH}>
          <ArrowLeft className="size-4" />
          Back to questionnaire
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Express Entry Stream Classification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ruleset date: {result.rulesetDate}. As of: {result.asOfDate}.
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          <p>Eligible stream set: {result.eligiblePrograms.length > 0 ? result.eligiblePrograms.join(", ") : "None yet"}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {(["CEC", "FSW", "FST"] as const).map((program) => {
          const programResult = result.programResults[program]
          const meta = getStreamStatusMeta(programResult.status)
          return (
            <Card key={program}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{program}</span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{streamInfo[program]}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">Why this status:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {programResult.reasons.slice(0, 6).map((reason, index) => (
                    <li key={`${program}-${index}`}>{reason}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {result.nextQuestions.length > 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Still needed to finalize classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              {result.nextQuestions.slice(0, 8).map((question) => (
                <li key={question.id}>{question.prompt}</li>
              ))}
            </ul>
            <Button asChild>
              <Link href={QUESTIONNAIRE_PATH}>Complete remaining questions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
