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
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { RepeatableRow, AddRowButton } from "./repeatable-row"
import type { Imm5669Data } from "@/lib/imm5669/types"
import { EMPTY_PERSONAL_HISTORY_ROW } from "@/lib/imm5669/types"

export function SectionPersonalHistory() {
  const { control, formState } = useFormContext<Imm5669Data>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "personalHistory",
  })

  const gapError = formState.errors.personalHistory?.message
    || formState.errors.personalHistory?.root?.message

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Personal History
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide details since age 18 or the past 10 years, whichever is more recent.
          Start with the most recent. Include employment, studies, travel, unemployment, etc.
        </p>
      </div>

      <Alert variant="default" className="border-tier-moderate/30 bg-tier-moderate/5">
        <AlertTriangle className="size-4 text-tier-moderate" />
        <AlertDescription className="text-xs">
          Do not leave any gaps in time. Failure to account for all time periods
          will result in a delay in processing your application.
        </AlertDescription>
      </Alert>

      {gapError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">{gapError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <RepeatableRow
            key={field.id}
            index={index}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`personalHistory.${index}.from`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="2020-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`personalHistory.${index}.to`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="2023-06" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`personalHistory.${index}.activity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Activity</FormLabel>
                    <FormDescription className="text-[10px]">
                      Job title, studying, unemployed, travelling, etc.
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`personalHistory.${index}.cityAndCountry`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">City and country</FormLabel>
                    <FormControl>
                      <Input placeholder="Toronto, Canada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`personalHistory.${index}.statusInCountry`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Status in country</FormLabel>
                    <FormControl>
                      <Input placeholder="Work permit holder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`personalHistory.${index}.companyOrEmployer`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Company/Employer/School</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </RepeatableRow>
        ))}
      </div>

      <AddRowButton
        label="Add personal history entry"
        onClick={() => append({ ...EMPTY_PERSONAL_HISTORY_ROW })}
      />
    </div>
  )
}
