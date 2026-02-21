"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardStepperProps {
  steps: string[]
  currentStep: number
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <nav aria-label="Assessment progress" className="w-full">
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li key={step} className="flex flex-1 items-center">
              <div className="flex w-full flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-[10px] text-center leading-tight sm:block",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-px w-full shrink-0 sm:mb-8",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
