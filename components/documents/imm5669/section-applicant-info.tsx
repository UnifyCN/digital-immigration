"use client"

import { useFormContext } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Imm5669Data } from "@/lib/imm5669/types"

export function SectionApplicantInfo() {
  const { control } = useFormContext<Imm5669Data>()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Applicant Information
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Identify yourself and provide your full legal name as it appears on your passport.
        </p>
      </div>

      <FormField
        control={control}
        name="applicantType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Are you...</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {[
                  { value: "principal", label: "The principal applicant" },
                  {
                    value: "spouse-dependent",
                    label: "The spouse, common-law partner, or dependent child (18+) of the principal applicant",
                  },
                ].map((option) => (
                  <Label
                    key={option.value}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <span className="text-sm">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="familyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family name (surname)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="givenNames"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Given name(s)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Michael" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="nativeScriptName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full name in native language or script</FormLabel>
            <FormDescription>
              e.g. Arabic, Cyrillic, Chinese, Korean, Japanese characters. Leave blank if not applicable.
            </FormDescription>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of birth</FormLabel>
            <FormDescription>Format: YYYY-MM-DD (e.g. 1990-05-15)</FormDescription>
            <FormControl>
              <Input placeholder="1990-05-15" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
