"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { topProvinceRecommendations } from "@/lib/pathways/provinceFinder"
import {
  loadProvinceFinderDraft,
  loadProvinceFinderRecommendations,
  saveProvinceFinderRecommendations,
} from "@/lib/pathways/provinceFinderStorage"
import { isCompleteProvinceFinderAnswers } from "@/lib/pathways/provinceFinder"

const PNP_OVERVIEW_PATH = "/assessment/results/pathways/pnp"
const FINDER_PATH = "/assessment/results/pathways/pnp/province-finder"

function labelVariant(label: "Strong alignment" | "Moderate alignment" | "Exploratory") {
  if (label === "Strong alignment") return "default"
  if (label === "Moderate alignment") return "secondary"
  return "outline"
}

export function ProvinceFinderResults() {
  const [draft] = useState(() => loadProvinceFinderDraft())
  const [recommendations, setRecommendations] = useState(() =>
    loadProvinceFinderRecommendations().slice(0, 3),
  )

  useEffect(() => {
    if (!isCompleteProvinceFinderAnswers(draft)) return
    if (recommendations.length > 0) return
    const computed = topProvinceRecommendations(draft, 3)
    setRecommendations(computed)
    saveProvinceFinderRecommendations(computed, draft)
  }, [draft, recommendations.length])

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
          <p className="text-sm text-muted-foreground">
            These provinces appear aligned based on your answers and are worth exploring next.
          </p>
          <p className="text-xs text-muted-foreground">
            Not legal advice. Stream criteria change. Confirm official requirements.
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.provinceCode}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{recommendation.provinceName}</CardTitle>
                <Badge variant={labelVariant(recommendation.alignmentLabel)}>
                  {recommendation.alignmentLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Alignment: {recommendation.alignmentScore}%
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="why">
                  <AccordionTrigger>Why this aligns</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                      {recommendation.whyBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="confirm">
                  <AccordionTrigger>What to confirm next</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                      {recommendation.whatToConfirmNext.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                {recommendation.riskFlags.length > 0 ? (
                  <AccordionItem value="risk">
                    <AccordionTrigger>Risk flags</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                        {recommendation.riskFlags.map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
              </Accordion>
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
