"use client"

import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { format } from "date-fns"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarIcon, CircleHelp } from "lucide-react"
import { CANADIAN_PROVINCES_AND_TERRITORIES } from "@/lib/canada-regions"
import type { AssessmentData } from "@/lib/types"

const goals = [
  { value: "pr", label: "Permanent Residence (PR)" },
  { value: "study-permit", label: "Study Permit" },
  { value: "work-permit", label: "Work Permit" },
  { value: "sponsorship", label: "Family Sponsorship" },
  { value: "not-sure", label: "Not sure yet" },
]

const locations = [
  { value: "inside-canada", label: "Inside Canada" },
  { value: "outside-canada", label: "Outside Canada" },
]

const geographicFlexibilityOptions = [
  { value: "yes-anywhere", label: "Yes, anywhere" },
  { value: "prefer-specific", label: "Prefer a specific province" },
  { value: "only-specific", label: "Only a specific province" },
]

const deadlineOptions = [
  { value: "status-expiring", label: "My status is expiring soon" },
  { value: "job-offer-start", label: "I have a job offer start date" },
  { value: "school-intake", label: "I have a school intake deadline" },
  { value: "family-situation", label: "Family situation" },
  { value: "no-hard-deadline", label: "No hard deadline" },
]

const yesNoNotSure = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
]

const yesNoNotSurePNP = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
]

const sponsorshipRelations = [
  { value: "spouse-partner", label: "Spouse/partner" },
  { value: "child", label: "Child" },
  { value: "parent-grandparent", label: "Parent/grandparent" },
  { value: "other", label: "Other" },
]

export function StepGoalTimeline() {
  const { control, watch, setValue } = useFormContext<AssessmentData>()
  const primaryGoal = watch("primaryGoal")
  const geographicFlexibility = watch("geographicFlexibility")
  const deadlineTrigger = watch("deadlineTrigger")

  useEffect(() => {
    if (
      geographicFlexibility !== "prefer-specific" &&
      geographicFlexibility !== "only-specific"
    ) {
      setValue("preferredProvince", "", { shouldValidate: true })
    }
  }, [geographicFlexibility, setValue])

  useEffect(() => {
    if (deadlineTrigger === "no-hard-deadline" || !deadlineTrigger) {
      setValue("deadlineDate", "", { shouldValidate: true })
    }
  }, [deadlineTrigger, setValue])

  useEffect(() => {
    if (primaryGoal !== "study-permit") {
      setValue("studyPermitHasLOA", "", { shouldValidate: true })
    }
    if (primaryGoal !== "work-permit") {
      setValue("workPermitHasJobOffer", "", { shouldValidate: true })
    }
    if (primaryGoal !== "sponsorship") {
      setValue("sponsorshipRelation", "", { shouldValidate: true })
    }
  }, [primaryGoal, setValue])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Goal & Timeline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What are you trying to achieve, and how soon do you need a plan?
        </p>
      </div>

      <FormField
        control={control}
        name="primaryGoal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary goal</FormLabel>
            <FormDescription>Select the option that best describes your situation.</FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {goals.map((g) => (
                  <Label
                    key={g.value}
                    htmlFor={`goal-${g.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={g.value} id={`goal-${g.value}`} />
                    <span className="text-sm text-foreground">{g.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="openToPNP"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Are you open to applying through a Provincial Nominee Program if it is your strongest option?
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {yesNoNotSurePNP.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`pnp-open-${option.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} id={`pnp-open-${option.value}`} />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="currentLocation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current location</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {locations.map((l) => (
                  <Label
                    key={l.value}
                    htmlFor={`location-${l.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={l.value} id={`location-${l.value}`} />
                    <span className="text-sm text-foreground">{l.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="geographicFlexibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Are you open to settling anywhere in Canada?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {geographicFlexibilityOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`geo-flex-${option.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} id={`geo-flex-${option.value}`} />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {(geographicFlexibility === "prefer-specific" ||
        geographicFlexibility === "only-specific") && (
        <FormField
          control={control}
          name="preferredProvince"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which province?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a province or territory" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CANADIAN_PROVINCES_AND_TERRITORIES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
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
        name="deadlineTrigger"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1.5">
              <FormLabel>Is there a deadline driving this?</FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <CircleHelp className="size-4" />
                    <span className="sr-only">Why we ask this</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  This helps us prioritize what to solve first.
                </TooltipContent>
              </Tooltip>
            </div>
            <FormDescription>This helps us prioritize what to solve first.</FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {deadlineOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`deadline-${option.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} id={`deadline-${option.value}`} />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {deadlineTrigger && deadlineTrigger !== "no-hard-deadline" && (
        <FormField
          control={control}
          name="deadlineDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>What&apos;s the deadline date?</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {field.value ? format(new Date(field.value), "PPP") : "Select a deadline date"}
                      <CalendarIcon className="size-4 text-muted-foreground" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {primaryGoal === "study-permit" && (
        <FormField
          control={control}
          name="studyPermitHasLOA"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you already have a Letter of Acceptance (LOA)?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  {yesNoNotSure.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`loa-${option.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} id={`loa-${option.value}`} />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {primaryGoal === "work-permit" && (
        <FormField
          control={control}
          name="workPermitHasJobOffer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you have a job offer from a Canadian employer?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  {yesNoNotSure.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`job-offer-${option.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} id={`job-offer-${option.value}`} />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {primaryGoal === "sponsorship" && (
        <FormField
          control={control}
          name="sponsorshipRelation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Who are you sponsoring / being sponsored by?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-2"
                >
                  {sponsorshipRelations.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`sponsorship-${option.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} id={`sponsorship-${option.value}`} />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
