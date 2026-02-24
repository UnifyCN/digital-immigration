"use client"

import { useEffect, useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AssessmentData } from "@/lib/types"

const languageTestTypeOptions = [
  { value: "ielts-general-training", label: "IELTS (General Training)" },
  { value: "celpip-general", label: "CELPIP (General)" },
  { value: "tef-canada", label: "TEF Canada" },
  { value: "tcf-canada", label: "TCF Canada" },
  { value: "pte-core", label: "PTE Core" },
]

const languageTestStreamOptions = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "n/a", label: "N/A" },
]

export function StepLanguageCRS() {
  const { control, setValue } = useFormContext<AssessmentData>()
  const languageTestStatus = useWatch({ control, name: "languageTestStatus" })
  const languageTests = useWatch({ control, name: "languageTests" }) ?? []
  const [showLanguageTestRequired, setShowLanguageTestRequired] = useState(false)
  const {
    fields: languageTestFields,
    append: appendLanguageTest,
    remove: removeLanguageTest,
  } = useFieldArray({
    control,
    name: "languageTests",
  })

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

  useEffect(() => {
    if (languageTestStatus === "valid" && languageTestFields.length === 0) {
      setShowLanguageTestRequired(true)
      appendLanguageTest({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        isPrimary: true,
        testType: "",
        stream: "",
        testDate: "",
        registrationNumber: "",
        scores: { listening: "", reading: "", writing: "", speaking: "" },
      })
      return
    }
    setShowLanguageTestRequired(false)
  }, [appendLanguageTest, languageTestFields.length, languageTestStatus])

  useEffect(() => {
    if (languageTestStatus !== "valid" || languageTests.length === 0) return
    const primary = languageTests.find((test) => test?.isPrimary) ?? languageTests[0]
    if (!primary) return

    setValue("languageScores.listening", primary.scores?.listening ?? "", { shouldValidate: true })
    setValue("languageScores.reading", primary.scores?.reading ?? "", { shouldValidate: true })
    setValue("languageScores.writing", primary.scores?.writing ?? "", { shouldValidate: true })
    setValue("languageScores.speaking", primary.scores?.speaking ?? "", { shouldValidate: true })
  }, [languageTestStatus, languageTests, setValue])

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
        <div className="flex flex-col gap-3">
          <FormLabel>Structured language tests for deterministic eligibility</FormLabel>
          {languageTestFields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Test #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLanguageTest(index)}
                    className="h-7 px-2 text-xs"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField
                    control={control}
                    name={`languageTests.${index}.testType`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Test type</FormLabel>
                        <Select onValueChange={testField.onChange} value={testField.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language test type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languageTestTypeOptions.map((option) => (
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
                    name={`languageTests.${index}.stream`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Stream</FormLabel>
                        <Select onValueChange={testField.onChange} value={testField.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select stream" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languageTestStreamOptions.map((option) => (
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
                    name={`languageTests.${index}.testDate`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Test date</FormLabel>
                        <FormControl>
                          <Input type="date" {...testField} value={testField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`languageTests.${index}.registrationNumber`}
                  render={({ field: testField }) => (
                    <FormItem>
                      <FormLabel>TRF / registration number (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Reference number" {...testField} value={testField.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name={`languageTests.${index}.scores.listening`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Listening</FormLabel>
                        <FormControl>
                          <Input {...testField} value={testField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`languageTests.${index}.scores.reading`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Reading</FormLabel>
                        <FormControl>
                          <Input {...testField} value={testField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`languageTests.${index}.scores.writing`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Writing</FormLabel>
                        <FormControl>
                          <Input {...testField} value={testField.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`languageTests.${index}.scores.speaking`}
                    render={({ field: testField }) => (
                      <FormItem>
                        <FormLabel>Speaking</FormLabel>
                        <FormControl>
                          <Input {...testField} value={testField.value ?? ""} />
                        </FormControl>
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
            className="w-fit"
            onClick={() =>
              appendLanguageTest({
                id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                isPrimary: languageTestFields.length === 0,
                testType: "",
                stream: "",
                testDate: "",
                registrationNumber: "",
                scores: { listening: "", reading: "", writing: "", speaking: "" },
              })
            }
          >
            Add language test
          </Button>
          {showLanguageTestRequired && (
            <p className="text-xs text-muted-foreground">At least one test is required.</p>
          )}
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
