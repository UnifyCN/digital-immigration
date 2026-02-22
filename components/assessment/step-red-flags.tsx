"use client"

import { useFormContext } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ShieldAlert } from "lucide-react"
import type { AssessmentData } from "@/lib/types"

const flagFields: {
  name: keyof AssessmentData
  label: string
  helperText?: string
  options?: { value: string; label: string }[]
}[] = [
  { name: "priorRefusals", label: "Prior visa or application refusals" },
  { name: "criminalCharges", label: "Criminal charges or convictions" },
  { name: "medicalIssues", label: "Medical issues affecting admissibility" },
  { name: "misrepresentation", label: "Misrepresentation concerns" },
  {
    name: "statusExpiringSoon",
    label: "Current status expiring within the next 3 months",
    helperText: "Not applicable if you are a citizen/PR or outside Canada with no status.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "na", label: "Not applicable" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    name: "overstayHistory",
    label: "Ever overstayed or been out of status (in Canada or another country)",
  },
  {
    name: "removalOrDeportationHistory",
    label: "Ever been refused entry, removed, or deported from any country",
  },
  {
    name: "hasActiveApplication",
    label: "Do you currently have an immigration application in process?",
  },
  { name: "multipleCountries", label: "Lived in multiple countries in last 10 years" },
  { name: "nonTraditionalEmployment", label: "Non-traditional or informal employment" },
  { name: "missingDocuments", label: "Missing documents or difficulty obtaining them" },
  {
    name: "employerLetterUnwilling",
    label: "Employer unwilling to provide a detailed reference letter",
  },
]

function YesNoUnsureField({
  name,
  label,
  helperText,
  options,
}: {
  name: string
  label: string
  helperText?: string
  options?: { value: string; label: string }[]
}) {
  const { control } = useFormContext<AssessmentData>()

  return (
    <FormField
      control={control}
      name={name as keyof AssessmentData}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <FormLabel className="text-sm font-normal text-foreground leading-snug">
              {label}
            </FormLabel>
            {helperText && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value as string}
              className="flex shrink-0 gap-2"
            >
              {(options ?? [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Unsure" },
              ]).map((o) => (
                <Label
                  key={o.value}
                  htmlFor={`${name}-${o.value}`}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                >
                  <RadioGroupItem value={o.value} id={`${name}-${o.value}`} className="size-3" />
                  <span className="text-foreground">{o.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function StepRedFlags() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Red Flags & Complexity Signals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Some situations may require a licensed professional. Answering helps
          us guide you safely.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          These questions help identify if your case has complexity that may
          need professional guidance. Answering honestly protects you.
          {"\"Unsure\""} is always an option.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {flagFields.map((f) => (
          <YesNoUnsureField
            key={f.name}
            name={f.name}
            label={f.label}
            helperText={f.helperText}
            options={f.options}
          />
        ))}
      </div>
    </div>
  )
}
