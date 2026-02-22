"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, Info, MessageCircle } from "lucide-react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { getRiskContent } from "@/lib/risk-content"
import type { RiskFlag, Severity } from "@/lib/types"

const severityConfig: Record<Severity, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "bg-tier-moderate/15 text-tier-moderate",
  },
  high: {
    label: "High",
    className: "bg-tier-complex/15 text-tier-complex",
  },
}

interface RiskFlagsPanelProps {
  flags: RiskFlag[]
  onAskAI?: (riskId: string, openerQuestion: string) => void
}

export function RiskFlagsPanel({ flags, onAskAI }: RiskFlagsPanelProps) {
  if (flags.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Early Risk Flags
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-tier-clean/5 p-4">
          <Info className="size-4 shrink-0 text-tier-clean" />
          <p className="text-sm text-foreground">
            No significant risk flags detected based on your inputs.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Early Risk Flags
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Click any risk flag to see details and recommended next steps.
        </p>
      </div>

      <Accordion type="single" collapsible className="flex flex-col gap-2">
        {flags.map((flag) => {
          const config = severityConfig[flag.severity]
          const content = getRiskContent(flag.id)
          return (
            <AccordionItem
              key={flag.id}
              value={flag.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <AccordionTrigger className="px-4 py-4 hover:bg-muted/50 hover:no-underline">
                <div className="flex flex-1 items-start gap-3">
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      flag.severity === "high"
                        ? "text-tier-complex"
                        : flag.severity === "medium"
                          ? "text-tier-moderate"
                          : "text-muted-foreground"
                    )}
                  />
                  <div className="flex flex-1 flex-col gap-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {flag.label}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          config.className
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{flag.action}</p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="ml-7 flex flex-col gap-4">
                  {/* What this means */}
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      What this means
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">
                      {content.whatThisMeans}
                    </p>
                  </div>

                  {/* Why it matters */}
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Why it matters
                    </h4>
                    <ul className="space-y-1">
                      {content.whyItMatters.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What to do next */}
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      What to do next
                    </h4>
                    <ul className="space-y-1.5">
                      {content.whatToDoNext.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border border-border" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ask AI button */}
                  {onAskAI && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 w-fit gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAskAI(flag.id, content.aiOpenerQuestion)
                      }}
                    >
                      <MessageCircle className="size-3.5" />
                      Ask AI about this risk
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
