"use client"

import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
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

const hoursOptions = [
  { value: "lt15", label: "<15" },
  { value: "15-29", label: "15-29" },
  { value: "30plus", label: "30+ (full-time)" },
  { value: "varies-not-sure", label: "Varies / Not sure" },
]

const paidWorkOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "mix-not-sure", label: "Mix / Not sure" },
]

const employmentTypeOptions = [
  { value: "employee", label: "Employee" },
  { value: "self-employed-contractor", label: "Self-employed / Contractor" },
  { value: "mix", label: "Mix" },
  { value: "unsure", label: "Not sure" },
]

const yesNoNotSureOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
]

const letterChallengeOptions = [
  { value: "employer-wont-include-duties", label: "Employer won't include duties" },
  { value: "employer-closed-cant-contact", label: "Employer closed / can't contact" },
  { value: "self-employed", label: "Self-employed" },
  { value: "informal-work-no-records", label: "Informal work / no records" },
  { value: "other-not-sure", label: "Other / not sure" },
]

const workHistoryRadioLabelClass =
  "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"

export function StepWorkHistory() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const { fields, append, remove } = useFieldArray({ control, name: "jobs" })

  const mostRecentJobPresent = useWatch({ control, name: "mostRecentJobPresent" })
  const canObtainEmployerLetter = useWatch({ control, name: "canObtainEmployerLetter" })
  const watchedJobs = useWatch({ control, name: "jobs" })

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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="mostRecentJobStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date (month/year)</FormLabel>
              <FormControl>
                <Input type="month" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="mostRecentJobEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input
                  type="month"
                  {...field}
                  value={field.value ?? ""}
                  disabled={!!mostRecentJobPresent}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="mostRecentJobPresent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={!!field.value}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true
                  field.onChange(isChecked)
                  if (isChecked) {
                    setValue("mostRecentJobEnd", "")
                  }
                }}
              />
            </FormControl>
            <FormLabel className="font-normal">Present</FormLabel>
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
        name="hoursPerWeekRange"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Average hours per week</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-4"
              >
                {hoursOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`hours-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`hours-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>Used to understand full-time equivalency.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="paidWorkStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Was this work paid?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {paidWorkOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`paid-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`paid-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>Some programs count only paid work.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="employmentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What best describes this work?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-4"
              >
                {employmentTypeOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`employment-type-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`employment-type-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>Proof requirements can differ.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="canObtainEmployerLetter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Can you obtain an employer reference letter that includes duties, hours, pay, and dates?
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value)
                  if (value === "yes") {
                    setValue("employerLetterChallenge", "")
                  }
                }}
                value={field.value}
                className="flex gap-4"
              >
                {yesNoNotSureOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`letter-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`letter-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {canObtainEmployerLetter && canObtainEmployerLetter !== "yes" && (
        <FormField
          control={control}
          name="employerLetterChallenge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What's the main challenge?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select the main challenge" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {letterChallengeOptions.map((o) => (
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
      )}

      <FormField
        control={control}
        name="hasOverlappingPeriods"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Any overlapping jobs or work+study periods in the last 10 years?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {yesNoNotSureOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`overlap-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`overlap-${o.value}`} />
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
                    className={workHistoryRadioLabelClass}
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

      <div className="flex flex-col gap-3">
        <FormLabel>Quick-add previous roles (optional)</FormLabel>
        <FormDescription>Add up to a few key roles. Approximate dates are fine.</FormDescription>

        {fields.map((field, index) => {
          const jobPresent = watchedJobs?.[index]?.present
          return (
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
                        <Input
                          placeholder="Job title"
                          aria-label={`Job ${index + 1} title`}
                          {...f}
                          value={f.value ?? ""}
                        />
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
                          <Input
                            placeholder="Country (optional)"
                            aria-label={`Job ${index + 1} country`}
                            {...f}
                            value={f.value ?? ""}
                          />
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
                          <Input
                            placeholder="e.g. 2-3 yrs"
                            aria-label={`Job ${index + 1} years range`}
                            {...f}
                            value={f.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name={`jobs.${index}.startMonth`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="month"
                            aria-label={`Job ${index + 1} start month`}
                            {...f}
                            value={f.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`jobs.${index}.endMonth`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="month"
                            aria-label={`Job ${index + 1} end month`}
                            {...f}
                            value={f.value ?? ""}
                            disabled={!!jobPresent}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`jobs.${index}.present`}
                  render={({ field: f }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={!!f.value}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true
                            f.onChange(isChecked)
                            if (isChecked) {
                              setValue(`jobs.${index}.endMonth`, "")
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Present</FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )
        })}

        {fields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                title: "",
                country: "",
                yearsRange: "",
                startMonth: "",
                endMonth: "",
                present: false,
              })
            }
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
