"use client"

import { ArrowRight } from "lucide-react"

export function NextActions({ actions }: { actions: string[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Recommended Next Steps
      </h2>

      <div className="flex flex-col gap-2">
        {actions.map((action, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ArrowRight className="size-3" />
            </div>
            <p className="text-sm leading-relaxed text-foreground">{action}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
