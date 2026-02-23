"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { isCompleteProvinceFinderAnswers } from "@/lib/pathways/provinceFinder"
import {
  loadPNPProvinceFinderResult,
  loadPNPProvinceFinderAnswers,
  loadProvinceFinderMVPResolution,
  savePNPProvinceFinderResult,
} from "@/lib/pathways/provinceFinderStorage"
import { buildPNPSignals } from "@/lib/pathways/pnpSignals"
import { buildPNPProvinceFinderSignals, mergeSignals, resolveMVPProvince } from "@/lib/pathways/pnpProvinceScope"
import { buildBCProvinceFinderResult } from "@/lib/pathways/pnpBcFamilyEvaluator"
import { PNP_PROVINCE_LABELS } from "@/lib/config/pnpScope"
import { loadAssessment } from "@/lib/storage"
import type { FamilyConfidence, ProvinceFinderResult } from "@/lib/rules/pnp/bcFamilies"
import type { BaselineBadge } from "@/lib/rules/pnp/bcHardChecks"

const PNP_OVERVIEW_PATH = "/assessment/results/pathways/pnp"
const FINDER_PATH = "/assessment/results/pathways/pnp/province-finder"

function confidenceVariant(confidence: FamilyConfidence): "default" | "secondary" | "outline" {
  if (confidence === "high") return "default"
  if (confidence === "medium") return "secondary"
  return "outline"
}

function confidenceLabel(confidence: FamilyConfidence): string {
  if (confidence === "high") return "High confidence"
  if (confidence === "medium") return "Medium confidence"
  return "Low confidence"
}

function baselineBadgeLabel(badge: BaselineBadge): string {
  if (badge === "pass") return "✅ Baseline met"
  if (badge === "unclear") return "⚠️ Baseline unclear"
  return "❌ Baseline limited"
}

function baselineBadgeVariant(badge: BaselineBadge): "default" | "secondary" | "outline" {
  if (badge === "pass") return "default"
  if (badge === "unclear") return "secondary"
  return "outline"
}

export function ProvinceFinderResults() {
  const [draft] = useState(() => loadPNPProvinceFinderAnswers())
  const assessment = useMemo(() => loadAssessment(), [])
  const { signals: mainSignals, meta } = useMemo(() => buildPNPSignals(assessment ?? {}), [assessment])
  const finderSignals = useMemo(() => buildPNPProvinceFinderSignals(draft), [draft])
  const combinedSignals = useMemo(
    () => mergeSignals(mainSignals, finderSignals),
    [finderSignals, mainSignals],
  )
  const fallbackResolution = useMemo(
    () =>
      resolveMVPProvince({
        mainSignals,
        finderSignals,
      }),
    [finderSignals, mainSignals],
  )
  const [mvpResolution] = useState(() => loadProvinceFinderMVPResolution() ?? fallbackResolution)
  const [familyResult, setFamilyResult] = useState<ProvinceFinderResult | null>(() =>
    loadPNPProvinceFinderResult(),
  )

  useEffect(() => {
    if (!isCompleteProvinceFinderAnswers(draft)) return
    if (familyResult?.provinceCode === "BC" && familyResult.recommendations.length > 0) return
    const computed = buildBCProvinceFinderResult({
      combinedSignals,
      meta,
    })
    setFamilyResult(computed)
    savePNPProvinceFinderResult(computed)
  }, [combinedSignals, draft, familyResult, meta])

  if (!isCompleteProvinceFinderAnswers(draft)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Province Finder results unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Complete the questionnaire first to see your province alignment shortlist.
            </p>
            <Button asChild>
              <Link href={FINDER_PATH}>Go to Province Finder</Link>
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
        <Link href={FINDER_PATH}>
          <ArrowLeft className="size-4" />
          Back to Province Finder
        </Link>
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Province Finder Results</CardTitle>
          <p className="text-xs font-medium text-muted-foreground">
            MVP: {PNP_PROVINCE_LABELS.BC} only (more provinces coming).
          </p>
          {mvpResolution.mvpProvinceNotice ? (
            <p className="text-xs text-amber-700">
              MVP: Province refinement is currently available for British Columbia only.
              {mvpResolution.requestedProvinceInput
                ? ` You selected ${mvpResolution.requestedProvinceInput}.`
                : ""}{" "}
              You can still explore BC pathways.
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            This province appears aligned based on your answers and is worth exploring next.
          </p>
          <p className="text-xs text-muted-foreground">
            Not legal advice. Stream criteria change. Confirm official requirements.
          </p>
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Best BC PNP pathways to explore</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked pathway families based on your BC-related profile signals.
          </p>
        </CardHeader>
      </Card>

      <div className="mt-4 space-y-4">
        {(familyResult?.recommendations ?? []).map((recommendation) => (
          <Card key={recommendation.familyId}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{recommendation.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={baselineBadgeVariant(recommendation.baselineBadge)}>
                    {baselineBadgeLabel(recommendation.baselineBadge)}
                  </Badge>
                  <Badge variant={confidenceVariant(recommendation.confidence)}>
                    {confidenceLabel(recommendation.confidence)}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.shortDescription}</p>
              <p className="text-sm text-muted-foreground">Fit score: {recommendation.fitScore}/100</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendation.baselineBadge === "fail" ? (
                <div>
                  <p className="mb-2 text-sm font-medium">Current limits</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {recommendation.hardBlockers.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recommendation.baselineBadge === "unclear" ? (
                <div>
                  <p className="mb-2 text-sm font-medium">We still need a few required details</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                    {recommendation.missingRequired.slice(0, 3).map((item) => (
                      <li key={item.id}>{item.prompt}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recommendation.baselineBadge === "pass" ? (
                <div>
                  <p className="mb-2 text-sm font-medium">Why this fits</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                    {recommendation.whyBullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium">What we still need</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {recommendation.openQuestions.map((question) => (
                    <li key={question.id}>
                      <span>{question.prompt}</span>
                      {question.reason ? (
                        <span className="block text-xs text-muted-foreground">{question.reason}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" asChild>
                <Link href={`/assessment/results/pathways/pnp/province-finder/family/${recommendation.familyId}`}>
                  See details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" asChild>
          <Link href={FINDER_PATH}>Refine answers</Link>
        </Button>
        <Button asChild>
          <Link href={PNP_OVERVIEW_PATH}>Back to PNP overview</Link>
        </Button>
      </div>
    </div>
  )
}
