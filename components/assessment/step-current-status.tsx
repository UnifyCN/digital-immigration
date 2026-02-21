"use client"

import { useFormContext, useWatch } from "react-hook-form"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import type { AssessmentData } from "@/lib/types"

const statuses = [
  { value: "citizen", label: "Canadian Citizen" },
  { value: "pr", label: "Permanent Resident" },
  { value: "visitor", label: "Visitor" },
  { value: "student", label: "Student" },
  { value: "worker", label: "Worker" },
  { value: "other", label: "Other" },
]

export function StepCurrentStatus() {
  const { control } = useFormContext<AssessmentData>()
  const currentStatus = useWatch({ control, name: "currentStatus" })
  const showExpiry = currentStatus !== "citizen" && currentStatus !== "pr" && currentStatus !== ""

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Current Status & Eligibility
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status and location determine which programs and requirements can apply.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="size-4" />
                <span className="sr-only">More info</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Your current immigration status and nationality help determine which
              Canadian immigration programs you may be eligible for.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <FormField
        control={control}
        name="currentStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current immigration status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statuses.map((s) => (
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

      {showExpiry && (
        <FormField
          control={control}
          name="statusExpiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status expiry date</FormLabel>
              <FormDescription>If known, enter your status expiry date.</FormDescription>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="countryOfResidence"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country of residence</FormLabel>
            <FormControl>
              <Input placeholder="e.g. India, Philippines, Nigeria" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nationality</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Indian, Filipino, Nigerian" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="priorApplications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prior Canadian applications?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Not sure" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`prior-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`prior-${o.value}`} />
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
