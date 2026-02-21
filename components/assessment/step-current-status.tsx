"use client"

import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { format } from "date-fns"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CalendarIcon, HelpCircle } from "lucide-react"
import type { AssessmentData } from "@/lib/types"

const statuses = [
  { value: "citizen", label: "Canadian Citizen" },
  { value: "pr", label: "Permanent Resident" },
  { value: "visitor", label: "Visitor" },
  { value: "student", label: "Student" },
  { value: "worker", label: "Worker" },
  { value: "other", label: "Other" },
]

const applicationTypeOptions = [
  { value: "visitor", label: "Visitor" },
  { value: "study", label: "Study" },
  { value: "work", label: "Work" },
  { value: "pr", label: "PR" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "other", label: "Other" },
  { value: "not-sure", label: "Not sure" },
]

export function StepCurrentStatus() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const currentStatus = useWatch({ control, name: "currentStatus" })
  const currentLocation = useWatch({ control, name: "currentLocation" })
  const priorApplications = useWatch({ control, name: "priorApplications" })
  const refusalHistory = useWatch({ control, name: "refusalHistory" })
  const showExpiry = currentStatus !== "citizen" && currentStatus !== "pr" && currentStatus !== ""
  const showMaintainedStatus = currentLocation === "inside-canada"
  const showRefusalFollowup = refusalHistory !== "" && refusalHistory !== "no"
  const showPriorApplicationType = priorApplications === "yes"

  useEffect(() => {
    if (!showExpiry) {
      setValue("statusExpiryDate", "", { shouldValidate: true })
    }
  }, [setValue, showExpiry])

  useEffect(() => {
    if (!showMaintainedStatus) {
      setValue("hasAppliedToExtendStatus", "", { shouldValidate: true })
    }
  }, [setValue, showMaintainedStatus])

  useEffect(() => {
    if (!showRefusalFollowup) {
      setValue("mostRecentRefusalType", "", { shouldValidate: true })
    }
  }, [setValue, showRefusalFollowup])

  useEffect(() => {
    if (!showPriorApplicationType) {
      setValue("priorCanadaApplicationType", "", { shouldValidate: true })
    }
  }, [setValue, showPriorApplicationType])

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
            <FormItem className="flex flex-col">
              <FormLabel>When does your current status expire?</FormLabel>
              <FormDescription>This helps assess urgency and available options.</FormDescription>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {field.value ? format(new Date(field.value), "PPP") : "Select expiry date"}
                      <CalendarIcon className="size-4 text-muted-foreground" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {showMaintainedStatus && (
        <FormField
          control={control}
          name="hasAppliedToExtendStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Have you applied to extend your status (or change status) and are waiting for a decision?
              </FormLabel>
              <FormDescription>Sometimes called maintained (implied) status.</FormDescription>
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
                      htmlFor={`maintained-${o.value}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={o.value} id={`maintained-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
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
        name="refusalHistory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Have you ever had an application refused (Canada or another country)?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {[
                  { value: "no", label: "No" },
                  { value: "canada", label: "Yes — Canada" },
                  { value: "another-country", label: "Yes — another country" },
                  { value: "both", label: "Yes — both" },
                  { value: "unsure", label: "Not sure" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`refusal-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`refusal-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showRefusalFollowup && (
        <FormField
          control={control}
          name="mostRecentRefusalType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What was the most recent refusal for?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select refusal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applicationTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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

      {showPriorApplicationType && (
        <FormField
          control={control}
          name="priorCanadaApplicationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What type of application have you submitted to Canada before?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select application type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applicationTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
