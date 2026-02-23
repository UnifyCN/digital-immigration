"use client"

import { useEffect } from "react"
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
import { CANADIAN_PROVINCES_AND_TERRITORIES } from "@/lib/canada-regions"
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

const fieldOfStudyOptions = [
  { value: "business", label: "Business" },
  { value: "it-computer-science", label: "IT / Computer Science" },
  { value: "engineering", label: "Engineering" },
  { value: "health", label: "Health" },
  { value: "trades", label: "Trades" },
  { value: "arts-social-sciences", label: "Arts / Social Sciences" },
  { value: "other", label: "Other" },
]

const CURRENT_YEAR = new Date().getFullYear()
const MAX_CREDENTIALS = 5
const ecaIssuers = [
  { value: "wes", label: "WES" },
  { value: "iqas", label: "IQAS" },
  { value: "icas", label: "ICAS" },
  { value: "ces", label: "CES" },
  { value: "mcc", label: "MCC" },
  { value: "pebc", label: "PEBC" },
  { value: "other", label: "Other" },
]

export function StepEducation() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const ecaStatus = useWatch({ control, name: "ecaStatus" })
  const hasMultipleCredentials = useWatch({ control, name: "hasMultipleCredentials" })
  const educationCompletedInCanada = useWatch({ control, name: "educationCompletedInCanada" })
  const { fields, append, remove } = useFieldArray({
    control,
    name: "additionalCredentials",
  })
  const {
    fields: eeCredentialFields,
    append: appendEeCredential,
    remove: removeEeCredential,
  } = useFieldArray({
    control,
    name: "educationCredentials",
  })
  const isMaxCredentialsReached = fields.length >= MAX_CREDENTIALS

  useEffect(() => {
    if (educationCompletedInCanada !== "yes") {
      setValue("canadianEducationProvinceTerritory", "", { shouldValidate: true })
      setValue("canadianEducationPublicInstitution", "", { shouldValidate: true })
    }
  }, [educationCompletedInCanada, setValue])

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
        name="fieldOfStudy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field of study for your highest credential</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field of study" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {fieldOfStudyOptions.map((option) => (
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
        name="educationCompletedInCanada"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Was any of your education completed in Canada?</FormLabel>
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
                  <Label
                    key={o.value}
                    htmlFor={`education-completed-canada-${o.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                  >
                    <RadioGroupItem value={o.value} id={`education-completed-canada-${o.value}`} />
                    <span className="text-foreground">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {educationCompletedInCanada === "yes" && (
        <FormField
          control={control}
          name="canadianEducationProvinceTerritory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which province or territory was it completed in?</FormLabel>
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

      {educationCompletedInCanada === "yes" && (
        <FormField
          control={control}
          name="canadianEducationPublicInstitution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Was it completed at a public institution?</FormLabel>
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
                      htmlFor={`canadian-public-institution-${o.value}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    >
                      <RadioGroupItem value={o.value} id={`canadian-public-institution-${o.value}`} />
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

      <div className="flex flex-col gap-3">
        <FormLabel>Detailed credential records for Express Entry</FormLabel>
        <FormDescription>
          Add each credential you want counted. Foreign credentials need ECA details.
        </FormDescription>

        {eeCredentialFields.map((item, index) => (
          <Card key={item.id} className="relative">
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  EE Credential #{index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEeCredential(index)}
                  className="size-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Remove EE credential</span>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.level`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
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
                  name={`educationCredentials.${index}.country`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Canada, India" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.isCanadianCredential`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is this a Canadian credential?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={`ee-credential-canadian-${index}-${option.value}`}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                            >
                              <RadioGroupItem value={option.value} id={`ee-credential-canadian-${index}-${option.value}`} />
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
                  name={`educationCredentials.${index}.issueDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue / graduation date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.institutionName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution name</FormLabel>
                      <FormControl>
                        <Input placeholder="Institution" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.programLengthMonths`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program length (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
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
              </div>

              <FormField
                control={control}
                name={`educationCredentials.${index}.ecaIssuer`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ECA issuer (for foreign credentials)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select issuer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ecaIssuers.map((issuer) => (
                          <SelectItem key={issuer.value} value={issuer.value}>
                            {issuer.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.ecaReferenceNumber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ECA reference number</FormLabel>
                      <FormControl>
                        <Input placeholder="Reference" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.ecaIssueDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ECA issue date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`educationCredentials.${index}.ecaEquivalency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ECA equivalency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select equivalency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendEeCredential({
              id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              level: "",
              country: "",
              isCanadianCredential: "",
              issueDate: "",
              institutionName: "",
              programLengthMonths: null,
              studyLoad: "",
              startDate: "",
              endDate: "",
              physicallyInCanada: "",
              distanceLearningPercent: null,
              ecaIssuer: "",
              ecaOtherIssuer: "",
              ecaReferenceNumber: "",
              ecaIssueDate: "",
              ecaEquivalency: "",
            })
          }
          className="w-fit gap-1.5"
        >
          + Add EE credential
        </Button>
      </div>

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
