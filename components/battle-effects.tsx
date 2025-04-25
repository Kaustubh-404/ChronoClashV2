"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface BattleEffectsProps {
  playerAnimation: string | null
  enemyAnimation: string | null
}

export default function BattleEffects({ playerAnimation, enemyAnimation }: BattleEffectsProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      rotation: number
      opacity: number
      color: string
    }>
  >([])

  useEffect(() => {
    if (playerAnimation) {
      createParticles(playerAnimation, "player")
    }

    if (enemyAnimation) {
      createParticles(enemyAnimation, "enemy")
    }
  }, [playerAnimation, enemyAnimation])

  const createParticles = (type: string, source: "player" | "enemy") => {
    const newParticles = []
    const particleCount = 20

    // Set starting position based on source
    const startX = source === "player" ? 30 : 70
    const endX = source === "player" ? 70 : 30

    // Set colors based on ability type
    let colors: string[] = []
    switch (type) {
      case "fire":
        colors = ["#ff4500", "#ff6b00", "#ff9500", "#ffb700"]
        break
      case "ice":
        colors = ["#00ffff", "#00ccff", "#00a1ff", "#0077ff"]
        break
      case "lightning":
        colors = ["#ffff00", "#ffcc00", "#ff9900", "#ffcc33"]
        break
      case "time":
        colors = ["#9900ff", "#cc00ff", "#ff00ff", "#ff33cc"]
        break
      default:
        colors = ["#ffffff", "#cccccc", "#999999", "#666666"]
    }

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: startX + (Math.random() * 10 - 5),
        y: 50 + (Math.random() * 10 - 5),
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    setParticles((prev) => [...prev, ...newParticles])

    // Animate particles
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => {
            // Move particles toward target
            const dx = (endX - startX) / 15
            const newX = particle.x + dx

            // Add some randomness to y position
            const newY = particle.y + (Math.random() * 4 - 2)

            // Reduce opacity as particles move
            const newOpacity = particle.opacity - 0.05

            return {
              ...particle,
              x: newX,
              y: newY,
              rotation: particle.rotation + 10,
              opacity: newOpacity,
            }
          })
          .filter((particle) => particle.opacity > 0),
      )
    }, 50)

    // Clean up interval after animation completes
    setTimeout(() => {
      clearInterval(interval)
      setParticles([])
    }, 1000)
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              position: "absolute",
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: "50%",
              opacity: particle.opacity,
              transform: `rotate(${particle.rotation}deg)`,
              filter: "blur(2px)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
