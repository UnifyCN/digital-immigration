"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Compass, ChevronRight, ArrowRight } from "lucide-react"
import { saveSelectedPathway } from "@/lib/imm5669/storage"
import type { PathwayCard, ConfidenceLevel } from "@/lib/types"

const confidenceColors: Record<ConfidenceLevel, string> = {
  High: "bg-tier-clean/15 text-tier-clean border-tier-clean/30",
  Medium: "bg-tier-moderate/15 text-tier-moderate border-tier-moderate/30",
  Low: "bg-muted text-muted-foreground border-border",
}

const pathwayHref: Record<string, string> = {
  pnp: "/assessment/results/pathways/pnp",
  "express-entry": "/assessment/results/pathways/express-entry",
}

export function PathwayCards({ pathways }: { pathways: PathwayCard[] }) {
  const router = useRouter()

  function handleProceed(pathway: PathwayCard) {
    saveSelectedPathway({ pathwayId: pathway.id, pathwayName: pathway.name })
    router.push("/next-steps")
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Relevant Pathways
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Appears relevant based on your inputs. This is not advice or an eligibility determination.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {pathways.map((pathway) => {
          const href = pathwayHref[pathway.id]

          const cardBody = (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex items-start gap-2.5">
                  <Compass className="mt-0.5 size-4 shrink-0 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                    {pathway.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px] font-medium",
                    confidenceColors[pathway.confidence]
                  )}
                >
                  {pathway.confidence}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    Why it appears relevant
                  </p>
                  <ul className="flex flex-col gap-1">
                    {pathway.whyRelevant.map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                        <ChevronRight className="mt-0.5 size-3 shrink-0 text-primary" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                    {"What you'd need next"}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {pathway.whatNext.map((next, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                        {next}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 w-full gap-1.5"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleProceed(pathway)
                  }}
                >
                  Proceed to Next Steps
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardContent>
            </>
          )

          const card = (
            <Card
              className={cn(
                "transition-shadow",
                href ? "cursor-pointer hover:shadow-md" : "",
              )}
            >
              {cardBody}
            </Card>
          )

          if (!href) {
            return <div key={pathway.id}>{card}</div>
          }

          return (
            <Link
              key={pathway.id}
              href={href}
              aria-label={`View ${pathway.name} details`}
              className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
