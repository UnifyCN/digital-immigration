"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { Imm5669Stepper } from "@/components/documents/imm5669/imm5669-stepper"
import { SectionApplicantInfo } from "@/components/documents/imm5669/section-applicant-info"
import { SectionParentDetails } from "@/components/documents/imm5669/section-parent-details"
import { SectionBackgroundQuestions } from "@/components/documents/imm5669/section-background-questions"
import { SectionEducation } from "@/components/documents/imm5669/section-education"
import { SectionPersonalHistory } from "@/components/documents/imm5669/section-personal-history"
import { SectionMemberships } from "@/components/documents/imm5669/section-memberships"
import { SectionMilitaryAddresses } from "@/components/documents/imm5669/section-military-addresses"
import { SectionReview } from "@/components/documents/imm5669/section-review"
import { sectionSchemas } from "@/lib/imm5669/schemas"
import {
  loadImm5669Draft,
  saveImm5669Draft,
  loadImm5669Section,
  saveImm5669Section,
} from "@/lib/imm5669/storage"
import { prefillFromAssessment } from "@/lib/imm5669/prefill"
import { loadAssessment } from "@/lib/storage"
import type { Imm5669Data } from "@/lib/imm5669/types"
import { DEFAULT_IMM5669, IMM5669_SECTION_TITLES, IMM5669_TOTAL_SECTIONS } from "@/lib/imm5669/types"

const REVIEW_SECTION = IMM5669_TOTAL_SECTIONS - 1

export default function Imm5669Page() {
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const [completedSections, setCompletedSections] = useState<boolean[]>(() =>
    Array(IMM5669_TOTAL_SECTIONS).fill(false),
  )
  const [isLoaded, setIsLoaded] = useState(false)

  const form = useForm<Imm5669Data>({
    resolver: currentSection < REVIEW_SECTION
      ? zodResolver(sectionSchemas[currentSection])
      : undefined,
    defaultValues: DEFAULT_IMM5669,
    mode: "onTouched",
  })

  useEffect(() => {
    const draft = loadImm5669Draft()
    if (draft) {
      form.reset(draft)
    } else {
      const assessment = loadAssessment()
      if (assessment) {
        const prefilled = prefillFromAssessment(assessment)
        form.reset(prefilled)
      }
    }
    const savedSection = loadImm5669Section()
    if (savedSection >= 0 && savedSection < IMM5669_TOTAL_SECTIONS) {
      setCurrentSection(savedSection)
    }
    setIsLoaded(true)
  }, [form])

  useEffect(() => {
    if (!isLoaded) return
    saveImm5669Section(currentSection)
  }, [currentSection, isLoaded])

  const persistData = useCallback(() => {
    const values = form.getValues()
    saveImm5669Draft(values)
  }, [form])

  function handleSaveAndExit() {
    persistData()
    router.push("/next-steps")
  }

  async function handleNext() {
    if (currentSection >= REVIEW_SECTION) return

    const valid = await form.trigger()
    if (!valid) return

    setCompletedSections((prev) => {
      const next = [...prev]
      next[currentSection] = true
      return next
    })

    persistData()
    setCurrentSection((s) => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleBack() {
    persistData()
    if (currentSection > 0) {
      setCurrentSection((s) => s - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      router.push("/next-steps")
    }
  }

  function goToSection(index: number) {
    if (index >= currentSection) return
    persistData()
    setCurrentSection(index)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const progressPercent = ((currentSection + 1) / IMM5669_TOTAL_SECTIONS) * 100

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-foreground text-lg">
          IMM 5669 — Schedule A
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveAndExit}
          className="gap-1.5"
        >
          <Save className="size-3.5" />
          Save & Exit
        </Button>
      </div>

      <p className="mb-6 text-xs text-muted-foreground">
        Background / Declaration form. This tool helps organize information — it is not legal advice.
      </p>

      <div className="mb-6">
        <Progress value={progressPercent} className="h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground text-right">
          Section {currentSection + 1} of {IMM5669_TOTAL_SECTIONS}
          {" — "}
          {IMM5669_SECTION_TITLES[currentSection]}
        </p>
      </div>

      <div className="mb-8">
        <Imm5669Stepper
          currentSection={currentSection}
          completedSections={completedSections}
          onSectionClick={goToSection}
        />
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleNext()
          }}
          className="flex flex-col gap-8"
        >
          <div className="min-h-[400px]">
            {currentSection === 0 && <SectionApplicantInfo />}
            {currentSection === 1 && <SectionParentDetails />}
            {currentSection === 2 && <SectionBackgroundQuestions />}
            {currentSection === 3 && <SectionEducation />}
            {currentSection === 4 && <SectionPersonalHistory />}
            {currentSection === 5 && <SectionMemberships />}
            {currentSection === 6 && <SectionMilitaryAddresses />}
            {currentSection === REVIEW_SECTION && (
              <SectionReview
                data={form.getValues()}
                onEdit={(section) => {
                  setCurrentSection(section)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                onUpdateDeclarationDate={(date) => {
                  form.setValue("declarationDate", date)
                  persistData()
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {currentSection < REVIEW_SECTION && (
              <Button type="submit" className="gap-2">
                {currentSection === REVIEW_SECTION - 1 ? "Review" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
