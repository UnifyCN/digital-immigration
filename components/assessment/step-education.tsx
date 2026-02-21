"use client"

import { useFormContext } from "react-hook-form"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { AssessmentData } from "@/lib/types"

const educationLevels = [
  { value: "none", label: "No formal education" },
  { value: "high-school", label: "High school diploma" },
  { value: "one-year-diploma", label: "One-year diploma or certificate" },
  { value: "two-year-diploma", label: "Two-year diploma" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "two-or-more-degrees", label: "Two or more degrees" },
  { value: "masters", label: "Master's degree" },
  { value: "phd", label: "Doctoral degree (PhD)" },
]

export function StepEducation() {
  const { control } = useFormContext<AssessmentData>()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Education Summary
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your highest education helps determine eligibility for several programs.
        </p>
      </div>

      <FormField
        control={control}
        name="educationLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Highest education level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {educationLevels.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
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
        name="educationCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country where education was completed</FormLabel>
            <FormControl>
              <Input placeholder="e.g. India, Philippines, Canada" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="graduationYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Graduation year</FormLabel>
            <FormControl>
              <Input type="number" placeholder="e.g. 2019" min="1960" max="2026" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="ecaStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Education Credential Assessment (ECA) completed?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "not-sure", label: "Not sure" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`eca-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`eca-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
