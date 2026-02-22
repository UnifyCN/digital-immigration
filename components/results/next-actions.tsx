"use client"

import { CheckSquare, Info, MessageCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NextStep, NextStepAiAssistContext, AssessmentResults } from "@/lib/types"

const priorityConfig = {
  high: {
    label: "High",
    className: "bg-tier-complex/15 text-tier-complex",
  },
  medium: {
    label: "Medium",
    className: "bg-tier-moderate/15 text-tier-moderate",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
}

interface NextActionsProps {
  steps: NextStep[]
  onAskAI?: (context: NextStepAiAssistContext) => void
  aiContextResults: Pick<AssessmentResults, "tier" | "pathways" | "riskFlags" | "nextSteps">
}

export function NextActions({ steps, onAskAI, aiContextResults }: NextActionsProps) {
  if (steps.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Recommended Next Steps
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-tier-clean/5 p-4">
          <Info className="size-4 shrink-0 text-tier-clean" />
          <p className="text-sm text-foreground">
            No next steps are recommended yet based on the current profile signals.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Recommended Next Steps
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Expand each step for personalized guidance based on your profile and current flags.
        </p>
      </div>

      <Accordion type="single" collapsible className="flex flex-col gap-2">
        {steps.map((step) => {
          const priority = priorityConfig[step.priority]
          const userProfileSummary: Record<string, string | string[]> = {}
          for (const input of step.evidence.inputs) {
            const [key, rawValue] = input.split("=", 2)
            if (key && rawValue) {
              userProfileSummary[key] = rawValue
            }
          }

          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="overflow-hidden rounded-lg border border-border bg-card last:border-b last:border-border shadow-[var(--shadow-soft)]"
            >
              <AccordionTrigger className="px-4 py-4 hover:bg-muted/50 hover:no-underline">
                <div className="flex flex-1 items-start gap-3">
                  <CheckSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="flex flex-1 flex-col gap-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          priority.className
                        )}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.summary}</p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="ml-7 flex flex-col gap-4">
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      What this step is
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">
                      {step.whatThisStepIs}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Why it&apos;s recommended for you
                    </h4>
                    <ul className="space-y-1">
                      {step.whyRecommendedForYou.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      How to do it
                    </h4>
                    <ul className="space-y-1">
                      {step.howToDoIt.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                            {i + 1}
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.documentsNeeded.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Documents / info needed
                      </h4>
                      <ul className="space-y-1">
                        {step.documentsNeeded.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Common mistakes
                    </h4>
                    <ul className="space-y-1">
                      {step.commonMistakes.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.conditionalNotes && step.conditionalNotes.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        If this applies
                      </h4>
                      <ul className="space-y-1">
                        {step.conditionalNotes.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Checklist
                    </h4>
                    <ul className="space-y-1.5">
                      {step.checklist.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border border-border" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {onAskAI && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 w-fit gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAskAI({
                          type: "next_step_help",
                          nextStepId: step.id,
                          nextStepTitle: step.title,
                          priority: step.priority,
                          userProfileSummary,
                          triggeredBy: step.evidence,
                          currentRecommendationsShownOnScreen: {
                            tier: aiContextResults.tier,
                            pathways: aiContextResults.pathways,
                            risks: aiContextResults.riskFlags,
                            nextSteps: aiContextResults.nextSteps,
                          },
                        })
                      }}
                    >
                      <MessageCircle className="size-3.5" />
                      Ask AI about this next step
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
