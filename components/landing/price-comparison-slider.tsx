"use client"

import { useRef, useState, useCallback } from "react"
import { GripVertical } from "lucide-react"

const services = [
  { name: "Personalized Assessment", ours: "Free", theirs: "$200–$500" },
  { name: "Pathway Recommendations", ours: "Free", theirs: "$500–$1,500" },
  { name: "Document Checklist", ours: "Free", theirs: "$300–$800" },
  { name: "CRS Score Analysis", ours: "Free", theirs: "$150–$400" },
]

const totals = { ours: "$0", theirs: "$1,150–$3,200" }

export function PriceComparisonSlider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(10, Math.min(90, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }, [isDragging, updatePosition])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const Row = ({ name, price, isTotal }: { name: string; price: string; isTotal?: boolean }) => (
    <div className={`flex items-center justify-between px-6 py-4 ${isTotal ? "border-t-2 border-current/10 font-bold" : "border-b border-current/5"}`}>
      <span className={isTotal ? "text-base" : "text-sm"}>{name}</span>
      <span className={isTotal ? "text-xl" : "text-base font-semibold"}>{price}</span>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-3xl cursor-col-resize select-none overflow-hidden rounded-2xl border border-border shadow-lg"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Left side: ClearPath */}
      <div
        className="absolute inset-0 z-10 overflow-hidden bg-white"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold text-emerald-700">ClearPath Immigration</h3>
          <p className="text-xs text-emerald-600/70">What you pay with us</p>
        </div>
        {services.map((s) => (
          <Row key={s.name} name={s.name} price={s.ours} />
        ))}
        <div className="text-emerald-700">
          <Row name="Total" price={totals.ours} isTotal />
        </div>
      </div>

      {/* Right side: Consultant */}
      <div className="bg-stone-50">
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold text-stone-700">Typical Consultant</h3>
          <p className="text-xs text-stone-500">What most people pay</p>
        </div>
        {services.map((s) => (
          <Row key={s.name} name={s.name} price={s.theirs} />
        ))}
        <div className="text-stone-700">
          <Row name="Total" price={totals.theirs} isTotal />
        </div>
      </div>

      {/* Divider handle */}
      <div
        className="absolute top-0 z-20 flex h-full -translate-x-1/2 cursor-col-resize items-center"
        style={{ left: `${position}%` }}
        onPointerDown={handlePointerDown}
      >
        <div className="h-full w-0.5 bg-[#D8492C]" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D8492C] bg-white p-2 shadow-md">
          <GripVertical className="size-5 text-[#D8492C]" />
        </div>
      </div>
    </div>
  )
}
