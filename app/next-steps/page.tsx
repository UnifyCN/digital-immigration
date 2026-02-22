"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Checklist, type ChecklistItem } from "@/components/next-steps/checklist"
import { loadSelectedPathway, hasImm5669Draft, type SelectedPathway } from "@/lib/imm5669/storage"

export default function NextStepsPage() {
  const router = useRouter()
  const [pathway, setPathway] = useState<SelectedPathway | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = loadSelectedPathway()
    setPathway(saved)
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!pathway) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="font-heading text-foreground">No pathway selected</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Go back to your results and select a pathway to proceed.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/results">Back to results</Link>
          </Button>
        </div>
      </div>
    )
  }

  const hasDraft = hasImm5669Draft()

  const items: ChecklistItem[] = [
    {
      id: "imm5669",
      title: "Complete IMM 5669 (Schedule A — Background/Declaration)",
      description:
        "Fill out the official background and declaration form required for your application. " +
        "We will guide you through each section and generate a filled PDF for download.",
      href: "/documents/imm5669",
      status: hasDraft ? "in-progress" : "not-started",
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => router.push("/results")}
        className="mb-4 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to results
      </Button>

      <div className="mb-8">
        <h1 className="font-heading text-foreground">
          Next Steps: {pathway.pathwayName}
        </h1>
        <p className="mt-2 type-body text-muted-foreground">
          Complete the items below to prepare your application documents.
          This tool helps organize information — it is not legal advice.
        </p>
      </div>

      <Checklist items={items} />

      <p className="type-caption mt-8 text-center text-muted-foreground">
        This is informational only and does not constitute legal advice.
        For case-specific guidance, consult a licensed immigration professional.
      </p>
    </div>
  )
}
