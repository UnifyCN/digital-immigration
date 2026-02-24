"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadAssessment } from "@/lib/storage"
import { computeResults } from "@/lib/scoring"
import { buildPnpBrief } from "@/lib/pathways/pnpContent"
import { buildExpressEntryBrief } from "@/lib/pathways/expressEntryContent"
import {
  demoProvinceFinderAnswers,
  formatProvinceShortlistSummary,
  recommendationForProvince,
  type ProvinceRecommendation,
} from "@/lib/pathways/provinceFinder"
import {
  loadProvinceFinderRecommendations,
  savePNPProvinceFinderEntryContext,
  savePNPProvinceFinderAnswers,
  saveProvinceFinderRecommendations,
} from "@/lib/pathways/provinceFinderStorage"
import { PNP_MVP_DEFAULT_PROVINCE } from "@/lib/config/pnpScope"
import { isPNPInScope } from "@/lib/pnp-scope"
import { getPNPProvinceRouterDecision } from "@/lib/pathways/pnpProvinceRouter"
import type { ChecklistStatus } from "@/lib/pathways/types"
import type { AssessmentData, ConfidenceLevel, PathwayCard } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

const BC_REFINEMENT_PATH = "/assessment/results/pathways/pnp/bc-refinement"

type PathwayDetailProps = {
  slug: string
}

type PathwayBriefCommon = {
  whyIntro: string
  whyBullets: string[]
  checklistIntro: string
  checklistRows: Array<{ label: string; status: ChecklistStatus }>
  checklistNote: string
  nextSteps: string[]
  documentChecklist: {
    typical: string[]
    sometimes: string[]
    laterStage: string[]
  }
  timelines: {
    stages: string[]
    commonDelays: string[]
  }
  riskFlags: string[]
  openQuestions: string[]
  professionalReviewCases: string[]
}

type PathwayBriefLayoutProps = {
  title: string
  description: string
  confidence: ConfidenceLevel
  brief: PathwayBriefCommon
  documentRoadmap?: PathwayCard["documentRoadmap"]
  lowConfidenceMessaging?: {
    whyLimitedBullets: string[]
    howToImproveBullets: string[]
  }
  onBack: () => void
  openQuestionsHref: string
  refinePlanLabel: string
  pathwaySpecificSection: ReactNode
  nextActionsPrimary?: ReactNode
}

const statusMeta: Record<ChecklistStatus, { label: string; className: string }> = {
  complete: { label: "✅", className: "text-tier-clean" },
  warning: { label: "⚠️", className: "text-tier-moderate" },
  unknown: { label: "?", className: "text-muted-foreground" },
}

const documentStatusMeta: Record<
  "ready" | "needs_action" | "conditional" | "later_stage",
  { label: string; className: string }
> = {
  ready: { label: "ready", className: "text-tier-clean" },
  needs_action: { label: "needs action", className: "text-tier-moderate" },
  conditional: { label: "conditional", className: "text-muted-foreground" },
  later_stage: { label: "later stage", className: "text-muted-foreground" },
}

function formatConfidence(confidence?: ConfidenceLevel): ConfidenceLevel {
  return confidence ?? "High"
}

function SectionList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PathwayBriefLayout({
  title,
  description,
  confidence,
  brief,
  documentRoadmap,
  lowConfidenceMessaging,
  onBack,
  openQuestionsHref,
  refinePlanLabel,
  pathwaySpecificSection,
  nextActionsPrimary,
}: PathwayBriefLayoutProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="size-4" />
        Back to results
      </Button>

      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Badge variant="outline" className="text-xs">Confidence: {confidence}</Badge>
        </div>
      </div>

      <div className="sticky top-2 z-10 mb-6 rounded-md border border-border bg-background/95 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        Not legal advice. This is a structured overview of public requirements. You review and decide.
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1) Why this appears relevant to you</CardTitle>
            <p className="text-sm text-muted-foreground">{brief.whyIntro}</p>
          </CardHeader>
          <CardContent>
            {lowConfidenceMessaging ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Why PNP appears limited right now
                  </p>
                  <SectionList items={lowConfidenceMessaging.whyLimitedBullets} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    What would strengthen your PNP options
                  </p>
                  <SectionList items={lowConfidenceMessaging.howToImproveBullets} />
                </div>
              </div>
            ) : (
              <SectionList items={brief.whyBullets} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2) Fast eligibility checklist (high-level gates)</CardTitle>
            <p className="text-sm text-muted-foreground">{brief.checklistIntro}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {brief.checklistRows.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground">{row.label}</span>
                  <span className={`text-sm font-medium ${statusMeta[row.status].className}`}>
                    {statusMeta[row.status].label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{brief.checklistNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3) What you need next (recommended next steps)</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
              {brief.nextSteps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4) Document checklist (typical vs sometimes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentRoadmap ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Typical:</p>
                  <div className="space-y-2">
                    {documentRoadmap.typical.map((item) => (
                      <div key={item.id} className="rounded-md border border-border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground">{item.label}</p>
                          <span className={`text-xs font-medium ${documentStatusMeta[item.status].className}`}>
                            {documentStatusMeta[item.status].label}
                          </span>
                        </div>
                        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Sometimes:</p>
                  <div className="space-y-2">
                    {documentRoadmap.sometimes.map((item) => (
                      <div key={item.id} className="rounded-md border border-border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground">{item.label}</p>
                          <span className={`text-xs font-medium ${documentStatusMeta[item.status].className}`}>
                            {documentStatusMeta[item.status].label}
                          </span>
                        </div>
                        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Later-stage:</p>
                  <div className="space-y-2">
                    {documentRoadmap.later.map((item) => (
                      <div key={item.id} className="rounded-md border border-border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground">{item.label}</p>
                          <span className={`text-xs font-medium ${documentStatusMeta[item.status].className}`}>
                            {documentStatusMeta[item.status].label}
                          </span>
                        </div>
                        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Typical:</p>
                  <SectionList items={brief.documentChecklist.typical} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Sometimes:</p>
                  <SectionList items={brief.documentChecklist.sometimes} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Later-stage:</p>
                  <SectionList items={brief.documentChecklist.laterStage} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5) Timelines & stages (what the journey looks like)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionList items={brief.timelines.stages} />
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Common delays:</p>
              <SectionList items={brief.timelines.commonDelays} />
            </div>
          </CardContent>
        </Card>

        {pathwaySpecificSection}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7) Common refusal triggers / risk flags</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionList items={brief.riskFlags} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">8) What we still need from you (Open questions)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {brief.openQuestions.map((question, index) => (
              <div
                key={`${question}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm text-foreground">{question}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={openQuestionsHref}>Complete now</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">9) When a licensed professional review may be appropriate</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionList items={brief.professionalReviewCases} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">10) Next actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {nextActionsPrimary ?? (
              <Button asChild>
                <Link href="/assessment/results">{refinePlanLabel}</Link>
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/assessment/results#review-answers">View my answers</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Export coming soon",
                    description: "We will add export support in a future update.",
                  })
                }}
              >
                Export this plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function PathwayDetail({ slug }: PathwayDetailProps) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceLevel>("High")
  const [pnpConfidenceLevel, setPnpConfidenceLevel] = useState<PathwayCard["confidenceLevel"]>()
  const [pnpWhyBullets, setPnpWhyBullets] = useState<string[]>([])
  const [pnpWhyLimitedBullets, setPnpWhyLimitedBullets] = useState<string[]>([])
  const [pnpHowToImproveBullets, setPnpHowToImproveBullets] = useState<string[]>([])
  const [provinceShortlist, setProvinceShortlist] = useState<ProvinceRecommendation[]>([])
  const [pnpDocumentRoadmap, setPnpDocumentRoadmap] = useState<PathwayCard["documentRoadmap"]>()
  const [pnpProvinceRouterPrimaryCTA, setPnpProvinceRouterPrimaryCTA] = useState("Refine BC Options")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const data = loadAssessment()
    if (!data) {
      setIsLoaded(true)
      return
    }

    setAssessment(data)
    setProvinceShortlist(loadProvinceFinderRecommendations().slice(0, 3))

    try {
      const computed = computeResults(data)
      const selectedPathway = computed.pathways.find((pathway) => pathway.id === slug)
      const pathwayConfidence = selectedPathway?.confidence
      setConfidence(formatConfidence(pathwayConfidence))
      if (slug === "pnp") {
        setPnpConfidenceLevel(selectedPathway?.confidenceLevel)
        setPnpWhyBullets(selectedPathway?.whyBullets ?? [])
        setPnpWhyLimitedBullets(selectedPathway?.whyLimitedBullets ?? [])
        setPnpHowToImproveBullets(selectedPathway?.howToImproveBullets ?? [])
        setPnpDocumentRoadmap(selectedPathway?.documentRoadmap)
        const routerDecision = getPNPProvinceRouterDecision({
          pnpInScope: isPNPInScope(data),
          pnpFitScore: typeof selectedPathway?.pnpScore === "number" ? selectedPathway.pnpScore : 0,
          pnpConfidence: selectedPathway?.confidenceLevel,
          missingItems: (selectedPathway?.openQuestions ?? []).map((item) => ({
            id: item.id,
            prompt: item.prompt,
          })),
        })
        setPnpProvinceRouterPrimaryCTA(routerDecision.primaryCTA)
      } else {
        setPnpConfidenceLevel(undefined)
        setPnpWhyBullets([])
        setPnpWhyLimitedBullets([])
        setPnpHowToImproveBullets([])
        setPnpDocumentRoadmap(undefined)
        setPnpProvinceRouterPrimaryCTA("Refine BC Options")
      }
    } catch {
      setConfidence("High")
      setPnpConfidenceLevel(undefined)
      setPnpWhyBullets([])
      setPnpWhyLimitedBullets([])
      setPnpHowToImproveBullets([])
      setPnpDocumentRoadmap(undefined)
      setPnpProvinceRouterPrimaryCTA("Refine BC Options")
    } finally {
      setIsLoaded(true)
    }
  }, [slug])

  const isPnp = slug === "pnp"
  const isExpressEntry = slug === "express-entry"

  const pnpBrief = useMemo(() => {
    if (!assessment || !isPnp) return null
    const baseBrief = buildPnpBrief(assessment)
    return pnpWhyBullets.length > 0
      ? {
          ...baseBrief,
          whyBullets: pnpWhyBullets,
        }
      : baseBrief
  }, [assessment, isPnp, pnpWhyBullets])

  const expressEntryBrief = useMemo(() => {
    if (!assessment || !isExpressEntry) return null
    return buildExpressEntryBrief(assessment)
  }, [assessment, isExpressEntry])

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPnp && !isExpressEntry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This pathway detail page is not available.</p>
            <Button asChild className="mt-4">
              <Link href="/assessment/results">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExpressEntry) {
    if (!assessment || !expressEntryBrief) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>No assessment found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Start your assessment to view pathway details.</p>
              <Button asChild className="mt-4">
                <Link href="/assessment">Start assessment</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <PathwayBriefLayout
        title="Express Entry"
        description="Canada's federal system for selecting skilled immigrants, including programs like FSW, CEC, and FST. You create a profile and may receive an invitation to apply based on your points and eligibility."
        confidence={confidence}
        brief={expressEntryBrief}
        onBack={() => router.push("/assessment/results")}
        openQuestionsHref="/assessment"
        refinePlanLabel="Refine my Express Entry plan"
        pathwaySpecificSection={
          <Card>
            <CardHeader>
              <CardTitle className="text-base">6) CRS signals & levers (high-level, not guaranteeing outcomes)</CardTitle>
              <p className="text-sm text-muted-foreground">{expressEntryBrief.crsSignalsIntro}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <SectionList items={expressEntryBrief.crsSignals} />
              <p className="text-xs text-muted-foreground">{expressEntryBrief.crsSignalsNote}</p>
            </CardContent>
          </Card>
        }
      />
    )
  }

  if (!assessment || !pnpBrief) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No assessment found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Start your assessment to view pathway details.</p>
            <Button asChild className="mt-4">
              <Link href="/assessment">Start assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PathwayBriefLayout
      title="Provincial Nominee Program (PNP)"
      description="A set of province-specific immigration programs that can nominate candidates for Permanent Residence based on local labour needs and connections to a province."
      confidence={confidence}
      brief={pnpBrief}
      documentRoadmap={pnpDocumentRoadmap}
      lowConfidenceMessaging={
        pnpConfidenceLevel === "low"
          ? {
              whyLimitedBullets: pnpWhyLimitedBullets,
              howToImproveBullets: pnpHowToImproveBullets,
            }
          : undefined
      }
      onBack={() => router.push("/assessment/results")}
      openQuestionsHref="/assessment"
      refinePlanLabel="Refine my PNP plan"
      nextActionsPrimary={
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => {
              if (!assessment) return
              const computed = computeResults(assessment)
              const selectedPathway = computed.pathways.find((pathway) => pathway.id === "pnp")
              const routerDecision = getPNPProvinceRouterDecision({
                pnpInScope: isPNPInScope(assessment),
                pnpFitScore: typeof selectedPathway?.pnpScore === "number" ? selectedPathway.pnpScore : 0,
                pnpConfidence: selectedPathway?.confidenceLevel,
                missingItems: (selectedPathway?.openQuestions ?? []).map((item) => ({
                  id: item.id,
                  prompt: item.prompt,
                })),
              })
              savePNPProvinceFinderEntryContext(routerDecision)
              router.push(BC_REFINEMENT_PATH)
            }}
          >
            {pnpProvinceRouterPrimaryCTA}
          </Button>
          <p className="text-xs text-muted-foreground">
            Answer a few questions to shortlist provinces to explore for PNP.
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-5 w-fit px-0 text-[11px] text-muted-foreground"
            onClick={() => {
              const bcRecommendation = recommendationForProvince(
                demoProvinceFinderAnswers,
                PNP_MVP_DEFAULT_PROVINCE,
              )
              const demoRecommendations = bcRecommendation ? [bcRecommendation] : []
              savePNPProvinceFinderAnswers(demoProvinceFinderAnswers)
              saveProvinceFinderRecommendations(demoRecommendations, demoProvinceFinderAnswers, {
                provinceCode: PNP_MVP_DEFAULT_PROVINCE,
                mvpProvinceNotice: false,
                requestedProvinceCode: "BC",
                requestedProvinceInput: "British Columbia",
              })
              setProvinceShortlist(demoRecommendations.slice(0, 3))
              router.push("/assessment/results/pathways/pnp/province-finder/results")
            }}
          >
            Use demo answers
          </Button>
          {provinceShortlist.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">
                Province shortlist saved: {formatProvinceShortlistSummary(provinceShortlist)}
              </Badge>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/assessment/results/pathways/pnp/province-finder/results">
                  View province shortlist
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      }
      pathwaySpecificSection={
        <Card>
          <CardHeader>
            <CardTitle className="text-base">6) Costs (high-level buckets)</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionList items={pnpBrief.costBuckets} />
          </CardContent>
        </Card>
      }
    />
  )
}
