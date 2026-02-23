"use client"

import { useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { CANADIAN_PROVINCES_AND_TERRITORIES } from "@/lib/canada-regions"
import {
  deriveCanadianSkilledYearsBand,
  getCurrentCanadianRoleMonths,
  getQuickAddCanadianRoleCount,
  hasAnyCanadianWorkEntry,
} from "@/lib/work-derived"
import type { AssessmentData } from "@/lib/types"

const occupationCategoryOptions = [
  { value: "business-management", label: "Business / Management" },
  { value: "it-software-data", label: "IT / Software / Data" },
  { value: "engineering", label: "Engineering" },
  { value: "healthcare", label: "Healthcare" },
  { value: "trades", label: "Trades" },
  { value: "hospitality-tourism", label: "Hospitality / Tourism" },
  { value: "sales-marketing", label: "Sales / Marketing" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
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

const jobOfferTenureOptions = [
  { value: "lt-6-months", label: "Less than 6 months" },
  { value: "6-12-months", label: "6-12 months" },
  { value: "1-2-years", label: "1-2 years" },
  { value: "2-plus-years", label: "2+ years" },
]

const teerOptions = [
  { value: "0", label: "TEER 0" },
  { value: "1", label: "TEER 1" },
  { value: "2", label: "TEER 2" },
  { value: "3", label: "TEER 3" },
  { value: "4", label: "TEER 4" },
  { value: "5", label: "TEER 5" },
]

const detailedEmploymentTypeOptions = [
  { value: "employee", label: "Employee" },
  { value: "self-employed", label: "Self-employed" },
  { value: "contractor", label: "Contractor" },
]

const workHistoryRadioLabelClass =
  "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"

export function StepWorkHistory() {
  const { control, setValue, formState } = useFormContext<AssessmentData>()
  const { fields, append, remove } = useFieldArray({ control, name: "jobs" })
  const {
    fields: detailedWorkRoleFields,
    append: appendDetailedWorkRole,
    remove: removeDetailedWorkRole,
  } = useFieldArray({ control, name: "workRoles" })

  const mostRecentJobPresent = useWatch({ control, name: "mostRecentJobPresent" })
  const canObtainEmployerLetter = useWatch({ control, name: "canObtainEmployerLetter" })
  const hasCanadianJobOffer = useWatch({ control, name: "hasCanadianJobOffer" })
  const occupationCategory = useWatch({ control, name: "occupationCategory" })
  const countryOfWork = useWatch({ control, name: "countryOfWork" })
  const mostRecentJobStart = useWatch({ control, name: "mostRecentJobStart" })
  const mostRecentJobEnd = useWatch({ control, name: "mostRecentJobEnd" })
  const paidWorkStatus = useWatch({ control, name: "paidWorkStatus" })
  const hoursPerWeekRange = useWatch({ control, name: "hoursPerWeekRange" })
  const has12MonthsCanadaSkilled = useWatch({ control, name: "has12MonthsCanadaSkilled" })
  const jobDuties = useWatch({ control, name: "jobDuties" }) ?? ""
  const hasCanadianTradeCertificate = useWatch({ control, name: "hasCanadianTradeCertificate" })
  const watchedJobs = useWatch({ control, name: "jobs" })
  const watchedWorkRoles = useWatch({ control, name: "workRoles" })
  const jobDutiesCount = jobDuties.length
  const hasCanadianWorkEntries = hasAnyCanadianWorkEntry({
    countryOfWork,
    mostRecentJobStart,
    mostRecentJobEnd,
    mostRecentJobPresent,
    jobs: watchedJobs ?? [],
    paidWorkStatus,
    hoursPerWeekRange,
  })
  const currentCanadianRoleMonths = getCurrentCanadianRoleMonths({
    countryOfWork,
    mostRecentJobStart,
    mostRecentJobEnd,
    mostRecentJobPresent,
    jobs: watchedJobs ?? [],
    paidWorkStatus,
    hoursPerWeekRange,
  })
  const quickAddCanadianRoleCount = getQuickAddCanadianRoleCount({
    countryOfWork,
    mostRecentJobStart,
    mostRecentJobEnd,
    mostRecentJobPresent,
    jobs: watchedJobs ?? [],
    paidWorkStatus,
    hoursPerWeekRange,
  })
  const quickAddGateError =
    typeof (formState.errors.jobs as { message?: string } | undefined)?.message === "string"
      ? (formState.errors.jobs as { message?: string }).message
      : ""

  useEffect(() => {
    if (hasCanadianJobOffer !== "yes") {
      setValue("jobOfferProvinceTerritory", "", { shouldValidate: true })
      setValue("jobOfferTitle", "", { shouldValidate: true })
      setValue("jobOfferEmployerName", "", { shouldValidate: true })
      setValue("jobOfferCity", "", { shouldValidate: true })
      setValue("jobOfferFullTime", "", { shouldValidate: true })
      setValue("jobOfferPermanent", "", { shouldValidate: true })
      setValue("jobOfferCompensation", "", { shouldValidate: true })
      setValue("jobOfferCompensationType", "", { shouldValidate: true })
      setValue("jobOfferTenure", "", { shouldValidate: true })
      setValue("employerWillSupportPNP", "", { shouldValidate: true })
      setValue("jobOfferNonSeasonal", "", { shouldValidate: true })
      setValue("jobOfferSupportType", "", { shouldValidate: true })
      setValue("jobOfferSupportBasis", "", { shouldValidate: true })
      setValue("jobOfferIntendedDurationMonths", null, { shouldValidate: true })
      setValue("jobOfferMeetsValidOfferDefinition", "", { shouldValidate: true })
    }
  }, [hasCanadianJobOffer, setValue])

  useEffect(() => {
    if (occupationCategory !== "other") {
      setValue("occupationCategoryOtherRole", "", { shouldValidate: true })
    }
  }, [occupationCategory, setValue])

  useEffect(() => {
    if (!hasCanadianWorkEntries) {
      setValue("canadianWorkAuthorizedAll", "", { shouldValidate: true })
      setValue("has12MonthsCanadaSkilled", "", { shouldValidate: true })
    }
  }, [hasCanadianWorkEntries, setValue])

  useEffect(() => {
    if (hasCanadianTradeCertificate !== "yes") {
      setValue("tradeCertificateIssuingAuthority", "", { shouldValidate: true })
      setValue("tradeCertificateTrade", "", { shouldValidate: true })
      setValue("tradeCertificateIssueDate", "", { shouldValidate: true })
    }
  }, [hasCanadianTradeCertificate, setValue])

  useEffect(() => {
    setValue(
      "derivedCanadianSkilledYearsBand",
      deriveCanadianSkilledYearsBand({
        countryOfWork,
        mostRecentJobStart,
        mostRecentJobEnd,
        mostRecentJobPresent,
        jobs: watchedJobs ?? [],
        paidWorkStatus,
        hoursPerWeekRange,
      }),
      { shouldValidate: false },
    )
  }, [
    countryOfWork,
    mostRecentJobStart,
    mostRecentJobEnd,
    mostRecentJobPresent,
    watchedJobs,
    paidWorkStatus,
    hoursPerWeekRange,
    setValue,
  ])

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
        name="foreignSkilledYears"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How many full years of skilled work experience outside Canada do you have?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your years of experience" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {["0", "1", "2", "3", "4", "5+"].map((years) => (
                  <SelectItem key={years} value={years}>
                    {years}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasCanadianWorkEntries && (
        <FormField
          control={control}
          name="has12MonthsCanadaSkilled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Have you completed at least 12 months of skilled work in Canada (full-time or equivalent)?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ].map((o) => (
                    <Label
                      key={o.value}
                      htmlFor={`can-work-12m-gate-${o.value}`}
                      className={workHistoryRadioLabelClass}
                    >
                      <RadioGroupItem value={o.value} id={`can-work-12m-gate-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Used to assess Canadian work experience programs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianWorkEntries && (
        <FormField
          control={control}
          name="canadianWorkAuthorizedAll"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Was all of your Canadian work experience performed with valid work authorization (a valid permit/status that allowed you to work)?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ].map((o) => (
                    <Label
                      key={o.value}
                      htmlFor={`can-work-authorized-all-${o.value}`}
                      className={workHistoryRadioLabelClass}
                    >
                      <RadioGroupItem value={o.value} id={`can-work-authorized-all-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Used to assess how your Canadian work experience is evaluated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
        name="hasCanadianJobOffer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you currently have a job offer from a Canadian employer?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex gap-4"
              >
                {yesNoNotSureOptions.map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`canadian-job-offer-${o.value}`}
                    className={workHistoryRadioLabelClass}
                  >
                    <RadioGroupItem value={o.value} id={`canadian-job-offer-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferProvinceTerritory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which province or territory is the job located in?</FormLabel>
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

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Welder, Data Analyst" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferEmployerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer name</FormLabel>
              <FormControl>
                <Input placeholder="Enter employer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job location (city)</FormLabel>
              <FormControl>
                <Input placeholder="Enter city" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferFullTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is the job full-time (30+ hours/week)?</FormLabel>
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
                    <Label key={o.value} htmlFor={`job-offer-full-time-${o.value}`} className={workHistoryRadioLabelClass}>
                      <RadioGroupItem value={o.value} id={`job-offer-full-time-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferPermanent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is the job permanent (no end date)?</FormLabel>
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
                    <Label key={o.value} htmlFor={`job-offer-permanent-${o.value}`} className={workHistoryRadioLabelClass}>
                      <RadioGroupItem value={o.value} id={`job-offer-permanent-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="jobOfferCompensation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly wage or annual salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>Enter hourly wage or annual salary.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="jobOfferCompensationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compensation type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferTenure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How long have you worked for this employer?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jobOfferTenureOptions.map((o) => (
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

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="employerWillSupportPNP"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is your employer willing to support a PNP application?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  {yesNoNotSureOptions.map((o) => (
                    <Label
                      key={o.value}
                      htmlFor={`employer-pnp-support-${o.value}`}
                      className={workHistoryRadioLabelClass}
                    >
                      <RadioGroupItem value={o.value} id={`employer-pnp-support-${o.value}`} />
                      <span className="text-foreground">{o.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferNonSeasonal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is this offer non-seasonal?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not-sure", label: "Not sure" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`job-offer-non-seasonal-${option.value}`}
                      className={workHistoryRadioLabelClass}
                    >
                      <RadioGroupItem value={option.value} id={`job-offer-non-seasonal-${option.value}`} />
                      <span className="text-foreground">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferSupportType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How is this offer supported?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select support type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lmia">LMIA-supported</SelectItem>
                  <SelectItem value="lmia-exempt">LMIA-exempt basis</SelectItem>
                  <SelectItem value="unknown">Not sure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferSupportBasis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LMIA number or exemption basis</FormLabel>
              <FormControl>
                <Input placeholder="e.g. LMIA #, C12 exemption, intra-company transfer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferIntendedDurationMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intended duration (months)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) => {
                    const next = event.target.value.trim()
                    field.onChange(next ? Number.parseInt(next, 10) : null)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasCanadianJobOffer === "yes" && (
        <FormField
          control={control}
          name="jobOfferMeetsValidOfferDefinition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Based on your details, does this meet a valid offer definition for EE?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not-sure", label: "Not sure" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`job-offer-valid-definition-${option.value}`}
                      className={workHistoryRadioLabelClass}
                    >
                      <RadioGroupItem value={option.value} id={`job-offer-valid-definition-${option.value}`} />
                      <span className="text-foreground">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="occupationCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {occupationCategoryOptions.map((o) => (
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

      {occupationCategory === "other" && (
        <FormField
          control={control}
          name="occupationCategoryOtherRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please specify your role</FormLabel>
              <FormControl>
                <Input placeholder="Enter your role" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="jobDuties"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-end justify-between gap-3">
              <FormLabel>Briefly describe your main job duties</FormLabel>
              <span
                id="job-duties-counter"
                className={`text-xs ${jobDutiesCount >= 400 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {jobDutiesCount}/400
              </span>
            </div>
            <FormControl>
              <Textarea
                placeholder="Example: Lead product roadmap planning, gather requirements from stakeholders, write PRDs, coordinate with engineering and design, analyze user feedback, and prioritize features for release."
                rows={4}
                {...field}
                value={field.value ?? ""}
                onChange={(event) => {
                  const next = event.target.value.slice(0, 400)
                  field.onChange(next)
                }}
                aria-describedby="job-duties-helper job-duties-counter"
              />
            </FormControl>
            <FormDescription id="job-duties-helper">
              2-4 sentences. This helps us match you to the correct immigration program.
            </FormDescription>
            {jobDutiesCount >= 400 && (
              <p className="text-xs text-destructive">Maximum 400 characters reached.</p>
            )}
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
        <FormLabel>Detailed roles for Express Entry (recommended)</FormLabel>
        <FormDescription>
          Add each role you want counted for eligibility. This powers deterministic Express Entry checks.
        </FormDescription>

        {detailedWorkRoleFields.map((field, index) => {
          const roleCountry = (watchedWorkRoles?.[index]?.country ?? "").trim().toLowerCase()
          const rolePresent = watchedWorkRoles?.[index]?.present === true
          const showCanadianRoleFields = roleCountry === "canada" || roleCountry === "ca" || roleCountry === "can"

          return (
            <Card key={field.id} className="relative">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Detailed role #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDetailedWorkRole(index)}
                    className="size-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Remove detailed role</span>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`workRoles.${index}.title`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Role title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineer" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.employerName`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Employer name</FormLabel>
                        <FormControl>
                          <Input placeholder="Employer" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`workRoles.${index}.noc2021Code`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>NOC 2021 code (5-digit)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 21231" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.teer`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>TEER</FormLabel>
                        <Select onValueChange={roleField.onChange} value={roleField.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select TEER" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teerOptions.map((option) => (
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
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField
                    control={control}
                    name={`workRoles.${index}.country`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Canada" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.province`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Province (if Canada)</FormLabel>
                        <FormControl>
                          <Input placeholder="Province" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.city`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`workRoles.${index}.startDate`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input type="date" {...roleField} value={roleField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.endDate`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <Input type="date" {...roleField} value={roleField.value ?? ""} disabled={rolePresent} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`workRoles.${index}.present`}
                  render={({ field: roleField }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={!!roleField.value}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true
                            roleField.onChange(isChecked)
                            if (isChecked) {
                              setValue(`workRoles.${index}.endDate`, "")
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Present</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`workRoles.${index}.hoursPerWeek`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Hours per week</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="80"
                            step="0.5"
                            value={roleField.value ?? ""}
                            onChange={(event) => {
                              const next = event.target.value.trim()
                              roleField.onChange(next ? Number.parseFloat(next) : null)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`workRoles.${index}.employmentType`}
                    render={({ field: roleField }) => (
                      <FormItem>
                        <FormLabel>Employment type</FormLabel>
                        <Select onValueChange={roleField.onChange} value={roleField.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {detailedEmploymentTypeOptions.map((option) => (
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
                </div>

                <FormField
                  control={control}
                  name={`workRoles.${index}.paid`}
                  render={({ field: roleField }) => (
                    <FormItem>
                      <FormLabel>Was this role paid?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => roleField.onChange(value === "yes")}
                          value={roleField.value === true ? "yes" : roleField.value === false ? "no" : ""}
                          className="flex gap-4"
                        >
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].map((option) => (
                            <Label key={option.value} htmlFor={`work-role-paid-${index}-${option.value}`} className={workHistoryRadioLabelClass}>
                              <RadioGroupItem value={option.value} id={`work-role-paid-${index}-${option.value}`} />
                              <span className="text-foreground">{option.label}</span>
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
                  name={`workRoles.${index}.isSkilledTradeRole`}
                  render={({ field: roleField }) => (
                    <FormItem>
                      <FormLabel>Is this role a skilled trade occupation?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => roleField.onChange(value === "yes")}
                          value={roleField.value === true ? "yes" : roleField.value === false ? "no" : ""}
                          className="flex gap-4"
                        >
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].map((option) => (
                            <Label key={option.value} htmlFor={`work-role-trade-${index}-${option.value}`} className={workHistoryRadioLabelClass}>
                              <RadioGroupItem value={option.value} id={`work-role-trade-${index}-${option.value}`} />
                              <span className="text-foreground">{option.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showCanadianRoleFields && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormField
                      control={control}
                      name={`workRoles.${index}.wasAuthorizedInCanada`}
                      render={({ field: roleField }) => (
                        <FormItem>
                          <FormLabel>Authorized to work in Canada?</FormLabel>
                          <Select onValueChange={roleField.onChange} value={roleField.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="not-sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`workRoles.${index}.wasFullTimeStudent`}
                      render={({ field: roleField }) => (
                        <FormItem>
                          <FormLabel>Full-time student during period?</FormLabel>
                          <Select onValueChange={roleField.onChange} value={roleField.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="not-sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`workRoles.${index}.physicallyInCanada`}
                      render={({ field: roleField }) => (
                        <FormItem>
                          <FormLabel>Physically in Canada while working?</FormLabel>
                          <Select onValueChange={roleField.onChange} value={roleField.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="not-sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendDetailedWorkRole({
              id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              noc2021Code: "",
              teer: "",
              title: "",
              employerName: "",
              country: "",
              province: "",
              city: "",
              startDate: "",
              endDate: "",
              present: false,
              hoursPerWeek: null,
              hoursVaried: false,
              paid: true,
              employmentType: "",
              isSkilledTradeRole: false,
              wasAuthorizedInCanada: "",
              authorizationType: "",
              authorizationValidFrom: "",
              authorizationValidTo: "",
              wasFullTimeStudent: "",
              physicallyInCanada: "",
              hasOverlapWithOtherRoles: "",
            })
          }
          className="w-fit gap-1.5"
        >
          <Plus className="size-3.5" />
          Add detailed role
        </Button>
      </div>

      <FormField
        control={control}
        name="hasCanadianTradeCertificate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have a Canadian certificate of qualification (for skilled trades)?</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <Label key={option.value} htmlFor={`trade-certificate-${option.value}`} className={workHistoryRadioLabelClass}>
                    <RadioGroupItem value={option.value} id={`trade-certificate-${option.value}`} />
                    <span className="text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasCanadianTradeCertificate === "yes" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={control}
            name="tradeCertificateIssuingAuthority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing authority</FormLabel>
                <FormControl>
                  <Input placeholder="Province/territory authority" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tradeCertificateTrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trade</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Electrician" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tradeCertificateIssueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <FormLabel>Quick-add previous roles (optional)</FormLabel>
        {(has12MonthsCanadaSkilled === "yes" || has12MonthsCanadaSkilled === "not_sure") && (
          <FormDescription>
            If you&apos;ve had Canadian roles before, add them here so we can estimate your Canadian experience more accurately.
          </FormDescription>
        )}
        {has12MonthsCanadaSkilled === "not_sure" && (
          <p className="text-xs text-amber-700">
            Add your Canadian roles so we can estimate whether you reach 12 months.
          </p>
        )}
        {has12MonthsCanadaSkilled === "yes" && currentCanadianRoleMonths < 12 && quickAddCanadianRoleCount === 0 && quickAddGateError && (
          <p className="text-xs text-destructive">{quickAddGateError}</p>
        )}
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
