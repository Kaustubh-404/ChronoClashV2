"use client"

import { useState, useEffect } from "react"

interface AnimatedNumberProps {
  value: number
  className?: string
}

export function AnimatedNumber({ value, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    // If the value changes, animate to the new value
    if (value !== displayValue) {
      const start = displayValue
      const end = value
      const duration = 500 // ms
      const startTime = performance.now()

      const animateValue = (timestamp: number) => {
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smoother animation
        const easeOutQuad = (t: number) => t * (2 - t)
        const easedProgress = easeOutQuad(progress)

        const currentValue = Math.floor(start + (end - start) * easedProgress)
        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animateValue)
        }
      }

      requestAnimationFrame(animateValue)
    }
  }, [value, displayValue])

  return <span className={className}>{displayValue}</span>
}
