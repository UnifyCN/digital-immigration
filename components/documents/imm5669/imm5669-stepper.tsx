"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { IMM5669_SECTION_TITLES } from "@/lib/imm5669/types"

interface Imm5669StepperProps {
  currentSection: number
  completedSections: boolean[]
  onSectionClick: (index: number) => void
}

export function Imm5669Stepper({
  currentSection,
  completedSections,
  onSectionClick,
}: Imm5669StepperProps) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Form sections">
      {IMM5669_SECTION_TITLES.map((title, index) => {
        const isCompleted = completedSections[index]
        const isCurrent = index === currentSection
        const isClickable = index < currentSection || isCompleted

        return (
          <button
            key={index}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onSectionClick(index)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isCurrent && "bg-primary text-primary-foreground",
              isCompleted && !isCurrent && "bg-primary/10 text-primary hover:bg-primary/20",
              !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
              isClickable && !isCurrent && "cursor-pointer",
              !isClickable && "cursor-default opacity-60",
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isCompleted && !isCurrent && <Check className="size-3" />}
            <span className="hidden sm:inline">{title}</span>
            <span className="sm:hidden">{index + 1}</span>
          </button>
        )
      })}
    </nav>
  )
}
