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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { AssessmentData } from "@/lib/types"

const goals = [
  { value: "pr", label: "Permanent Residence (PR)" },
  { value: "study-permit", label: "Study Permit" },
  { value: "work-permit", label: "Work Permit" },
  { value: "sponsorship", label: "Family Sponsorship" },
  { value: "not-sure", label: "Not sure yet" },
]

const urgencies = [
  { value: "less-than-3", label: "Less than 3 months" },
  { value: "3-to-6", label: "3 to 6 months" },
  { value: "6-to-12", label: "6 to 12 months" },
  { value: "flexible", label: "Flexible / No rush" },
]

const locations = [
  { value: "inside-canada", label: "Inside Canada" },
  { value: "outside-canada", label: "Outside Canada" },
]

export function StepGoalTimeline() {
  const { control } = useFormContext<AssessmentData>()

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
        name="timeUrgency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How soon do you need a plan?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {urgencies.map((u) => (
                  <Label
                    key={u.value}
                    htmlFor={`urgency-${u.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={u.value} id={`urgency-${u.value}`} />
                    <span className="text-sm text-foreground">{u.label}</span>
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
    </div>
  )
}
