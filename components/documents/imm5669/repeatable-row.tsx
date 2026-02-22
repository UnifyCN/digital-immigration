"use client"

import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface RepeatableRowProps {
  index: number
  canRemove: boolean
  onRemove: () => void
  children: React.ReactNode
}

export function RepeatableRow({ index, canRemove, onRemove, children }: RepeatableRowProps) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Entry {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
            Remove
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

interface AddRowButtonProps {
  label: string
  onClick: () => void
}

export function AddRowButton({ label, onClick }: AddRowButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="mt-2 w-full gap-1.5"
    >
      <Plus className="size-3.5" />
      {label}
    </Button>
  )
}
