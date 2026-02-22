"use client"

import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
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
import { X } from "lucide-react"
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

const programLengthOptions = [
  { value: "less-than-1-year", label: "Less than 1 year" },
  { value: "1-year", label: "1 year" },
  { value: "2-years", label: "2 years" },
  { value: "3-plus-years", label: "3+ years" },
  { value: "not-sure", label: "Not sure" },
]

const CURRENT_YEAR = new Date().getFullYear()
const MAX_CREDENTIALS = 5

export function StepEducation() {
  const { control } = useFormContext<AssessmentData>()
  const ecaStatus = useWatch({ control, name: "ecaStatus" })
  const hasMultipleCredentials = useWatch({ control, name: "hasMultipleCredentials" })
  const { fields, append, remove } = useFieldArray({
    control,
    name: "additionalCredentials",
  })
  const isMaxCredentialsReached = fields.length >= MAX_CREDENTIALS

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
              <Input
                type="number"
                placeholder="e.g. 2019"
                min="1960"
                max={CURRENT_YEAR}
                {...field}
              />
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
                  { value: "unsure", label: "Not sure" },
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

      <FormField
        control={control}
        name="canadaEducationStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Was this education completed in Canada?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "mix-some-in-canada", label: "Mix / Some in Canada" },
                  { value: "not-sure", label: "Not sure" },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`canada-edu-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`canada-edu-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>Canadian education can affect eligibility and pathways.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="programLength"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How long was the program?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select program length" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {programLengthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Program length can matter for points and eligibility.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="hasMultipleCredentials"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have more than one completed credential?</FormLabel>
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
                    htmlFor={`multiple-credentials-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`multiple-credentials-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasMultipleCredentials === "yes" && (
        <div className="flex flex-col gap-3">
          <FormLabel>Add another credential (optional)</FormLabel>
          {fields.map((item, index) => (
            <Card key={item.id} className="relative">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Credential #{index + 2}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="size-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Remove credential</span>
                  </Button>
                </div>

                <FormField
                  control={control}
                  name={`additionalCredentials.${index}.educationLevel`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education level</FormLabel>
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
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`additionalCredentials.${index}.country`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. India, Canada" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`additionalCredentials.${index}.graduationYear`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 2018"
                            min="1960"
                            max={CURRENT_YEAR}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`additionalCredentials.${index}.programLength`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program length</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select program length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programLengthOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (isMaxCredentialsReached) return
              append({
                educationLevel: "",
                country: "",
                graduationYear: "",
                programLength: "",
              })
            }}
            disabled={isMaxCredentialsReached}
            className="w-fit gap-1.5"
          >
            {isMaxCredentialsReached
              ? `Credential limit reached (${MAX_CREDENTIALS})`
              : "+ Add credential"}
          </Button>
          {isMaxCredentialsReached && (
            <p className="text-xs text-muted-foreground">
              You can add up to {MAX_CREDENTIALS} total credentials.
            </p>
          )}
        </div>
      )}

      {ecaStatus === "yes" && (
        <FormField
          control={control}
          name="ecaValid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is your ECA still valid (issued within the last 5 years)?</FormLabel>
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
                      htmlFor={`eca-valid-${o.value}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={o.value} id={`eca-valid-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>Some ECAs expire and may need renewal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
