"use client"

import { useEffect, useState } from "react"
import { Clock, Zap, Shield, Sword } from "lucide-react"
import type { JSX } from "react"

export function BattleAnimation({
  type,
  target,
}: {
  type: string
  target: "player" | "enemy"
}) {
  const [particles, setParticles] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      speed: number
      angle: number
      opacity: number
    }>
  >([])

  useEffect(() => {
    // Create particles based on animation type
    const newParticles = []
    const particleCount = 15

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: target === "enemy" ? 30 : 70, // Start position (percentage)
        y: target === "enemy" ? 30 : 70,
        size: Math.random() * 10 + 5,
        speed: Math.random() * 2 + 1,
        angle: Math.random() * 360,
        opacity: 1,
      })
    }

    setParticles(newParticles)

    // Animate particles
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + Math.cos(particle.angle * (Math.PI / 180)) * particle.speed * (target === "enemy" ? 1 : -1),
            y: particle.y + Math.sin(particle.angle * (Math.PI / 180)) * particle.speed * (target === "enemy" ? 1 : -1),
            opacity: particle.opacity - 0.02,
          }))
          .filter((particle) => particle.opacity > 0),
      )
    }, 50)

    return () => clearInterval(interval)
  }, [type, target])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
          }}
        >
          {getAnimationIcon(type, particle.size)}
        </div>
      ))}
    </div>
  )
}

function getAnimationIcon(type: string, size: number): JSX.Element {
  const iconSize = `${size}px`

  switch (type) {
    case "time":
      return <Clock style={{ width: iconSize, height: iconSize }} className="text-purple-400" />
    case "lightning":
      return <Zap style={{ width: iconSize, height: iconSize }} className="text-yellow-400" />
    case "shield":
      return <Shield style={{ width: iconSize, height: iconSize }} className="text-blue-400" />
    default:
      return <Sword style={{ width: iconSize, height: iconSize }} className="text-red-400" />
  }
}
