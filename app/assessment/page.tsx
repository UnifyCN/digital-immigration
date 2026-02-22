"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { WizardStepper } from "@/components/assessment/wizard-stepper"
import { StepGoalTimeline } from "@/components/assessment/step-goal-timeline"
import { StepCurrentStatus } from "@/components/assessment/step-current-status"
import { StepWorkHistory } from "@/components/assessment/step-work-history"
import { StepEducation } from "@/components/assessment/step-education"
import { StepLanguageCRS } from "@/components/assessment/step-language-crs"
import { StepFamily } from "@/components/assessment/step-family"
import { StepRedFlags } from "@/components/assessment/step-red-flags"
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
} from "@/lib/schemas"
import {
  loadAssessment,
  saveAssessment,
  saveStep,
  loadStep,
  defaultAssessmentData,
} from "@/lib/storage"
import type { AssessmentData } from "@/lib/types"

const STEP_LABELS = [
  "Goal",
  "Status",
  "Work",
  "Education",
  "Language",
  "Family",
  "Flags",
]

const TOTAL_STEPS = 7

const stepSchemas = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
]

export default function AssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const form = useForm<AssessmentData>({
    resolver: zodResolver(stepSchemas[currentStep]),
    defaultValues: defaultAssessmentData,
    mode: "onTouched",
  })

  // Load saved data on mount
  useEffect(() => {
    const saved = loadAssessment()
    if (saved) {
      form.reset({
        ...defaultAssessmentData,
        ...saved,
        languageScores: {
          ...defaultAssessmentData.languageScores,
          ...saved.languageScores,
        },
      })
    }
    const stepFromQuery = searchParams.get("step")
    const parsedStep = stepFromQuery ? Number.parseInt(stepFromQuery, 10) : NaN
    if (!Number.isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= TOTAL_STEPS) {
      setCurrentStep(parsedStep - 1)
    } else {
      const savedStep = loadStep()
      if (savedStep > 0 && savedStep < TOTAL_STEPS) {
        setCurrentStep(savedStep)
      }
    }
    setIsLoaded(true)
  }, [form, searchParams])

  // Save on each step change
  const persistData = useCallback(() => {
    const values = form.getValues()
    saveAssessment(values)
    saveStep(currentStep)
  }, [form, currentStep])

  async function handleNext() {
    const schema = stepSchemas[currentStep]
    const values = form.getValues()

    // Validate current step only
    const result = schema.safeParse(values)
    if (!result.success) {
      // Trigger validation errors
      await form.trigger()
      return
    }

    persistData()

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function handleBack() {
    persistData()
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function handleSubmit() {
    persistData()
    router.push("/results")
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100
  const currentStepValid = stepSchemas[currentStep].safeParse(form.watch()).success

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={progressPercent} className="h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground text-right">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <WizardStepper steps={STEP_LABELS} currentStep={currentStep} />
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (currentStep === TOTAL_STEPS - 1) {
              handleSubmit()
            } else {
              handleNext()
            }
          }}
          className="flex flex-col gap-8"
        >
          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && <StepGoalTimeline />}
            {currentStep === 1 && <StepCurrentStatus />}
            {currentStep === 2 && <StepWorkHistory />}
            {currentStep === 3 && <StepEducation />}
            {currentStep === 4 && <StepLanguageCRS />}
            {currentStep === 5 && <StepFamily />}
            {currentStep === 6 && <StepRedFlags />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS - 1 ? (
              <Button type="submit" className="gap-2" disabled={!currentStepValid}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" className="gap-2">
                View Snapshot
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
