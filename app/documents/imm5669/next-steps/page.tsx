"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Upload,
  Clock,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react"

const IRCC_ACCOUNT_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html"

export default function Imm5669NextStepsPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => router.push("/documents/imm5669")}
        className="mb-4 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to IMM 5669
      </Button>

      <div className="mb-8">
        <h1 className="font-heading text-foreground">
          What to Do After IMM 5669
        </h1>
        <p className="mt-2 type-body text-muted-foreground">
          Your IMM 5669 (Schedule A) has been generated. Here is what to do next
          as a Provincial Nominee Program (PNP) applicant applying for permanent
          residence.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Where to Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Where to Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              IMM 5669 is uploaded through your IRCC online account — either the
              PR Portal or your GCKey account, depending on how you are applying.
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Submitting a complete PR application after nomination:
                </span>{" "}
                IMM 5669 is included as part of the required forms you upload
                during the online permanent residence application process.
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Responding to a document request from IRCC:
                </span>{" "}
                Upload IMM 5669 in the &ldquo;Additional Documents&rdquo;
                section of your IRCC online account under the specific request
                slot.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* When to Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                When to Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground leading-relaxed">
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Full PR application:
                </span>{" "}
                Upload immediately as part of your application package.
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  IRCC document request:
                </span>{" "}
                Upload before the deadline stated in the request. Check your IRCC
                account for the exact date.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Before You Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Before You Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                Confirm there are no time gaps in your personal history — every
                month should be accounted for.
              </li>
              <li className="list-disc">
                Ensure all sections of the form are complete and accurate.
              </li>
              <li className="list-disc">
                Verify signatures where required (the declaration section may
                need to be signed after printing).
              </li>
              <li className="list-disc">
                Confirm the correct applicant type is selected (Principal
                Applicant vs. Spouse/Dependent).
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="gap-2" asChild>
          <a href={IRCC_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
            Go to IRCC Account
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/next-steps")}
        >
          Back to Dashboard
        </Button>
      </div>

      <p className="type-caption mt-8 text-center text-muted-foreground">
        This is informational guidance, not legal advice. For case-specific
        guidance, consult a licensed immigration professional.
      </p>
    </div>
  )
}
