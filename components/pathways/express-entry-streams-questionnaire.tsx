"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { AssessmentData, FstJobOfferEmployer } from "@/lib/types"
import type { FollowUpQuestionSpec } from "@/lib/immigration/expressEntry/types"
import { ExpressEntryNocInput } from "@/components/pathways/express-entry-noc-input"

type ExpressEntryStreamsQuestionnaireProps = {
  questions: FollowUpQuestionSpec[]
  assessment: AssessmentData
  onChange: (next: AssessmentData) => void
}

function ensureOffer(offers: FstJobOfferEmployer[], index: number): FstJobOfferEmployer[] {
  const next = [...offers]
  while (next.length <= index && next.length < 2) {
    next.push({
      id: `fst-offer-${next.length + 1}`,
      employerName: "",
      province: "",
      noc2021Code: "",
      paid: "",
      fullTime: "",
      continuous: "",
      nonSeasonal: "",
      hoursPerWeek: null,
      durationMonths: null,
    })
  }
  return next
}

function isCompleteFstOfferEmployer(offer: FstJobOfferEmployer | undefined): boolean {
  if (!offer) return false
  return Boolean(
    offer.employerName &&
      offer.noc2021Code &&
      offer.paid &&
      offer.fullTime &&
      offer.continuous &&
      offer.hoursPerWeek !== null &&
      offer.durationMonths !== null,
  )
}

function parseFstEmployerIndex(fieldKey: string): number | null {
  const bracketMatch = fieldKey.match(/^fst\.offer\.employer\[(\d+)\]$/)
  if (bracketMatch) return Number.parseInt(bracketMatch[1], 10)

  const dotMatch = fieldKey.match(/^fst\.offer\.employer\.(\d+)$/)
  if (dotMatch) {
    const oneBased = Number.parseInt(dotMatch[1], 10)
    return Number.isFinite(oneBased) ? Math.max(0, oneBased - 1) : null
  }

  return null
}

function ensurePrimaryLanguageTest(tests: AssessmentData["languageTests"] | undefined): AssessmentData["languageTests"] {
  const next = [...(tests ?? [])]
  if (!next[0]) {
    next[0] = {
      id: "primary-follow-up",
      isPrimary: true,
      testType: "",
      stream: "",
      testDate: "",
      registrationNumber: "",
      scores: { listening: "", reading: "", writing: "", speaking: "" },
    }
  }
  return next
}

function getQuestionValue(question: FollowUpQuestionSpec, assessment: AssessmentData): string | boolean {
  if (question.fieldKey === "shared.intentOutsideQuebec") return assessment.expressEntryIntentOutsideQuebec
  if (question.fieldKey === "auth.currentlyAuthorizedToWorkInCanada") return assessment.currentlyAuthorizedToWorkInCanada
  if (question.fieldKey === "language.primary.testType") return assessment.languageTests?.[0]?.testType ?? ""
  if (question.fieldKey === "language.primary.testDate") return assessment.languageTests?.[0]?.testDate ?? ""
  if (question.fieldKey === "language.primary.stream") return assessment.languageTests?.[0]?.stream ?? ""
  if (question.fieldKey === "language.primary.scores") {
    const scores = assessment.languageTests?.[0]?.scores
    return Boolean(scores?.listening && scores?.reading && scores?.writing && scores?.speaking)
  }
  if (question.fieldKey === "funds.familySize") return assessment.fundsFamilySize?.toString() ?? ""
  if (question.fieldKey === "funds.available") return assessment.settlementFundsCad?.toString() ?? ""
  if (question.fieldKey === "jobOffer.validity") return assessment.jobOfferMeetsValidOfferDefinition
  if (question.fieldKey === "fsw.primaryOccupationRoleId") return assessment.fswPrimaryOccupationRoleId
  if (question.fieldKey === "fst.offer.path") {
    if (assessment.hasCanadianTradeCertificate === "yes") return "certificate"
    if ((assessment.fstJobOfferEmployers ?? []).length > 0) return "job-offer"
    return ""
  }
  if (question.fieldKey.startsWith("fst.offer.employer")) {
    const offers = assessment.fstJobOfferEmployers ?? []
    const targetIndex = parseFstEmployerIndex(question.fieldKey)
    if (targetIndex !== null) {
      return isCompleteFstOfferEmployer(offers[targetIndex])
    }
    return offers.length > 0 && offers.every((offer) => isCompleteFstOfferEmployer(offer))
  }

  if (question.roleId) {
    const role = assessment.workRoles?.find((item) => item.id === question.roleId)
    if (!role) return ""

    if (question.fieldKey.endsWith(".nocCode")) return role.noc2021Code ?? ""
    if (question.fieldKey.endsWith(".nocDutiesMatchConfirmed")) return role.nocDutiesMatchConfirmed === true
    if (question.fieldKey.endsWith(".startDate")) return role.startDate ?? ""
    if (question.fieldKey.endsWith(".endDate")) return role.endDate ?? ""
    if (question.fieldKey.endsWith(".hoursPerWeek")) return role.hoursPerWeek?.toString() ?? ""
    if (question.fieldKey.endsWith(".paid")) return typeof role.paid === "boolean" ? (role.paid ? "yes" : "no") : ""
    if (question.fieldKey.endsWith(".employmentType")) return role.employmentType ?? ""
    if (question.fieldKey.endsWith(".wasAuthorizedInCanada")) return role.wasAuthorizedInCanada ?? ""
    if (question.fieldKey.endsWith(".wasFullTimeStudent")) return role.wasFullTimeStudent ?? ""
    if (question.fieldKey.endsWith(".physicallyInCanada")) return role.physicallyInCanada ?? ""
    if (question.fieldKey.endsWith(".qualifiedToPracticeInCountry")) return role.qualifiedToPracticeInCountry ?? ""
  }

  return ""
}

function updateRole(
  assessment: AssessmentData,
  roleId: string,
  updater: (role: AssessmentData["workRoles"][number]) => AssessmentData["workRoles"][number],
): AssessmentData {
  const roles = assessment.workRoles ?? []
  return {
    ...assessment,
    workRoles: roles.map((role) => (role.id === roleId ? updater(role) : role)),
  }
}

function isAnswered(question: FollowUpQuestionSpec, assessment: AssessmentData): boolean {
  const value = getQuestionValue(question, assessment)
  if (typeof value === "boolean") return value
  return String(value).trim().length > 0
}

export function ExpressEntryStreamsQuestionnaire({ questions, assessment, onChange }: ExpressEntryStreamsQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    if (currentIndex >= questions.length) {
      setCurrentIndex(Math.max(0, questions.length - 1))
    }
  }, [currentIndex, questions.length])

  const currentQuestion = questions[currentIndex]
  const progressText = useMemo(() => {
    if (questions.length === 0) return "All required follow-up questions are complete."
    return `Question ${currentIndex + 1} of ${questions.length}`
  }, [currentIndex, questions.length])

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No additional follow-up questions are currently required.</p>
        </CardContent>
      </Card>
    )
  }

  function nextQuestion() {
    if (currentQuestion.required && !isAnswered(currentQuestion, assessment)) {
      setError("Please answer this question before continuing.")
      return
    }

    setError("")
    setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))
  }

  function prevQuestion() {
    setError("")
    setCurrentIndex((value) => Math.max(0, value - 1))
  }

  function updateTopLevel<K extends keyof AssessmentData>(key: K, value: AssessmentData[K]) {
    onChange({
      ...assessment,
      [key]: value,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Follow-up questionnaire</CardTitle>
        <p className="text-xs text-muted-foreground">{progressText}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{currentQuestion.prompt}</p>
          {currentQuestion.helpText ? <p className="text-xs text-muted-foreground">{currentQuestion.helpText}</p> : null}
        </div>

        {currentQuestion.fieldKey === "shared.intentOutsideQuebec" && (
          <RadioGroup
            value={assessment.expressEntryIntentOutsideQuebec}
            onValueChange={(value) => updateTopLevel("expressEntryIntentOutsideQuebec", value as AssessmentData["expressEntryIntentOutsideQuebec"])}
            className="flex gap-3"
          >
            {(currentQuestion.options ?? []).map((option) => (
              <Label key={option.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <RadioGroupItem value={option.value} id={`intent-${option.value}`} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.fieldKey === "auth.currentlyAuthorizedToWorkInCanada" && (
          <RadioGroup
            value={assessment.currentlyAuthorizedToWorkInCanada}
            onValueChange={(value) => updateTopLevel("currentlyAuthorizedToWorkInCanada", value as AssessmentData["currentlyAuthorizedToWorkInCanada"])}
            className="flex gap-3"
          >
            {(currentQuestion.options ?? []).map((option) => (
              <Label key={option.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <RadioGroupItem value={option.value} id={`auth-${option.value}`} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.fieldKey === "language.primary.testType" && (
          <Select
            value={assessment.languageTests?.[0]?.testType ?? ""}
            onValueChange={(value) => {
              const tests = ensurePrimaryLanguageTest(assessment.languageTests)
              tests[0] = { ...tests[0], testType: value as AssessmentData["languageTests"][number]["testType"] }
              updateTopLevel("languageTests", tests)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              {(currentQuestion.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {currentQuestion.fieldKey === "language.primary.testDate" && (
          <Input
            type="date"
            value={assessment.languageTests?.[0]?.testDate ?? ""}
            onChange={(event) => {
              const tests = ensurePrimaryLanguageTest(assessment.languageTests)
              tests[0] = { ...tests[0], testDate: event.target.value }
              updateTopLevel("languageTests", tests)
            }}
          />
        )}

        {currentQuestion.fieldKey === "language.primary.stream" && (
          <RadioGroup
            value={assessment.languageTests?.[0]?.stream ?? ""}
            onValueChange={(value) => {
              const tests = ensurePrimaryLanguageTest(assessment.languageTests)
              tests[0] = { ...tests[0], stream: value as AssessmentData["languageTests"][number]["stream"] }
              updateTopLevel("languageTests", tests)
            }}
            className="flex gap-3"
          >
            {(currentQuestion.options ?? []).map((option) => (
              <Label key={option.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <RadioGroupItem value={option.value} id={`stream-${option.value}`} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.fieldKey === "language.primary.scores" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(["listening", "reading", "writing", "speaking"] as const).map((ability) => (
              <div key={ability} className="space-y-1">
                <Label className="capitalize">{ability}</Label>
                <Input
                  value={assessment.languageTests?.[0]?.scores?.[ability] ?? ""}
                  onChange={(event) => {
                    const tests = ensurePrimaryLanguageTest(assessment.languageTests)
                    const prevScores = tests[0].scores ?? { listening: "", reading: "", writing: "", speaking: "" }
                    tests[0] = {
                      ...tests[0],
                      scores: {
                        ...prevScores,
                        [ability]: event.target.value,
                      },
                    }
                    updateTopLevel("languageTests", tests)
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {currentQuestion.fieldKey === "funds.familySize" && (
          <Input
            type="number"
            min="1"
            value={assessment.fundsFamilySize ?? ""}
            onChange={(event) => updateTopLevel("fundsFamilySize", event.target.value ? Number.parseInt(event.target.value, 10) : null)}
          />
        )}

        {currentQuestion.fieldKey === "funds.available" && (
          <Input
            type="number"
            min="0"
            value={assessment.settlementFundsCad ?? ""}
            onChange={(event) => updateTopLevel("settlementFundsCad", event.target.value ? Number.parseFloat(event.target.value) : null)}
          />
        )}

        {currentQuestion.fieldKey === "fsw.primaryOccupationRoleId" && (
          <Select value={assessment.fswPrimaryOccupationRoleId} onValueChange={(value) => updateTopLevel("fswPrimaryOccupationRoleId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a primary occupation role" />
            </SelectTrigger>
            <SelectContent>
              {(currentQuestion.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {currentQuestion.fieldKey === "jobOffer.validity" && (
          <RadioGroup
            value={assessment.jobOfferMeetsValidOfferDefinition}
            onValueChange={(value) => updateTopLevel("jobOfferMeetsValidOfferDefinition", value as AssessmentData["jobOfferMeetsValidOfferDefinition"])}
            className="flex gap-3"
          >
            {(currentQuestion.options ?? []).map((option) => (
              <Label key={option.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <RadioGroupItem value={option.value} id={`offer-valid-${option.value}`} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.fieldKey === "fst.offer.path" && (
          <RadioGroup
            value={getQuestionValue(currentQuestion, assessment) as string}
            onValueChange={(value) => {
              if (value === "certificate") {
                onChange({
                  ...assessment,
                  hasCanadianTradeCertificate: "yes",
                })
                return
              }

              if (value === "job-offer") {
                onChange({
                  ...assessment,
                  hasCanadianTradeCertificate: "no",
                  fstJobOfferEmployers: ensureOffer(assessment.fstJobOfferEmployers ?? [], 0),
                })
                return
              }

              onChange({
                ...assessment,
                hasCanadianTradeCertificate: "no",
                fstJobOfferEmployers: [],
              })
            }}
            className="flex gap-3"
          >
            {(currentQuestion.options ?? []).map((option) => (
              <Label key={option.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <RadioGroupItem value={option.value} id={`fst-path-${option.value}`} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.fieldKey.startsWith("fst.offer.employer") && (
          <div className="space-y-4">
            {[0, 1].map((index) => {
              const offers = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
              const offer = offers[index]

              return (
                <Card key={offer.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">FST employer #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Employer name"
                      value={offer.employerName}
                      onChange={(event) => {
                        const next = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
                        next[index] = { ...next[index], employerName: event.target.value }
                        updateTopLevel("fstJobOfferEmployers", next)
                      }}
                    />
                    <ExpressEntryNocInput
                      value={offer.noc2021Code}
                      onChange={(value) => {
                        const next = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
                        next[index] = { ...next[index], noc2021Code: value }
                        updateTopLevel("fstJobOfferEmployers", next)
                      }}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Hours/week"
                        value={offer.hoursPerWeek ?? ""}
                        onChange={(event) => {
                          const next = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
                          next[index] = { ...next[index], hoursPerWeek: event.target.value ? Number.parseFloat(event.target.value) : null }
                          updateTopLevel("fstJobOfferEmployers", next)
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Duration in months"
                        value={offer.durationMonths ?? ""}
                        onChange={(event) => {
                          const next = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
                          next[index] = { ...next[index], durationMonths: event.target.value ? Number.parseInt(event.target.value, 10) : null }
                          updateTopLevel("fstJobOfferEmployers", next)
                        }}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([
                        { key: "paid", label: "Paid" },
                        { key: "fullTime", label: "Full-time" },
                        { key: "continuous", label: "Continuous" },
                      ] as const).map((item) => (
                        <div key={item.key} className="space-y-1">
                          <Label>{item.label}</Label>
                          <Select
                            value={(offer[item.key] as string) ?? ""}
                            onValueChange={(value) => {
                              const next = ensureOffer(assessment.fstJobOfferEmployers ?? [], index)
                              next[index] = { ...next[index], [item.key]: value as never }
                              updateTopLevel("fstJobOfferEmployers", next)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".nocCode") && (
          <ExpressEntryNocInput
            value={getQuestionValue(currentQuestion, assessment) as string}
            onChange={(value, derivedTeer) => {
              const next = updateRole(assessment, currentQuestion.roleId as string, (role) => ({
                ...role,
                noc2021Code: value,
                teer: (derivedTeer ?? role.teer) as AssessmentData["workRoles"][number]["teer"],
              }))
              onChange(next)
            }}
          />
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".nocDutiesMatchConfirmed") && (
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(getQuestionValue(currentQuestion, assessment))}
              onCheckedChange={(checked) => {
                const next = updateRole(assessment, currentQuestion.roleId as string, (role) => ({
                  ...role,
                  nocDutiesMatchConfirmed: checked === true,
                }))
                onChange(next)
              }}
            />
            My duties match the lead statement and most main duties.
          </Label>
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".startDate") && (
          <Input
            type="date"
            value={getQuestionValue(currentQuestion, assessment) as string}
            onChange={(event) => {
              onChange(updateRole(assessment, currentQuestion.roleId as string, (role) => ({ ...role, startDate: event.target.value })))
            }}
          />
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".endDate") && (
          <Input
            type="date"
            value={getQuestionValue(currentQuestion, assessment) as string}
            onChange={(event) => {
              onChange(updateRole(assessment, currentQuestion.roleId as string, (role) => ({ ...role, endDate: event.target.value, present: false })))
            }}
          />
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".hoursPerWeek") && (
          <Input
            type="number"
            min="0"
            value={getQuestionValue(currentQuestion, assessment) as string}
            onChange={(event) => {
              onChange(
                updateRole(assessment, currentQuestion.roleId as string, (role) => ({
                  ...role,
                  hoursPerWeek: event.target.value ? Number.parseFloat(event.target.value) : null,
                })),
              )
            }}
          />
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".paid") && (
          <RadioGroup
            value={getQuestionValue(currentQuestion, assessment) as string}
            onValueChange={(value) => {
              onChange(updateRole(assessment, currentQuestion.roleId as string, (role) => ({ ...role, paid: value === "yes" })))
            }}
            className="flex gap-3"
          >
            <Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RadioGroupItem value="yes" id="role-paid-yes" />
              Yes
            </Label>
            <Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RadioGroupItem value="no" id="role-paid-no" />
              No
            </Label>
          </RadioGroup>
        )}

        {currentQuestion.roleId && currentQuestion.fieldKey.endsWith(".employmentType") && (
          <Select
            value={getQuestionValue(currentQuestion, assessment) as string}
            onValueChange={(value) => {
              onChange(updateRole(assessment, currentQuestion.roleId as string, (role) => ({ ...role, employmentType: value as never })))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="self-employed">Self-employed</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
            </SelectContent>
          </Select>
        )}

        {currentQuestion.roleId && (currentQuestion.fieldKey.endsWith(".wasAuthorizedInCanada") || currentQuestion.fieldKey.endsWith(".wasFullTimeStudent") || currentQuestion.fieldKey.endsWith(".physicallyInCanada") || currentQuestion.fieldKey.endsWith(".qualifiedToPracticeInCountry")) && (
          <RadioGroup
            value={getQuestionValue(currentQuestion, assessment) as string}
            onValueChange={(value) => {
              const key = currentQuestion.fieldKey.split(".").at(-1) as "wasAuthorizedInCanada" | "wasFullTimeStudent" | "physicallyInCanada" | "qualifiedToPracticeInCountry"
              onChange(updateRole(assessment, currentQuestion.roleId as string, (role) => ({ ...role, [key]: value as never })))
            }}
            className="flex gap-3"
          >
            <Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RadioGroupItem value="yes" id="role-yes" />
              Yes
            </Label>
            <Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RadioGroupItem value="no" id="role-no" />
              No
            </Label>
            <Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RadioGroupItem value="not-sure" id="role-not-sure" />
              Not sure
            </Label>
          </RadioGroup>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={prevQuestion} disabled={currentIndex === 0}>
            Back
          </Button>
          <Button type="button" onClick={nextQuestion}>
            {currentIndex === questions.length - 1 ? "Done" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
