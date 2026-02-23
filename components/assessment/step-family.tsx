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
  const spouseAccompanying = useWatch({ control, name: "spouseAccompanying" })
  const closeRelativeInCanada = useWatch({ control, name: "closeRelativeInCanada" })
  const hasCloseRelativeInCanada = useWatch({ control, name: "hasCloseRelativeInCanada" })
  const hasEligibleSiblingInCanada = useWatch({ control, name: "hasEligibleSiblingInCanada" })
  const fundsExemptByValidJobOffer = useWatch({ control, name: "fundsExemptByValidJobOffer" })
  const showPartner = maritalStatus === "married" || maritalStatus === "common-law"
  const isSponsorshipGoal = primaryGoal === "sponsorship"
  const isPrFlow = primaryGoal === "pr" || primaryGoal === "not-sure"

  useEffect(() => {
    if (!showPartner) {
      setValue("spouseAccompanying", "", { shouldValidate: true })
      setValue("spouseLocation", "", { shouldValidate: true })
      setValue("spouseEducationLevel", "", { shouldValidate: true })
      setValue("spouseForeignEducationHasEca", "", { shouldValidate: true })
      setValue("spouseEcaEquivalency", "", { shouldValidate: true })
      setValue("spouseEcaIssueDate", "", { shouldValidate: true })
      setValue("spouseLanguageTestType", "", { shouldValidate: true })
      setValue("spouseLanguageTestDate", "", { shouldValidate: true })
      setValue("spouseLanguageTestStream", "", { shouldValidate: true })
      setValue("spouseLanguageScores", { listening: "", reading: "", writing: "", speaking: "" }, { shouldValidate: true })
      setValue("spouseCanadianWorkMonths", null, { shouldValidate: true })
      setValue("spouseCanadianWorkStartDate", "", { shouldValidate: true })
      setValue("spouseCanadianWorkEndDate", "", { shouldValidate: true })
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
    if (hasEligibleSiblingInCanada !== "yes") {
      setValue("siblingRelationshipType", "", { shouldValidate: true })
      setValue("siblingProvinceTerritory", "", { shouldValidate: true })
      setValue("siblingStatus", "", { shouldValidate: true })
      setValue("siblingAge18OrOlder", "", { shouldValidate: true })
      setValue("siblingLivesInCanada", "", { shouldValidate: true })
    }
  }, [hasEligibleSiblingInCanada, setValue])

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

      {showPartner && spouseAccompanying === "yes-accompanying" && (
        <>
          <FormField
            control={control}
            name="spouseEducationLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spouse highest education level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { value: "none", label: "No formal education" },
                      { value: "high-school", label: "High school diploma" },
                      { value: "one-year-diploma", label: "One-year diploma or certificate" },
                      { value: "two-year-diploma", label: "Two-year diploma" },
                      { value: "bachelors", label: "Bachelor's degree" },
                      { value: "two-or-more-degrees", label: "Two or more degrees" },
                      { value: "masters", label: "Master's degree" },
                      { value: "phd", label: "Doctoral degree (PhD)" },
                    ].map((option) => (
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

          <FormField
            control={control}
            name="spouseForeignEducationHasEca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>If spouse education is foreign, do they have ECA?</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        value={option.value}
                        id={`spouse-eca-${option.value}`}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="spouseLanguageTestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse language test type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ielts-general-training" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="spouseLanguageTestDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse language test date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="spouseLanguageTestStream"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse test stream</FormLabel>
                  <FormControl>
                    <Input placeholder="general" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="spouseLanguageScores.listening"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse listening score</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="spouseLanguageScores.reading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse reading score</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="spouseLanguageScores.writing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse writing score</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="spouseLanguageScores.speaking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse speaking score</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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

      <FormField
        control={control}
        name="hasEligibleSiblingInCanada"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Do you (or your spouse) have a sibling in Canada who is 18+, a citizen/PR, and living in Canada?
            </FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "not-sure", label: "Not sure" },
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    value={option.value}
                    id={`eligible-sibling-${option.value}`}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasEligibleSiblingInCanada === "yes" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="siblingRelationshipType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sibling relationship type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="applicant_sibling">Your sibling</SelectItem>
                    <SelectItem value="spouse_sibling">Spouse's sibling</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="siblingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sibling status in Canada</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="pr">Permanent resident</SelectItem>
                    <SelectItem value="not-sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="siblingProvinceTerritory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sibling province/territory</FormLabel>
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
          <FormField
            control={control}
            name="siblingAge18OrOlder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sibling is 18+?</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        value={option.value}
                        id={`sibling-age-${option.value}`}
                        label={option.label}
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
            name="siblingLivesInCanada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sibling currently living in Canada?</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        value={option.value}
                        id={`sibling-lives-${option.value}`}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {isPrFlow && (
        <>
          <Separator />
          <FormField
            control={control}
            name="fundsFamilySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proof-of-funds family size (include non-accompanying spouse/children)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="15"
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
          <FormField
            control={control}
            name="fundsExemptByValidJobOffer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Are you exempt from funds due to valid job offer/current authorization?</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        value={option.value}
                        id={`funds-exempt-${option.value}`}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {fundsExemptByValidJobOffer !== "yes" && (
            <FormField
              control={control}
              name="settlementFundsCad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current available settlement funds (CAD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const next = event.target.value.trim()
                        field.onChange(next ? Number.parseFloat(next) : null)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
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
