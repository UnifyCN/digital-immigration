"use client"

import { useFormContext, useFieldArray } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import type { AssessmentData } from "@/lib/types"

const experienceOptions = [
  { value: "0-1", label: "0 to 1 year" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "3-5", label: "3 to 5 years" },
  { value: "5+", label: "5+ years" },
  { value: "not-sure", label: "Not sure" },
]

const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Engineering",
  "Trades",
  "Hospitality",
  "Retail",
  "Other",
]

export function StepWorkHistory() {
  const { control } = useFormContext<AssessmentData>()
  const { fields, append, remove } = useFieldArray({ control, name: "jobs" })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Work History Summary
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approximate answers are fine. You can always refine later.
        </p>
      </div>

      <FormField
        control={control}
        name="currentJobTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current or most recent job title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Software Engineer, Nurse, Chef" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="countryOfWork"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country of work</FormLabel>
            <FormControl>
              <Input placeholder="e.g. India, Canada, UAE" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="totalExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total years of skilled work experience</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experience range" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {experienceOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
        name="industryCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Industry / role category (optional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {industryOptions.map((i) => (
                  <SelectItem key={i} value={i.toLowerCase()}>
                    {i}
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
        name="employmentGaps"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employment gaps in last 10 years?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Unsure" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`gaps-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`gaps-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Quick-add job cards */}
      <div className="flex flex-col gap-3">
        <FormLabel>Quick-add previous roles (optional)</FormLabel>
        <FormDescription>Add up to a few key roles. Approximate dates are fine.</FormDescription>

        {fields.map((field, index) => (
          <Card key={field.id} className="relative">
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Job #{index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="size-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Remove job</span>
                </Button>
              </div>
              <FormField
                control={control}
                name={`jobs.${index}.title`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Job title" {...f} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name={`jobs.${index}.country`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Country" {...f} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`jobs.${index}.yearsRange`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="e.g. 2-3 yrs" {...f} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {fields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", country: "", yearsRange: "" })}
            className="w-fit gap-1.5"
          >
            <Plus className="size-3.5" />
            Add a role
          </Button>
        )}
      </div>
    </div>
  )
}
