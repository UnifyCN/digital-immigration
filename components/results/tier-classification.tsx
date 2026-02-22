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

export function TierClassification({ tier }: { tier: TierResult }) {
  const config = tierConfig[tier.level]
  const Icon = config.icon
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
            aria-label="Open application preparation overview"
          >
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
                <li key={i} className="flex items-start gap-2 text-sm">
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
              Preparation Level: Additional Preparation Recommended
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-5 text-sm leading-6 text-foreground">
              <p>
                Based on your answers, some parts of your profile may require
                clearer documentation or explanation during the application
                process.
              </p>
              <p>
                This does not determine eligibility. It reflects the level of
                preparation typically needed to submit a strong and consistent
                application.
              </p>

              <Separator />

              <section className="space-y-2">
                <h3 className="font-semibold">What we identified</h3>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Prior refusal on record
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        Applications often require consistent explanations
                        across all forms.
                      </li>
                      <li>
                        Supporting documentation and clarity are important to
                        avoid inconsistencies.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Employment gaps in the last 10 years
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        Immigration applications require a continuous personal
                        history timeline.
                      </li>
                      <li>
                        Gaps may need explanation letters or documented
                        activity (study, travel, unemployment, etc.).
                      </li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">What this means for you</h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    You may need more detailed documentation in certain areas.
                  </li>
                  <li>
                    Your personal history should be reviewed carefully for
                    consistency.
                  </li>
                  <li>
                    Clear explanations can significantly reduce confusion or
                    processing delays.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  How to strengthen your preparation
                </h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Ensure work history includes complete dates, duties, hours,
                    and proof of payment.
                  </li>
                  <li>Prepare a brief explanation for any employment gaps.</li>
                  <li>
                    Keep explanations consistent across all forms and documents.
                  </li>
                  <li>
                    Review prior refusal reasons (if applicable) and ensure
                    concerns are addressed clearly.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  When professional review may be helpful
                </h3>
                <p>Consider additional support if:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    The prior refusal involved misrepresentation or unclear
                    documentation.
                  </li>
                  <li>
                    There are overlapping timelines or gaps that are difficult
                    to document.
                  </li>
                  <li>
                    You are unsure how to explain inconsistencies in your
                    history.
                  </li>
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
