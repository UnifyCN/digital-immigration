"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined
  const isValidDate = selectedDate && !Number.isNaN(selectedDate.getTime())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-between font-normal", className)}
        >
          {isValidDate ? format(selectedDate, "PPP") : placeholder}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? selectedDate : undefined}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
        />
      </PopoverContent>
    </Popover>
  )
}
