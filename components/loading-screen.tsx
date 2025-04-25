"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Loading game assets...")

  const loadingTexts = [
    "Loading game assets...",
    "Preparing time portals...",
    "Summoning champions...",
    "Calibrating temporal flux...",
    "Initializing battle arena...",
  ]

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 150)

    // Cycle through loading texts
    const textInterval = setInterval(() => {
      setLoadingText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)])
    }, 2000)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-black"
      style={{
        backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          className="mb-8"
        >
          <img src="/images/logo.png" alt="Chrono Clash Logo" className="w-[400px] max-w-full" />
        </motion.div>

        <div className="w-64 mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="text-center text-yellow-400 mb-8">
          <p>{loadingText}</p>
          <p className="text-sm text-gray-400 mt-2">{progress}%</p>
        </div>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
