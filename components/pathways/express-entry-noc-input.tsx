"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { deriveTeerFromNocCode, isValidNocCode } from "@/lib/immigration/expressEntry/nocLookup"

type ExpressEntryNocInputProps = {
  value: string
  onChange: (value: string, derivedTeer: string | null) => void
  placeholder?: string
}

export function ExpressEntryNocInput({ value, onChange, placeholder = "Enter 5-digit NOC code" }: ExpressEntryNocInputProps) {
  const normalized = value.trim()
  const derivedTeer = useMemo(() => deriveTeerFromNocCode(normalized), [normalized])
  const isValid = normalized.length === 0 ? true : isValidNocCode(normalized)

  return (
    <div className="space-y-2">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, "").slice(0, 5)
          onChange(next, deriveTeerFromNocCode(next))
        }}
      />
      <div className="flex items-center gap-2 text-xs">
        {!isValid ? <span className="text-destructive">Enter a valid 5-digit NOC 2021 code.</span> : null}
        {derivedTeer ? <Badge variant="secondary">Derived TEER {derivedTeer}</Badge> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose the NOC that best matches your duties.
      </p>
    </div>
  )
}
