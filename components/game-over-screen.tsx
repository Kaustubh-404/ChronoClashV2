"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useGameState } from "./game-state-provider"
import { playSound } from "@/lib/sound-utils"
import { Skull, RotateCcw, Home } from "lucide-react"

interface GameOverProps {
  onRestart: () => void
  onMainMenu: () => void
}

export default function GameOver({ onRestart, onMainMenu }: GameOverProps) {
  const { score, highScore, level, gold } = useGameState()
  const [isNewHighScore, setIsNewHighScore] = useState(false)

  useEffect(() => {
    // Play game over sound
    playSound("game-over.mp3")

    // Check if this is a new high score
    if (score > 0 && score >= highScore) {
      setIsNewHighScore(true)
      playSound("high-score.mp3")
    }
  }, [score, highScore])

  const handleRestart = () => {
    playSound("button-click.mp3")
    onRestart()
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8 flex flex-col items-center"
      >
        <Skull className="h-24 w-24 text-red-500 mb-4" />
        <h1 className="text-6xl font-bold text-center text-red-500 mb-2">GAME OVER</h1>
        {isNewHighScore && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-center text-yellow-400">NEW HIGH SCORE!</h2>
          </motion.div>
        )}
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
            <h3 className="text-gray-400 mb-1">High Score</h3>
            <p className="text-3xl font-bold text-yellow-400">{highScore}</p>
          </div>
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Level</h3>
            <p className="text-3xl font-bold text-blue-400">{level}</p>
          </div>
          <div className="text-center">
            <h3 className="text-gray-400 mb-1">Gold</h3>
            <p className="text-3xl font-bold text-yellow-400">{gold}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 flex gap-4"
      >
        <Button
          onClick={handleRestart}
          className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white px-8 py-3 text-lg rounded-full flex items-center"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Try Again
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
