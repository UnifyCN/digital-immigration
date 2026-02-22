"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatAnswer, reviewSections } from "@/lib/review-answers"
import type { AssessmentData } from "@/lib/types"

type ReviewAnswersProps = {
  assessment: AssessmentData
}

function KeyValueRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid gap-1 py-2 md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)] md:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={value === "Not provided" ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>
        {value}
      </span>
    </div>
  )
}

function WorkRolesList({ assessment }: { assessment: AssessmentData }) {
  const roles = assessment.jobs ?? []
  if (!roles.length) return <KeyValueRow label="Quick-add previous roles" value="None" />

  return (
    <div className="py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Quick-add previous roles
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
        {roles.map((role, index) => {
          const parts = [formatAnswer(role.title), formatAnswer(role.country), formatAnswer(role.yearsRange)]
            .filter((part) => part !== "Not provided")
          const description = parts.length ? parts.join(" • ") : "Not provided"
          return <li key={`${role.title}-${role.country}-${index}`}>Role #{index + 1}: {description}</li>
        })}
      </ul>
    </div>
  )
}

function AdditionalCredentialsList({ assessment }: { assessment: AssessmentData }) {
  const credentials = assessment.additionalCredentials ?? []
  if (!credentials.length) return <KeyValueRow label="Additional credentials" value="None" />

  return (
    <div className="py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Additional credentials
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
        {credentials.map((credential, index) => {
          const parts = [
            formatAnswer(credential.educationLevel),
            formatAnswer(credential.country),
            formatAnswer(credential.graduationYear),
            formatAnswer(credential.programLength),
          ].filter((part) => part !== "Not provided")
          const description = parts.length ? parts.join(" • ") : "Not provided"
          return <li key={`${credential.educationLevel}-${credential.country}-${index}`}>Credential #{index + 1}: {description}</li>
        })}
      </ul>
    </div>
  )
}

export function ReviewAnswers({ assessment }: ReviewAnswersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-foreground">Review your answers</CardTitle>
        <p className="text-sm text-muted-foreground">
          Confirm everything is accurate. You can edit any section.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="multiple" className="w-full">
          {reviewSections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
              <AccordionContent>
                <div className="mb-3 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/assessment?step=${section.editStep}`}>Edit</Link>
                  </Button>
                </div>
                <Separator />
                <div className="mt-2">
                  {section.fields.map((field) => (
                    <KeyValueRow
                      key={field.key}
                      label={field.label}
                      value={formatAnswer(assessment[field.key])}
                    />
                  ))}

                  {section.id === "work" && <WorkRolesList assessment={assessment} />}
                  {section.id === "education" && <AdditionalCredentialsList assessment={assessment} />}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
