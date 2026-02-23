"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Pencil, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { imm5669FullSchema } from "@/lib/imm5669/schemas"
import { BACKGROUND_QUESTION_LABELS } from "@/lib/imm5669/types"
import { saveImm5669Status, loadImm5669Status } from "@/lib/imm5669/storage"
import type { Imm5669Data, BackgroundQuestions } from "@/lib/imm5669/types"

interface SectionReviewProps {
  data: Imm5669Data
  onEdit: (sectionIndex: number) => void
  onUpdateDeclarationDate?: (date: string) => void
}

export function SectionReview({ data, onEdit, onUpdateDeclarationDate }: SectionReviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfGenerated, setPdfGenerated] = useState(() => {
    if (typeof window === "undefined") return false
    return loadImm5669Status() === "generated"
  })
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState("")
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [pdfBlobUrl])
  const [declDate, setDeclDate] = useState(
    data.declarationDate || new Date().toISOString().slice(0, 10),
  )

  const dataWithDate = { ...data, declarationDate: declDate }

  const handleDateChange = useCallback((value: string) => {
    setDeclDate(value)
    onUpdateDeclarationDate?.(value)
  }, [onUpdateDeclarationDate])

  const validation = imm5669FullSchema.safeParse(dataWithDate)
  const issues = !validation.success
    ? validation.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }))
    : []

  const isValid = validation.success

  async function handleGenerate() {
    if (!isValid) return
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/documents/imm5669/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataWithDate),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error (${res.status})`)
      }

      const blob = await res.blob()
      const lastName = data.familyName || "Applicant"
      const date = new Date().toISOString().slice(0, 10)
      const filename = `IMM5669_Filled_${lastName}_${date}.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setPdfBlobUrl(url)
      setPdfFilename(filename)
      saveImm5669Status("generated")
      setPdfGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleRedownload() {
    if (!pdfBlobUrl) return
    const a = document.createElement("a")
    a.href = pdfBlobUrl
    a.download = pdfFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Review & Generate PDF
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Review your answers below. Click a section to edit. When ready, generate
          the filled IMM 5669 PDF for download.
        </p>
      </div>

      {!isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            <p className="mb-2 text-xs font-medium">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} found. Fix them before generating the PDF.
            </p>
            <ul className="flex flex-col gap-1">
              {issues.slice(0, 8).map((issue, i) => (
                <li key={i} className="text-xs">
                  <span className="font-mono text-[10px] text-destructive/70">{issue.path}</span>
                  {" — "}{issue.message}
                </li>
              ))}
              {issues.length > 8 && (
                <li className="text-xs text-destructive/70">
                  ...and {issues.length - 8} more
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert className="border-tier-clean/30 bg-tier-clean/5">
          <CheckCircle2 className="size-4 text-tier-clean" />
          <AlertDescription className="text-xs text-tier-clean">
            All required fields are complete. Ready to generate PDF.
          </AlertDescription>
        </Alert>
      )}

      {/* Section summaries */}
      <div className="flex flex-col gap-3">
        <ReviewCard title="Applicant Information" onEdit={() => onEdit(0)}>
          <Row label="Type" value={data.applicantType === "principal" ? "Principal Applicant" : "Spouse/Dependent"} />
          <Row label="Name" value={`${data.familyName}, ${data.givenNames}`} />
          {data.nativeScriptName && <Row label="Native script" value={data.nativeScriptName} />}
          <Row label="Date of birth" value={data.dateOfBirth} />
        </ReviewCard>

        <ReviewCard title="Parent Details" onEdit={() => onEdit(1)}>
          <Row label="Father" value={`${data.father.familyName} ${data.father.givenNames}`.trim() || "Not provided"} />
          <Row label="Mother" value={`${data.mother.familyName} ${data.mother.givenNames}`.trim() || "Not provided"} />
        </ReviewCard>

        <ReviewCard title="Background Questions" onEdit={() => onEdit(2)}>
          <BackgroundSummary questions={data.backgroundQuestions} />
          {data.backgroundDetails && (
            <Row label="Details" value={data.backgroundDetails.substring(0, 100) + (data.backgroundDetails.length > 100 ? "..." : "")} />
          )}
        </ReviewCard>

        <ReviewCard title="Education" onEdit={() => onEdit(3)}>
          <Row label="Education entries" value={String(data.educationHistory.length)} />
          {data.educationHistory.slice(0, 3).map((e, i) => (
            <Row key={i} label={`${e.from} — ${e.to}`} value={`${e.institutionName}, ${e.cityAndCountry}`} />
          ))}
        </ReviewCard>

        <ReviewCard title="Personal History" onEdit={() => onEdit(4)}>
          <Row label="Entries" value={String(data.personalHistory.length)} />
          {data.personalHistory.slice(0, 3).map((p, i) => (
            <Row key={i} label={`${p.from} — ${p.to}`} value={`${p.activity}, ${p.cityAndCountry}`} />
          ))}
        </ReviewCard>

        <ReviewCard title="Memberships & Government" onEdit={() => onEdit(5)}>
          <Row label="Memberships" value={data.memberships.length === 0 ? "None" : String(data.memberships.length)} />
          <Row label="Government positions" value={data.governmentPositions.length === 0 ? "None" : String(data.governmentPositions.length)} />
        </ReviewCard>

        <ReviewCard title="Military & Addresses" onEdit={() => onEdit(6)}>
          <Row label="Military entries" value={data.militaryService.length === 0 ? "None" : String(data.militaryService.length)} />
          <Row label="Addresses" value={String(data.addresses.length)} />
          {data.addresses.slice(0, 2).map((a, i) => (
            <Row key={i} label={`${a.from} — ${a.to}`} value={`${a.streetAndNumber}, ${a.cityOrTown}, ${a.country}`} />
          ))}
        </ReviewCard>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Label htmlFor="declarationDate" className="text-sm font-semibold">
            Declaration Date
          </Label>
          <p className="text-xs text-muted-foreground">
            Format: YYYY-MM-DD. This is the date you will sign the declaration.
          </p>
          <Input
            id="declarationDate"
            value={declDate}
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder="2026-02-21"
            className="max-w-[200px]"
          />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {pdfGenerated ? (
        <Card className="border-tier-clean/30 bg-tier-clean/5">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-tier-clean shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Your IMM 5669 has been generated successfully
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The PDF has been downloaded to your device. You can download it again or view next steps for uploading.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {pdfBlobUrl && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRedownload}
                >
                  <Download className="size-4" />
                  Download PDF
                </Button>
              )}
              <Button
                className="gap-2"
                onClick={() => router.push("/documents/imm5669/next-steps")}
              >
                View Next Steps
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!isValid || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="size-4" />
              Generate PDF
            </>
          )}
        </Button>
      )}

      <p className="type-caption text-center text-muted-foreground">
        The generated PDF is for your records only. You may still need to sign it
        where indicated before submitting. This tool is informational — not legal advice.
      </p>
    </div>
  )
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Pencil className="size-3" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">{children}</CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  const missing = !value || value === "Not provided"
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${missing ? "text-destructive italic" : "text-foreground"}`}>
        {missing ? "Missing" : value}
      </span>
    </div>
  )
}

function BackgroundSummary({ questions }: { questions: BackgroundQuestions }) {
  const keys = Object.keys(questions) as (keyof BackgroundQuestions)[]
  const yesKeys = keys.filter((k) => questions[k] === "yes")

  if (yesKeys.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-tier-clean">
        <Badge variant="outline" className="bg-tier-clean/15 text-tier-clean border-tier-clean/30 text-[10px]">
          All No
        </Badge>
        <span>No background concerns disclosed</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {yesKeys.map((k) => (
        <div key={k} className="flex items-start gap-1.5 text-xs text-tier-moderate">
          <Badge variant="outline" className="bg-tier-moderate/15 text-tier-moderate border-tier-moderate/30 text-[10px] shrink-0">
            Yes
          </Badge>
          <span className="text-foreground">
            {k.toUpperCase()}) {BACKGROUND_QUESTION_LABELS[k].substring(0, 80)}...
          </span>
        </div>
      ))}
    </div>
  )
}
