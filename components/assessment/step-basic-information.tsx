"use client"

import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  CANADIAN_PROVINCES_AND_TERRITORIES,
  CURRENT_PROVINCE_TERRITORY_OPTIONS,
} from "@/lib/canada-regions"
import type { AssessmentData } from "@/lib/types"

const temporaryStatusTypes = [
  { value: "study-permit", label: "Study permit" },
  { value: "work-permit-open", label: "Work permit - open" },
  { value: "work-permit-employer-specific", label: "Work permit - employer-specific" },
  { value: "visitor-record", label: "Visitor record" },
] as const

export function StepBasicInformation() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const hasValidTemporaryStatus = useWatch({ control, name: "hasValidTemporaryStatus" })

  useEffect(() => {
    if (hasValidTemporaryStatus !== "yes") {
      setValue("temporaryStatusType", "", { shouldValidate: true })
      setValue("temporaryStatusExpiryDate", "", { shouldValidate: true })
    }
  }, [hasValidTemporaryStatus, setValue])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s start with a few details about you.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This information is used only to personalize your assessment.
        </p>
      </div>

      <FormField
        control={control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your first name"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="middleName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Middle name (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your middle name"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your last name"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of birth</FormLabel>
            <FormControl>
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Select date of birth"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="citizenshipCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country of citizenship</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. India, Philippines, Nigeria"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="currentProvinceTerritory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Which province or territory do you currently live in?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your current province or territory" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CURRENT_PROVINCE_TERRITORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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
        name="intendedProvinceTerritory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Which province or territory do you intend to live in?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your intended province or territory" />
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

      <FormField
        control={control}
        name="hasValidTemporaryStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you currently hold valid temporary status in Canada?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`temp-status-${option.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} id={`temp-status-${option.value}`} />
                    <span className="text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasValidTemporaryStatus === "yes" && (
        <FormField
          control={control}
          name="temporaryStatusType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What type of status do you hold?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your temporary status type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {temporaryStatusTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasValidTemporaryStatus === "yes" && (
        <FormField
          control={control}
          name="temporaryStatusExpiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is the expiry date of your current status?</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select status expiry date"
                />
              </FormControl>
              <FormDescription>
                This helps us understand timeline urgency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email (optional)</FormLabel>
            <FormControl>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Used only if you want to save or export your results.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="consentAcknowledged"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1">
                <Label className="text-sm font-medium leading-none">
                  I understand this assessment provides informational guidance only and is not legal advice.
                </Label>
                <FormMessage />
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}
