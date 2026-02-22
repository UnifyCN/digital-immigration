"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { WizardStepper } from "@/components/assessment/wizard-stepper"
import { StepBasicInformation } from "@/components/assessment/step-basic-information"
import { StepGoalTimeline } from "@/components/assessment/step-goal-timeline"
import { StepCurrentStatus } from "@/components/assessment/step-current-status"
import { StepWorkHistory } from "@/components/assessment/step-work-history"
import { StepEducation } from "@/components/assessment/step-education"
import { StepLanguageCRS } from "@/components/assessment/step-language-crs"
import { StepFamily } from "@/components/assessment/step-family"
import { StepRedFlags } from "@/components/assessment/step-red-flags"
import {
  step0Schema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  validateStep6,
} from "@/lib/schemas"
import {
  loadAssessment,
  saveAssessment,
  saveStep,
  loadStep,
  defaultAssessmentData,
  loadCompletedSteps,
  saveCompletedSteps,
} from "@/lib/storage"
import type { AssessmentData } from "@/lib/types"

const STEP_LABELS = [
  "Basic Information",
  "Goal",
  "Status",
  "Work",
  "Education",
  "Language",
  "Family",
  "Flags",
]

const TOTAL_STEPS = 8

const stepSchemas = [
  step0Schema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
]

function SearchParamsClient({
  onResolved,
}: {
  onResolved: (step: number | null) => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const stepFromQuery = searchParams.get("step")
    const parsedStep = stepFromQuery ? Number.parseInt(stepFromQuery, 10) : NaN
    if (!Number.isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= TOTAL_STEPS) {
      onResolved(parsedStep - 1)
      return
    }
    onResolved(null)
  }, [onResolved, searchParams])

  return null
}

function AssessmentPageContent() {
  const router = useRouter()
  const [queryStep, setQueryStep] = useState<number | null>(null)
  const [queryResolved, setQueryResolved] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() =>
    Array(TOTAL_STEPS).fill(false),
  )
  const [isLoaded, setIsLoaded] = useState(false)

  const form = useForm<AssessmentData>({
    resolver: zodResolver(stepSchemas[currentStep]),
    defaultValues: defaultAssessmentData,
    mode: "onTouched",
  })

  const validateStepAtIndex = useCallback((stepIndex: number, values: AssessmentData) => {
    return stepIndex === 6
      ? validateStep6(values.primaryGoal || "", values)
      : stepSchemas[stepIndex].safeParse(values)
  }, [])

  useEffect(() => {
    if (!queryResolved) return

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

    if (queryStep !== null) {
      setCurrentStep(queryStep)
    } else {
      const savedStep = loadStep()
      if (savedStep >= 0 && savedStep < TOTAL_STEPS) {
        setCurrentStep(savedStep)
      }
    }

    setCompletedSteps(loadCompletedSteps(TOTAL_STEPS))
    setIsLoaded(true)
  }, [form, queryResolved, queryStep])

  useEffect(() => {
    if (!isLoaded) return
    saveStep(currentStep)
    saveCompletedSteps(completedSteps)
  }, [completedSteps, currentStep, isLoaded])

  const persistData = useCallback(() => {
    const values = form.getValues()
    saveAssessment(values)
  }, [form])

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= currentStep) return
      const values = form.getValues()
      const canJump =
        completedSteps[stepIndex] || validateStepAtIndex(stepIndex, values).success

      if (!canJump) return

      persistData()
      setCurrentStep(stepIndex)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [completedSteps, currentStep, form, persistData, validateStepAtIndex],
  )

  async function handleNext() {
    const values = form.getValues()
    const result = validateStepAtIndex(currentStep, values)

    if (!result.success) {
      await form.trigger()
      return
    }

    setCompletedSteps((prev) => {
      const next = [...prev]
      next[currentStep] = true
      return next
    })

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
      return
    }

    router.push("/")
  }

  async function handleSubmit() {
    const values = form.getValues()
    const result = validateStepAtIndex(currentStep, values)

    if (!result.success) {
      await form.trigger()
      return
    }

    setCompletedSteps((prev) => {
      const next = [...prev]
      next[currentStep] = true
      return next
    })

    persistData()
    router.push("/results")
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100
  const allValues = form.watch()
  const currentStepValid = validateStepAtIndex(currentStep, allValues).success

  const stepperCompleted = STEP_LABELS.map((_, index) => {
    if (completedSteps[index]) return true
    return validateStepAtIndex(index, allValues).success
  })

  const searchParamsResolver = (
    <Suspense fallback={null}>
      <SearchParamsClient
        onResolved={(step) => {
          setQueryStep(step)
          setQueryResolved(true)
        }}
      />
    </Suspense>
  )

  if (!isLoaded) {
    return (
      <>
        {searchParamsResolver}
        <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      {searchParamsResolver}

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Progress value={progressPercent} className="h-1.5" />
          <p className="mt-2 text-xs text-muted-foreground text-right">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </p>
        </div>

        <div className="mb-8">
          <WizardStepper
            steps={STEP_LABELS}
            currentStep={currentStep}
            completedSteps={stepperCompleted}
            onStepClick={goToStep}
          />
        </div>

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
            <div className="min-h-[400px]">
              {currentStep === 0 && <StepBasicInformation />}
              {currentStep === 1 && <StepGoalTimeline />}
              {currentStep === 2 && <StepCurrentStatus />}
              {currentStep === 3 && <StepWorkHistory />}
              {currentStep === 4 && <StepEducation />}
              {currentStep === 5 && <StepLanguageCRS />}
              {currentStep === 6 && <StepFamily />}
              {currentStep === 7 && <StepRedFlags />}
            </div>

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
                  View Results
                  <Send className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AssessmentPageContent />
    </Suspense>
  )
}
