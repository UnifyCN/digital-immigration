"use client"

import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MonthYearPickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

const DEFAULT_START_MONTH = new Date(1900, 0)
const DEFAULT_END_MONTH = new Date(2100, 11)

function parseMonthValue(value: string): Date | undefined {
  if (!value || value.length < 7) return undefined
  try {
    const d = parse(value, "yyyy-MM", new Date())
    return Number.isNaN(d.getTime()) ? undefined : d
  } catch {
    return undefined
  }
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "Month and year",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: MonthYearPickerProps) {
  const selectedDate = parseMonthValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedDate ? format(selectedDate, "MMM yyyy") : placeholder}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={DEFAULT_START_MONTH}
          endMonth={DEFAULT_END_MONTH}
          selected={selectedDate}
          defaultMonth={selectedDate ?? new Date()}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM") : "")}
        />
      </PopoverContent>
    </Popover>
  )
}
