"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Compass, ChevronRight } from "lucide-react"
import type { PathwayCard, ConfidenceLevel } from "@/lib/types"

const confidenceColors: Record<ConfidenceLevel, string> = {
  High: "bg-tier-clean/15 text-tier-clean border-tier-clean/30",
  Medium: "bg-tier-moderate/15 text-tier-moderate border-tier-moderate/30",
  Low: "bg-muted text-muted-foreground border-border",
}

export function PathwayCards({ pathways }: { pathways: PathwayCard[] }) {
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
        {pathways.map((pathway) => (
          <Card key={pathway.id} className="transition-shadow hover:shadow-md">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
