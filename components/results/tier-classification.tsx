"use client"

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

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Tier Classification
      </h2>

      <div className={cn("rounded-lg border p-5", config.colorClass)}>
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-full", config.badgeClass)}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Tier {tier.level}: {tier.label}
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
      </div>
    </section>
  )
}
