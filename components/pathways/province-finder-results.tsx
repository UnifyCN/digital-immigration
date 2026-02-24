"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
  loadPNPProvinceFinderEntryContext,
  loadProvinceFinderMVPResolution,
  savePNPProvinceFinderResult,
} from "@/lib/pathways/provinceFinderStorage"
import { buildPNPSignals } from "@/lib/pathways/pnpSignals"
import { buildPNPProvinceFinderSignals, mergeSignals, resolveMVPProvince } from "@/lib/pathways/pnpProvinceScope"
import { buildBCProvinceFinderResult } from "@/lib/pathways/pnpBcFamilyEvaluator"
import {
  getFamilyDetailsRoute,
  mapBaselineDisplay,
  mapConfidenceDisplay,
  mapFitLabel,
  selectRecommendedFamilies,
} from "@/lib/pathways/bcRecommendationDisplay"
import { PNP_PROVINCE_LABELS } from "@/lib/config/pnpScope"
import { loadAssessment } from "@/lib/storage"
import type {
  DisplayConfidenceLabel,
  FitLabel,
} from "@/lib/pathways/bcRecommendationDisplay"
import type {
  EvaluatedFamily,
  MatchLevel,
  ProvinceFinderEvaluation,
} from "@/lib/rules/pnp/bcFamilies"

const PNP_OVERVIEW_PATH = "/assessment/results/pathways/pnp"
const FINDER_PATH = "/assessment/results/pathways/pnp/province-finder"
const BC_REFINEMENT_PATH = "/assessment/results/pathways/pnp/bc-refinement"

function baselineBadgeVariant(badge: EvaluatedFamily["baselineBadge"]): "default" | "secondary" | "outline" {
  if (badge === "pass") return "default"
  if (badge === "unclear") return "secondary"
  return "outline"
}

function matchLevelLabel(matchLevel: MatchLevel): string {
  if (matchLevel === "strong") return "Strong match"
  if (matchLevel === "possible") return "Possible match"
  return "Weak match"
}

function matchLevelVariant(matchLevel: MatchLevel): "default" | "secondary" | "outline" {
  if (matchLevel === "strong") return "default"
  if (matchLevel === "possible") return "secondary"
  return "outline"
}

function fitVariant(fit: FitLabel): "default" | "secondary" | "outline" {
  if (fit === "High") return "default"
  if (fit === "Medium") return "secondary"
  return "outline"
}

function displayConfidenceToVariant(confidence: DisplayConfidenceLabel): "default" | "secondary" | "outline" {
  if (confidence === "High") return "default"
  if (confidence === "Medium") return "secondary"
  return "outline"
}

function modeCopy(mode: "guided" | "explore"): { heading: string; subhead: string } {
  if (mode === "explore") {
    return {
      heading: "BC pathways you can still explore (low fit so far)",
      subhead:
        "Based on your current answers, BC PNP may not be the strongest match yet. If you still want to explore, confirm a few details to improve accuracy.",
    }
  }
  return {
    heading: "Recommended BC pathways to explore",
    subhead:
      "Based on your answers so far, these options appear most aligned. You can refine your result by answering a few missing questions.",
  }
}

type BCPathwayRecommendationCardProps = {
  family: EvaluatedFamily
  onRefine: () => void
}

function BCPathwayRecommendationCard({ family, onRefine }: BCPathwayRecommendationCardProps) {
  const fit = mapFitLabel(family)
  const confidence = mapConfidenceDisplay(family)
  const baseline = mapBaselineDisplay(family.baselineBadge)
  const whyBullets = family.whyBullets.slice(0, 4)
  while (whyBullets.length < 2) {
    whyBullets.push("We can refine this recommendation with a couple more details.")
  }
  const showLimitingFactors = family.matchLevel === "weak" || family.baselineBadge === "fail"
  const limitingFactors = family.hardBlockers.slice(0, 3)
  const showQuickQuestions = family.baselineBadge === "unclear" || confidence === "Low"
  const quickQuestions = family.missingInfo.slice(0, 3)

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{family.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={matchLevelVariant(family.matchLevel)}>{matchLevelLabel(family.matchLevel)}</Badge>
            <Badge variant={fitVariant(fit)}>Fit: {fit}</Badge>
            <Badge variant={displayConfidenceToVariant(confidence)}>Confidence: {confidence}</Badge>
            <Badge variant={baselineBadgeVariant(family.baselineBadge)}>
              {baseline.icon} {baseline.label}
            </Badge>
          </div>
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">{family.shortDescription}</p>
        <p className="text-xs text-muted-foreground">Fit score: {family.fitScore}/100</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Why this appears relevant</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {whyBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>

        {showLimitingFactors ? (
          <div>
            <p className="mb-2 text-sm font-medium">Current limiting factors</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {(limitingFactors.length > 0
                ? limitingFactors
                : ["Some key baseline signals are not confirmed yet."]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {showQuickQuestions && quickQuestions.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Quick questions to refine</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {quickQuestions.map((item) => (
                <li key={item.id}>{item.prompt}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={getFamilyDetailsRoute(family.familyId)}>See details</Link>
          </Button>
          {(family.missingInfo.length > 0 || family.confidence === "low") && (
            <Button type="button" variant="secondary" onClick={onRefine}>
              Answer 2-3 questions to refine
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ProvinceFinderResults() {
  const router = useRouter()
  const [draft] = useState(() => loadPNPProvinceFinderAnswers())
  const [entryContext] = useState(() => loadPNPProvinceFinderEntryContext())
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
  const [familyResult, setFamilyResult] = useState<ProvinceFinderEvaluation | null>(() =>
    loadPNPProvinceFinderResult(),
  )
  const mode = entryContext?.mode ?? "guided"
  const sectionCopy = modeCopy(mode)
  const selectedFamilies = useMemo(
    () => selectRecommendedFamilies(familyResult?.evaluatedFamilies ?? []),
    [familyResult],
  )
  const allShownWeak = selectedFamilies.length > 0 && selectedFamilies.every((item) => item.matchLevel === "weak")

  useEffect(() => {
    if (!isCompleteProvinceFinderAnswers(draft)) return
    if (familyResult?.provinceCode === "BC" && familyResult.evaluatedFamilies.length > 0) return
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
          <CardTitle>{sectionCopy.heading}</CardTitle>
          <p className="text-sm text-muted-foreground">{sectionCopy.subhead}</p>
          {allShownWeak ? (
            <p className="text-xs text-muted-foreground">
              Tip: Answer a few missing questions to improve recommendation accuracy.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      <div className="mt-4 space-y-4">
        {selectedFamilies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No BC pathway recommendations are available yet. Try refining your answers first.
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedFamilies.map((family) => (
            <BCPathwayRecommendationCard
              key={family.familyId}
              family={family}
              onRefine={() => router.push(BC_REFINEMENT_PATH)}
            />
          ))
        )}
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
