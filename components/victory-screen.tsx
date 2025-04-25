"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useGameState } from "./game-state-provider"
import { playSound } from "@/lib/sound-utils"
import { Trophy, ArrowRight, Home } from "lucide-react"

interface VictoryScreenProps {
  onContinue: () => void
  onMainMenu: () => void
}

export default function VictoryScreen({ onContinue, onMainMenu }: VictoryScreenProps) {
  const { score, level, gold, playerLevel } = useGameState()

  useEffect(() => {
    // Play victory sound
    playSound("victory.mp3")
  }, [])

  const handleContinue = () => {
    playSound("button-click.mp3")
    onContinue()
  }

  const handleMainMenu = () => {
    playSound("button-click.mp3")
    onMainMenu()
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8 flex flex-col items-center"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <Trophy className="h-24 w-24 text-yellow-400 mb-4" />
        </motion.div>
        <h1 className="text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 mb-2">
          VICTORY!
        </h1>
        <h2 className="text-2xl font-bold text-center text-yellow-200">Level {level} Completed</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 bg-black/80 p-8 rounded-lg w-full max-w-md mb-8"
      >
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Score</h3>
            <p className="text-3xl font-bold text-white">{score}</p>
          </div>
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Level</h3>
            <p className="text-3xl font-bold text-blue-400">{level}</p>
          </div>
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Gold</h3>
            <p className="text-3xl font-bold text-yellow-400">{gold}</p>
          </div>
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Player Level</h3>
            <p className="text-3xl font-bold text-green-400">{playerLevel}</p>
          </div>
        </div>

        <div className="text-center text-gray-300 mb-4">
          <p>You've defeated your enemy and claimed victory!</p>
          <p>Continue to the next challenge or return to the main menu.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 flex gap-4"
      >
        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-bold px-8 py-3 text-lg rounded-full flex items-center"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <Button
          onClick={handleMainMenu}
          className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-8 py-3 text-lg rounded-full flex items-center"
        >
          <Home className="mr-2 h-5 w-5" />
          Main Menu
        </Button>
      </motion.div>
    </div>
  )
}
