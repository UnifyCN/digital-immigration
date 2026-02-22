"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardStepperProps {
  steps: string[]
  currentStep: number
  completedSteps: boolean[]
  onStepClick: (stepIndex: number) => void
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: WizardStepperProps) {
  return (
    <nav aria-label="Assessment progress" className="w-full">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index] && index < currentStep
          const isCurrent = index === currentStep
          const isClickable = isCompleted

          return (
            <li key={step} className="relative flex flex-1 justify-center">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-3.5 h-px left-[calc(50%+14px)] right-[calc(-50%+14px)]",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}

              <div className="relative z-10 flex w-full flex-col items-center gap-1.5">
                {isClickable ? (
                  <button
                    type="button"
                    aria-label={`Go to ${step} section`}
                    onClick={() => onStepClick(index)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-xs font-medium transition-colors cursor-pointer",
                      "border-primary bg-primary text-primary-foreground",
                      "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    )}
                  >
                    <Check className="size-3.5" />
                  </button>
                ) : (
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      !isCurrent && "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3.5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                )}

                <span
                  className={cn(
                    "hidden text-[10px] text-center leading-tight sm:block",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
