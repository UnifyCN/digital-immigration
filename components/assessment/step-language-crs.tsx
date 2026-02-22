"use client"

import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup } from "@/components/ui/radio-group"
import { RadioCard } from "@/components/ui/radio-card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import type { AssessmentData } from "@/lib/types"

export function StepLanguageCRS() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const languageTestStatus = useWatch({ control, name: "languageTestStatus" })

  useEffect(() => {
    if (languageTestStatus !== "valid") {
      setValue("languageScores.listening", "", { shouldValidate: true })
      setValue("languageScores.reading", "", { shouldValidate: true })
      setValue("languageScores.writing", "", { shouldValidate: true })
      setValue("languageScores.speaking", "", { shouldValidate: true })
    }
    if (languageTestStatus !== "booked") {
      setValue("languageTestPlannedDate", "", { shouldValidate: true })
    }
  }, [languageTestStatus, setValue])

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
            <FormLabel>Do you currently have a valid language test taken within the last 2 years?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "valid", label: "Yes" },
                  { value: "not_valid", label: "No" },
                  { value: "booked", label: "Booked" },
                ].map((o) => (
                  <RadioCard
                    key={o.value}
                    value={o.value}
                    id={`language-validity-${o.value}`}
                    label={o.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {languageTestStatus === "valid" && (
        <div className="flex flex-col gap-4">
          <FormLabel>Enter your exact scores</FormLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="languageScores.listening"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listening</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="languageScores.reading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="languageScores.writing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Writing</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="languageScores.speaking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaking</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {languageTestStatus === "booked" && (
        <FormField
          control={control}
          name="languageTestPlannedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planned test date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select your test date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
                  <RadioCard
                    key={o.value}
                    value={o.value}
                    id={`second-lang-${o.value}`}
                    label={o.label}
                  />
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
