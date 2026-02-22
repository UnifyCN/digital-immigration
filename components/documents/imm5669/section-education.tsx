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
import { RepeatableRow, AddRowButton } from "./repeatable-row"
import type { Imm5669Data } from "@/lib/imm5669/types"
import { EMPTY_EDUCATION_ROW } from "@/lib/imm5669/types"

export function SectionEducation() {
  const { control } = useFormContext<Imm5669Data>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "educationHistory",
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Education
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Years of schooling completed and details of secondary/post-secondary education.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Years of schooling completed
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField
            control={control}
            name="educationYears.elementary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Elementary/Primary</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="educationYears.secondary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Secondary/High School</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="educationYears.university"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">University/College</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="educationYears.tradeSchool"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Trade/Post-Secondary</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Education History
        </h3>
        <FormDescription className="mb-3">
          Secondary and post-secondary education, including university, college, and apprenticeship training.
        </FormDescription>

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
                  name={`educationHistory.${index}.from`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">From (YYYY-MM)</FormLabel>
                      <FormControl>
                        <Input placeholder="2015-09" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationHistory.${index}.to`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">To (YYYY-MM)</FormLabel>
                      <FormControl>
                        <Input placeholder="2019-06" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationHistory.${index}.institutionName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name of institution</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationHistory.${index}.cityAndCountry`}
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
                  name={`educationHistory.${index}.certificateType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Certificate/Diploma type</FormLabel>
                      <FormControl>
                        <Input placeholder="Bachelor's Degree" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationHistory.${index}.fieldOfStudy`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Field of study</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} />
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
          label="Add education entry"
          onClick={() => append({ ...EMPTY_EDUCATION_ROW })}
        />
      </div>
    </div>
  )
}
