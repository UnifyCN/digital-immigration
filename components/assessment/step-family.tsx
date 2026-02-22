"use client"

import { useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { RadioGroup } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { RadioCard } from "@/components/ui/radio-card"
import { CANADIAN_PROVINCES_AND_TERRITORIES } from "@/lib/canada-regions"
import type { AssessmentData } from "@/lib/types"

const maritalStatuses = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "common-law", label: "Common-law" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
]

export function StepFamily() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const maritalStatus = useWatch({ control, name: "maritalStatus" })
  const primaryGoal = useWatch({ control, name: "primaryGoal" })
  const closeRelativeInCanada = useWatch({ control, name: "closeRelativeInCanada" })
  const hasCloseRelativeInCanada = useWatch({ control, name: "hasCloseRelativeInCanada" })
  const showPartner = maritalStatus === "married" || maritalStatus === "common-law"
  const isSponsorshipGoal = primaryGoal === "sponsorship"

  useEffect(() => {
    if (!showPartner) {
      setValue("spouseAccompanying", "", { shouldValidate: true })
      setValue("spouseLocation", "", { shouldValidate: true })
    }
  }, [setValue, showPartner])

  useEffect(() => {
    if (closeRelativeInCanada !== "yes") {
      setValue("closeRelativeRelationship", "", { shouldValidate: true })
    }
  }, [closeRelativeInCanada, setValue])

  useEffect(() => {
    if (hasCloseRelativeInCanada !== "yes") {
      setValue("relativeProvinceTerritory", "", { shouldValidate: true })
    }
  }, [hasCloseRelativeInCanada, setValue])

  useEffect(() => {
    if (!isSponsorshipGoal) {
      setValue("sponsorshipTarget", "", { shouldValidate: true })
      setValue("sponsorStatus", "", { shouldValidate: true })
    }
  }, [isSponsorshipGoal, setValue])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Family Situation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Family details may affect eligibility and CRS points.
        </p>
      </div>

      <FormField
        control={control}
        name="maritalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marital status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {maritalStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
        name="dependents"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of dependents</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="10"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showPartner && (
        <>
          <FormField
            control={control}
            name="spouseAccompanying"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Will your spouse/partner be included in the application?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "yes-accompanying", label: "Yes (accompanying)" },
                      { value: "no-non-accompanying", label: "No (non-accompanying)" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((o) => (
                      <RadioCard
                        key={o.value}
                        value={o.value}
                        id={`spouse-accompanying-${o.value}`}
                        label={o.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>This can affect eligibility and points.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="spouseLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where is your spouse/partner currently?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                  >
                    {[
                      { value: "in-canada", label: "In Canada" },
                      { value: "outside-canada", label: "Outside Canada" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((o) => (
                      <RadioCard
                        key={o.value}
                        value={o.value}
                        id={`spouse-location-${o.value}`}
                        label={o.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />
        </>
      )}

      <FormField
        control={control}
        name="hasDependents18Plus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Any dependents 18+?</FormLabel>
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
                    id={`dependents-18-plus-${o.value}`}
                    label={o.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="hasDependentsUnder18"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have any dependents under 18?</FormLabel>
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
                    id={`dependents-under-18-${o.value}`}
                    label={o.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="closeRelativeInCanada"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have a close relative in Canada who is a citizen or permanent resident?</FormLabel>
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
                    id={`close-relative-${o.value}`}
                    label={o.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {closeRelativeInCanada === "yes" && (
        <FormField
          control={control}
          name="closeRelativeRelationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which relationship applies?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[
                    { value: "parent", label: "Parent" },
                    { value: "sibling", label: "Sibling" },
                    { value: "child", label: "Child" },
                    { value: "other-close-relative", label: "Other close relative" },
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
      )}

      <FormField
        control={control}
        name="hasCloseRelativeInCanada"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have a close relative in Canada?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((o) => (
                  <RadioCard
                    key={o.value}
                    value={o.value}
                    id={`has-close-relative-${o.value}`}
                    label={o.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasCloseRelativeInCanada === "yes" && (
        <FormField
          control={control}
          name="relativeProvinceTerritory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which province or territory does your relative live in?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select province or territory" />
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

      {isSponsorshipGoal && (
        <>
          <Separator />

          <FormField
            control={control}
            name="sponsorshipTarget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who is being sponsored (or sponsoring you)?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sponsorship target" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { value: "spouse-partner", label: "Spouse/partner" },
                      { value: "child", label: "Child" },
                      { value: "parent-grandparent", label: "Parent/grandparent" },
                      { value: "other", label: "Other" },
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
            name="sponsorStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is the sponsor a Canadian citizen or permanent resident?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                  >
                    {[
                      { value: "citizen", label: "Citizen" },
                      { value: "permanent-resident", label: "Permanent resident" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((o) => (
                      <RadioCard
                        key={o.value}
                        value={o.value}
                        id={`sponsor-status-${o.value}`}
                        label={o.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}
