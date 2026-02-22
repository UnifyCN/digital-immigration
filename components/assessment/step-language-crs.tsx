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
import { Separator } from "@/components/ui/separator"
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
  const { control } = useFormContext<AssessmentData>()
  const languageTestStatus = useWatch({ control, name: "languageTestStatus" })

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

      {languageTestStatus === "yes" && (
        <>
          <FormField
            control={control}
            name="languageApproxCLB"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What was your overall language level (approx.)?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select approximate CLB level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { value: "clb-4-6", label: "CLB 4–6 (approx.)" },
                      { value: "clb-7", label: "CLB 7" },
                      { value: "clb-8", label: "CLB 8" },
                      { value: "clb-9-plus", label: "CLB 9+" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Approximate is fine — this helps assess fit.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="languageTestValid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is your language test still valid (taken within the last 2 years)?</FormLabel>
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
                        htmlFor={`lang-valid-${o.value}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                      >
                        <RadioGroupItem value={o.value} id={`lang-valid-${o.value}`} />
                        <span className="text-foreground">{o.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>Language tests can expire.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {languageTestStatus === "planning" && (
        <FormField
          control={control}
          name="languagePlannedTiming"
          render={({ field }) => (
            <FormItem>
              <FormLabel>When do you plan to take the test?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select planned timing" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[
                    { value: "within-1-month", label: "Within 1 month" },
                    { value: "1-3-months", label: "1–3 months" },
                    { value: "3-plus-months", label: "3+ months" },
                    { value: "not-scheduled", label: "Not scheduled" },
                  ].map((o) => (
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

      <Separator />

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
        name="canadianWorkDuration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How much Canadian work experience do you have?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Canadian work duration" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[
                  { value: "none", label: "None" },
                  { value: "less-than-1-year", label: "Less than 1 year" },
                  { value: "1-year", label: "1 year" },
                  { value: "2-plus-years", label: "2+ years" },
                  { value: "not-sure", label: "Not sure" },
                ].map((o) => (
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
        name="secondOfficialLanguageIntent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Have you taken or do you plan to take a second official language test?</FormLabel>
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
                    htmlFor={`second-lang-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`second-lang-${o.value}`} />
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
