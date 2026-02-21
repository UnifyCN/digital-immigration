"use client"

import { useFormContext, useWatch } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { AssessmentData } from "@/lib/types"

const maritalStatuses = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "common-law", label: "Common-law" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
]

export function StepFamily() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const maritalStatus = useWatch({ control, name: "maritalStatus" })
  const showPartner = maritalStatus === "married" || maritalStatus === "common-law"

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Family Situation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Family details may affect eligibility and CRS points.
        </p>
      </div>

      <FormField
        control={control}
        name="maritalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marital status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {maritalStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="dependents"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of dependents</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="10"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showPartner && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            Partner qualifications (optional)
          </p>
          <p className="text-xs text-muted-foreground">
            These toggles help estimate CRS adaptability points.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="partner-edu" className="text-sm text-foreground cursor-pointer">
                Partner has post-secondary education?
              </Label>
              <Switch
                id="partner-edu"
                checked={!!useWatch({ control, name: "partnerEducation" })}
                onCheckedChange={(checked) => setValue("partnerEducation", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="partner-lang" className="text-sm text-foreground cursor-pointer">
                Partner has language scores?
              </Label>
              <Switch
                id="partner-lang"
                checked={!!useWatch({ control, name: "partnerLanguageScores" })}
                onCheckedChange={(checked) => setValue("partnerLanguageScores", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="partner-work" className="text-sm text-foreground cursor-pointer">
                Partner has work experience?
              </Label>
              <Switch
                id="partner-work"
                checked={!!useWatch({ control, name: "partnerWorkExperience" })}
                onCheckedChange={(checked) => setValue("partnerWorkExperience", checked)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
