"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, RotateCcw, Zap, Shield, Lock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasDraft, clearAssessment, saveAssessment, saveStep, demoAssessmentData } from "@/lib/storage"
import { PriceComparisonSlider } from "@/components/landing/price-comparison-slider"

type LandingPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  params?: Promise<{ [key: string]: string | undefined }>
}

export default function LandingPage(props: LandingPageProps) {
  use(props.searchParams ?? Promise.resolve({}))
  use(props.params ?? Promise.resolve({}))
  const router = useRouter()
  const [draftExists, setDraftExists] = useState(false)

  useEffect(() => {
    setDraftExists(hasDraft())
  }, [])

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
    <>
      {/* Section 1: Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <span className="rounded-full border border-border bg-card px-5 py-1.5 text-sm font-medium tracking-wide text-muted-foreground">
            ClearPath Immigration
          </span>
          <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
            Your immigration plan, done right.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Get a personalized Canadian immigration roadmap based on official IRCC criteria. Private. No payment required.
          </p>
          <Button asChild size="lg" className="mt-2 h-14 rounded-full bg-[#D8492C] px-10 text-lg font-semibold text-white shadow-md hover:bg-[#C63F25]">
            <Link href="/assessment">
              Get My Free Plan
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Takes 5–8 minutes</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleAutoFill} className="gap-1.5 text-xs text-muted-foreground">
              <Zap className="size-3" />
              Try demo
            </Button>
            {draftExists && (
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/assessment">Resume draft</Link>
              </Button>
            )}
            {draftExists && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs text-muted-foreground">
                <RotateCcw className="size-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Trust Bar */}
      <section className="border-y border-border/50 bg-muted/30 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Shield, text: "Based on official IRCC criteria" },
            { icon: Lock, text: "Private & secure. No data shared." },
            { icon: CheckCircle, text: "Free assessment. No commitment." },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-3 text-center sm:text-left">
              <Icon className="size-5 shrink-0 text-[#D8492C]" />
              <span className="text-sm font-medium text-foreground/80">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: 1, title: "Answer questions", desc: "Tell us about your background, goals, and timeline." },
              { step: 2, title: "Get your plan", desc: "Receive a personalized pathway assessment in minutes." },
              { step: 3, title: "Take action", desc: "Know exactly what to do next — with confidence." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#D8492C] text-sm font-bold text-white">
                  {step}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Price Comparison */}
      <section className="bg-muted/20 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
            See what you save
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Drag to compare our assessment vs. a typical immigration consultant.
          </p>
          <PriceComparisonSlider />
        </div>
      </section>

      {/* Section 5: Final CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
            Ready to start your immigration journey?
          </h2>
          <p className="text-muted-foreground">
            Join thousands of applicants who planned with confidence.
          </p>
          <Button asChild size="lg" className="mt-2 h-14 rounded-full bg-[#D8492C] px-10 text-lg font-semibold text-white shadow-md hover:bg-[#C63F25]">
            <Link href="/assessment">
              Get My Free Plan
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">No account required. Results in minutes.</p>
        </div>
      </section>
    </>
  )
}
