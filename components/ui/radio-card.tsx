"use client"

import { Label } from "@/components/ui/label"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type RadioCardProps = {
  value: string
  id: string
  label: string
  className?: string
  itemClassName?: string
  labelClassName?: string
}

export function RadioCard({
  value,
  id,
  label,
  className,
  itemClassName,
  labelClassName,
}: RadioCardProps) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-accent [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5",
        className,
      )}
    >
      <RadioGroupItem value={value} id={id} className={itemClassName} />
      <span className={cn("text-foreground", labelClassName)}>{label}</span>
    </Label>
  )
}
