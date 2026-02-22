"use client"

import { useMemo, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadBlob, getTimestampForFilename } from "@/lib/export-utils"
import { generateResultsPdf } from "@/lib/pdf-export"
import type { AssessmentData, AssessmentResults } from "@/lib/types"

type ExportResultsProps = {
  assessment: AssessmentData | null
  results: AssessmentResults | null
}

type ExportMode = "pdf" | "json" | null

export function ExportResults({ assessment, results }: ExportResultsProps) {
  const [mode, setMode] = useState<ExportMode>(null)
  const canExport = useMemo(() => !!assessment && !!results, [assessment, results])

  async function handleDownloadPdf() {
    if (!assessment || !results) return
    setMode("pdf")
    try {
      const blob = generateResultsPdf(assessment, results)
      const filename = `clarity-assessment-${getTimestampForFilename()}.pdf`
      downloadBlob(blob, filename)
    } finally {
      setMode(null)
    }
  }

  async function handleDownloadJson() {
    if (!assessment || !results) return
    setMode("json")
    try {
      const payload = {
        generatedAt: new Date().toISOString(),
        assessment,
        results,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      const filename = `clarity-assessment-${getTimestampForFilename()}.json`
      downloadBlob(blob, filename)
    } finally {
      setMode(null)
    }
  }

  const isBusy = mode !== null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">Export</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadPdf} disabled={!canExport || isBusy} className="gap-2">
            {mode === "pdf" && <LoaderCircle className="size-4 animate-spin" />}
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadJson}
            disabled={!canExport || isBusy}
            className="gap-2"
          >
            {mode === "json" && <LoaderCircle className="size-4 animate-spin" />}
            Download JSON
          </Button>
        </div>

        {!canExport && (
          <p className="mt-3 text-sm text-muted-foreground">
            Complete an assessment first.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
