"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import type { TierResult } from "@/lib/types"

const tierConfig = {
  1: {
    icon: ShieldCheck,
    colorClass: "bg-tier-clean/10 text-tier-clean border-tier-clean/30",
    badgeClass: "bg-tier-clean text-background",
  },
  2: {
    icon: Shield,
    colorClass: "bg-tier-moderate/10 text-tier-moderate border-tier-moderate/30",
    badgeClass: "bg-tier-moderate text-background",
  },
  3: {
    icon: ShieldAlert,
    colorClass: "bg-tier-complex/10 text-tier-complex border-tier-complex/30",
    badgeClass: "bg-tier-complex text-background",
  },
}

const tierPreparationLabel: Record<1 | 2 | 3, string> = {
  1: "Low Complexity",
  2: "Additional Preparation Recommended",
  3: "High Complexity",
}

const tierOverview: Record<
  1 | 2 | 3,
  {
    intro: string[]
    meaning: string[]
    strengthen: string[]
    review: string[]
  }
> = {
  1: {
    intro: [
      "Based on your answers, your profile appears straightforward with no major complexities detected.",
      "This does not determine eligibility. It reflects the level of preparation typically needed to submit a strong and consistent application.",
    ],
    meaning: [
      "Standard documentation may be enough in most areas.",
      "Consistency across forms and supporting documents is still important.",
      "A final quality check can help avoid delays.",
    ],
    strengthen: [
      "Keep personal history and work/education timelines complete and consistent.",
      "Ensure key documents are valid and up to date.",
      "Review all answers before submission for clarity and accuracy.",
    ],
    review: [
      "You are applying under a category with strict documentation requirements.",
      "Your situation changed recently and affects your application details.",
      "You want an additional confidence check before submission.",
    ],
  },
  2: {
    intro: [
      "Based on your answers, some parts of your profile may require clearer documentation or explanation during the application process.",
      "This does not determine eligibility. It reflects the level of preparation typically needed to submit a strong and consistent application.",
    ],
    meaning: [
      "You may need more detailed documentation in certain areas.",
      "Your personal history should be reviewed carefully for consistency.",
      "Clear explanations can significantly reduce confusion or processing delays.",
    ],
    strengthen: [
      "Ensure work and personal history include complete timelines and supporting records.",
      "Prepare concise explanations for any complex or unclear parts of your profile.",
      "Keep explanations consistent across all forms and documents.",
    ],
    review: [
      "There are timeline gaps or overlaps that are difficult to document.",
      "You are unsure how to present prior decisions or concerns consistently.",
      "You need help organizing evidence to match your written explanations.",
    ],
  },
  3: {
    intro: [
      "Based on your answers, your profile includes multiple complexity signals that usually require a higher standard of preparation.",
      "This does not determine eligibility. It reflects the level of preparation typically needed to submit a strong and consistent application.",
    ],
    meaning: [
      "You may need substantial supporting evidence and clear written explanations.",
      "Any inconsistency across forms or records can create additional risk.",
      "Early planning and structured documentation are strongly recommended.",
    ],
    strengthen: [
      "Build a complete timeline with supporting evidence for each major event.",
      "Draft clear, consistent explanations for all high-risk areas.",
      "Cross-check all documents and forms for conflicts before submission.",
    ],
    review: [
      "There are multiple high-risk factors that interact with each other.",
      "You are unsure how to document sensitive or adverse history.",
      "You want a professional strategy before filing an application.",
    ],
  },
}

export function TierClassification({ tier }: { tier: TierResult }) {
  const config = tierConfig[tier.level]
  const Icon = config.icon
  const overview = tierOverview[tier.level]
  const dialogHintId = `tier-dialog-hint-${tier.level}`
  const tierTitle =
    tier.level === 2
      ? "Additional Preparation Recommended"
      : `Tier ${tier.level}: ${tier.label}`

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Tier Classification
      </h2>

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full rounded-lg border p-5 text-left transition-all",
              "cursor-pointer hover:ring-1 hover:ring-current/35",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "active:scale-[0.995]",
              config.colorClass,
            )}
            aria-describedby={dialogHintId}
          >
            <span id={dialogHintId} className="sr-only">
              Open application preparation overview
            </span>
            <div className="flex items-center gap-3">
              <div className={cn("flex size-10 items-center justify-center rounded-full", config.badgeClass)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {tierTitle}
                </p>
                <p className="text-xs opacity-80">
                  {tier.level === 1 && "No major complexities detected"}
                  {tier.level === 2 && "Some elements need attention"}
                  {tier.level === 3 && "Professional guidance recommended"}
                </p>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-1.5">
              {tier.reasons.map((reason, i) => (
                <li key={`${reason}-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                  {reason}
                </li>
              ))}
            </ul>
          </button>
        </DialogTrigger>

        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Preparation Overview</DialogTitle>
            <DialogDescription>
              Preparation Level: {tierPreparationLabel[tier.level]}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-5 text-sm leading-6 text-foreground">
              {overview.intro.map((text) => (
                <p key={text}>{text}</p>
              ))}

              <Separator />

              <section className="space-y-2">
                <h3 className="font-semibold">What we identified</h3>
                <ul className="list-disc space-y-2 pl-5">
                  {tier.reasons.map((reason, i) => (
                    <li key={`${reason}-${i}`}>{reason}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">What this means for you</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {overview.meaning.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  How to strengthen your preparation
                </h3>
                <ul className="list-disc space-y-1 pl-5">
                  {overview.strengthen.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  When professional review may be helpful
                </h3>
                <p>Consider additional support if:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {overview.review.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
