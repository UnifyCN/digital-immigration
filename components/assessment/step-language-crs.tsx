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
import { Checkbox } from "@/components/ui/checkbox"
import type { AssessmentData } from "@/lib/types"

const ageRanges = [
  { value: "17-or-less", label: "17 or younger" },
  { value: "18-24", label: "18-24" },
  { value: "25-29", label: "25-29" },
  { value: "30-34", label: "30-34" },
  { value: "35-39", label: "35-39" },
  { value: "40-44", label: "40-44" },
  { value: "45+", label: "45 or older" },
]

export function StepLanguageCRS() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const languageTestStatus = useWatch({ control, name: "languageTestStatus" })
  const addScoresLater = useWatch({ control, name: "addScoresLater" })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Language & CRS Indicators
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {"These help estimate fit; they are not a guarantee."}
        </p>
      </div>

      <FormField
        control={control}
        name="languageTestStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IELTS / CELPIP / TEF status</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Completed" },
                  { value: "no", label: "Not taken" },
                  { value: "planning", label: "Planning" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`lang-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`lang-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {languageTestStatus === "yes" && !addScoresLater && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">Component scores</p>
          <div className="grid grid-cols-2 gap-4">
            {(["listening", "reading", "writing", "speaking"] as const).map((component) => (
              <FormField
                key={component}
                control={control}
                name={`languageScores.${component}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize text-xs">{component}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        placeholder="0.0"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}

      {languageTestStatus === "yes" && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="add-later"
            checked={addScoresLater}
            onCheckedChange={(checked) => setValue("addScoresLater", !!checked)}
          />
          <Label htmlFor="add-later" className="text-sm text-muted-foreground cursor-pointer">
            {"I'll add scores later"}
          </Label>
        </div>
      )}

      {languageTestStatus === "planning" && (
        <FormField
          control={control}
          name="plannedTestDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planned test date (approximate)</FormLabel>
              <FormDescription>Month/year or leave blank if not planned.</FormDescription>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="ageRange"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Age range</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ageRanges.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
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
        name="canadianEducation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Canadian education?</FormLabel>
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
                    htmlFor={`can-edu-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`can-edu-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
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
        name="canadianWorkExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Canadian work experience?</FormLabel>
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
                    htmlFor={`can-work-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`can-work-${o.value}`} />
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
