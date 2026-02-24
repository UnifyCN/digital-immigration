"use client"

import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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
  const startYear = DEFAULT_START_MONTH.getFullYear()
  const endYear = DEFAULT_END_MONTH.getFullYear()
  const selectedYear = selectedDate?.getFullYear() ?? new Date().getFullYear()
  const clampedSelectedYear = Math.min(endYear, Math.max(startYear, selectedYear))

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
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground">Year</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={clampedSelectedYear}
            onChange={(event) => {
              const year = Number.parseInt(event.target.value, 10)
              const month = selectedDate?.getMonth() ?? 0
              onChange(format(new Date(year, month, 1), "yyyy-MM"))
            }}
          >
            {Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-4 gap-2">
            {MONTH_LABELS.map((monthLabel, monthIndex) => {
              const year = clampedSelectedYear
              const monthDate = new Date(year, monthIndex, 1)
              const isWithinRange = monthDate >= DEFAULT_START_MONTH && monthDate <= DEFAULT_END_MONTH
              const isSelected =
                selectedDate?.getFullYear() === year && selectedDate.getMonth() === monthIndex
              return (
                <Button
                  key={monthLabel}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isWithinRange}
                  onClick={() => onChange(format(monthDate, "yyyy-MM"))}
                >
                  {monthLabel}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
