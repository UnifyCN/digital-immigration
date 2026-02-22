"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, CheckCircle2, Circle } from "lucide-react"

export interface ChecklistItem {
  id: string
  title: string
  description: string
  href: string
  status: "not-started" | "in-progress" | "completed"
}

const statusConfig = {
  "not-started": {
    label: "Not started",
    badge: "bg-muted text-muted-foreground border-border",
    buttonLabel: "Start",
    Icon: Circle,
  },
  "in-progress": {
    label: "In progress",
    badge: "bg-tier-moderate/15 text-tier-moderate border-tier-moderate/30",
    buttonLabel: "Continue",
    Icon: Circle,
  },
  completed: {
    label: "Completed",
    badge: "bg-tier-clean/15 text-tier-clean border-tier-clean/30",
    buttonLabel: "View",
    Icon: CheckCircle2,
  },
} as const

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const config = statusConfig[item.status]
        return (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-medium ${config.badge}`}
                  >
                    {config.label}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="mt-3 gap-1.5"
                  variant={item.status === "completed" ? "outline" : "default"}
                  asChild
                >
                  <Link href={item.href}>
                    {config.buttonLabel}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
