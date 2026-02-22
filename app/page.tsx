"use client"

import { use, useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, RotateCcw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasDraft, clearAssessment, saveAssessment, saveStep, demoAssessmentData } from "@/lib/storage"

const rotatingMessages = [
  ["Know your path", "before paying thousands."],
  ["Identify likely", "blockers early."],
  ["Prepare with clarity,", "not confusion."],
  ["See exactly", "where you stand."]
]

export default function LandingPage() {
type LandingPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  params?: Promise<{ [key: string]: string | undefined }>
}

export default function LandingPage(props: LandingPageProps) {
  use(props.searchParams ?? Promise.resolve({}))
  use(props.params ?? Promise.resolve({}))
  const router = useRouter()
  const [draftExists, setDraftExists] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const longestMessage = useMemo(
    () =>
      rotatingMessages.reduce((longest, message) =>
        `${message[0]} ${message[1]}`.length > `${longest[0]} ${longest[1]}`.length ? message : longest
      ),
    []
  )
  const safeIndex = useMemo(() => {
    if (rotatingMessages.length === 0) return 0
    return currentIndex % rotatingMessages.length
  }, [currentIndex])
  const activeMessage = rotatingMessages[prefersReducedMotion ? 0 : safeIndex] ?? rotatingMessages[0] ?? ["", ""]
  const activeLineOneWords = activeMessage[0].split(" ")
  const activeLineTwoWords = activeMessage[1].split(" ")

  useEffect(() => {
    setDraftExists(hasDraft())
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
      if (mediaQuery.matches) setCurrentIndex(0)
    }

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return

    let fadeTimeout: ReturnType<typeof setTimeout> | null = null
    const interval = setInterval(() => {
      setIsVisible(false)
      fadeTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotatingMessages.length)
        setIsVisible(true)
      }, 200)
    }, 3500)

    return () => {
      clearInterval(interval)
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [isPaused, prefersReducedMotion])

  function handleReset() {
    clearAssessment()
    setDraftExists(false)
  }

  function handleAutoFill() {
    saveAssessment(demoAssessmentData)
    saveStep(7)
    router.push("/results")
  }

  return (
    <div className="relative flex min-h-[calc(100vh-2.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute -left-8 top-10 h-14 w-56 rounded-full bg-accent/28" />
      <div className="pointer-events-none absolute -right-12 bottom-9 h-12 w-80 rounded-full bg-accent/36" />

      <div
        className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsPaused(false)
          }
        }}
      >
        <div className="rounded-full border border-border bg-card px-6 py-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[17px]">
          Immigration Plan Builder
        </div>

        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-heading text-[clamp(2.25rem,5vw,5.2rem)] font-medium leading-[1.14] tracking-[-0.02em] text-foreground">
            <span>Start my immigration plan </span>
            <span className="relative inline-grid align-baseline">
              <span aria-hidden="true" className="invisible text-[#D8492C]">
                <span className="block">{longestMessage[0]}</span>
                <span className="block">{longestMessage[1]}</span>
              </span>
              <span
                aria-live={prefersReducedMotion ? undefined : "polite"}
                className={`absolute inset-0 text-[#D8492C] ${
                  prefersReducedMotion ? "duration-0" : "duration-[400ms]"
                }`}
              >
                <span className="block">
                  {activeLineOneWords.map((word, index) => (
                    <span
                      key={`${currentIndex}-line1-${word}-${index}`}
                      className={`inline-block transition-all ${
                        prefersReducedMotion ? "duration-0" : "duration-[400ms]"
                      } ${prefersReducedMotion || isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                      style={
                        prefersReducedMotion
                          ? undefined
                          : { transitionDelay: `${Math.min(index * 35, 280)}ms` }
                      }
                    >
                      {word}
                      {index < activeLineOneWords.length - 1 ? "\u00A0" : ""}
                    </span>
                  ))}
                </span>
                <span className="block">
                  {activeLineTwoWords.map((word, index) => (
                    <span
                      key={`${currentIndex}-line2-${word}-${index}`}
                      className={`inline-block transition-all ${
                        prefersReducedMotion ? "duration-0" : "duration-[400ms]"
                      } ${prefersReducedMotion || isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                      style={
                        prefersReducedMotion
                          ? undefined
                          : { transitionDelay: `${Math.min((index + activeLineOneWords.length) * 35, 320)}ms` }
                      }
                    >
                      {word}
                      {index < activeLineTwoWords.length - 1 ? "\u00A0" : ""}
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </h1>
        </div>

        <div className="flex flex-col items-center gap-5">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-[20px] border border-[#D8492C] bg-[#D8492C] px-10 text-[clamp(1.1rem,1.25vw,1.8rem)] font-semibold text-white hover:bg-[#C63F25]"
          >
            <Link href="/assessment">
              Get My Personalized Plan
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Takes 5–8 minutes. Private. No commitment.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            className="gap-2 text-muted-foreground"
          >
            <Zap className="size-3.5" />
            Skip to demo results
          </Button>

          {draftExists && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/assessment">Resume planning</Link>
            </Button>
          )}
        </div>

        {draftExists && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Reset snapshot
          </Button>
        )}
      </div>
    </div>
  )
}
