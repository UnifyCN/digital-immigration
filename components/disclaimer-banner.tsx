"use client"

import { Info } from "lucide-react"
import { usePathname } from "next/navigation"

export function DisclaimerBanner() {
  const pathname = usePathname()

  if (pathname === "/") {
    return null
  }

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        <p>
          Not legal advice. You review and decide. This tool helps you organize
          information and understand public requirements.
        </p>
      </div>
    </div>
  )
}
