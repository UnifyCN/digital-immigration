"use client"

import { useFormContext, useWatch } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Imm5669Data, BackgroundQuestions } from "@/lib/imm5669/types"
import { BACKGROUND_QUESTION_LABELS } from "@/lib/imm5669/types"

const QUESTION_KEYS = Object.keys(BACKGROUND_QUESTION_LABELS) as (keyof BackgroundQuestions)[]

export function SectionBackgroundQuestions() {
  const { control } = useFormContext<Imm5669Data>()

  const bgValues = useWatch({ control, name: "backgroundQuestions" })
  const anyYes = bgValues
    ? Object.values(bgValues).some((v) => v === "yes")
    : false

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          Background Questions
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Have you, or any family member listed in your application, ever experienced
          any of the following? Answer YES or NO for each.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {QUESTION_KEYS.map((key) => (
          <FormField
            key={key}
            control={control}
            name={`backgroundQuestions.${key}`}
            render={({ field }) => (
              <FormItem className="rounded-lg border border-border bg-card p-4">
                <FormLabel className="text-sm leading-relaxed">
                  {key.toUpperCase()}) {BACKGROUND_QUESTION_LABELS[key]}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="mt-2 flex gap-4"
                  >
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="yes" />
                      <span className="text-sm">Yes</span>
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="no" />
                      <span className="text-sm">No</span>
                    </Label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      {anyYes && (
        <FormField
          control={control}
          name="backgroundDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Details for &quot;Yes&quot; answers
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details for each question you answered 'Yes' to..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
