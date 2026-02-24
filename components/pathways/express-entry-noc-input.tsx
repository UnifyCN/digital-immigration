"use client"

import { useId, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { deriveTeerFromNocCode, isValidNocCode, normalizeNocCode } from "@/lib/immigration/expressEntry/nocLookup"

type ExpressEntryNocInputProps = {
  value: string
  onChange: (value: string, derivedTeer: string | null) => void
  placeholder?: string
}

export function ExpressEntryNocInput({ value, onChange, placeholder = "Enter 5-digit NOC code" }: ExpressEntryNocInputProps) {
  const normalized = normalizeNocCode(value)
  const derivedTeer = useMemo(() => deriveTeerFromNocCode(normalized), [normalized])
  const isValid = normalized.length === 0 ? true : isValidNocCode(normalized)
  const invalid = normalized.length > 0 && !isValid
  const errorId = useId()

  return (
    <div className="space-y-2">
      <Input
        value={value}
        placeholder={placeholder}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, "").slice(0, 5)
          onChange(next, deriveTeerFromNocCode(next))
        }}
      />
      <div className="flex items-center gap-2 text-xs">
        {!isValid ? <span id={errorId} className="text-destructive">Enter a valid 5-digit NOC 2021 code.</span> : null}
        {derivedTeer ? <Badge variant="secondary">Derived TEER {derivedTeer}</Badge> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose the NOC that best matches your duties.
      </p>
    </div>
  )
}
