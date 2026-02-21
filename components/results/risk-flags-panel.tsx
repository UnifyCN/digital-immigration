"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, Info } from "lucide-react"
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

export function RiskFlagsPanel({ flags }: { flags: RiskFlag[] }) {
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
          Risks to Review
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Items that may need attention before proceeding.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {flags.map((flag, i) => {
          const config = severityConfig[flag.severity]
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
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
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{flag.label}</p>
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
          )
        })}
      </div>
    </section>
  )
}
