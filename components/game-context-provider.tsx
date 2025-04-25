"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type GameContextType = {
  playerLevel: number
  playerXP: number
  playerCoins: number
  increaseXP: (amount: number) => void
  increaseCoins: (amount: number) => void
  playerName: string
  setPlayerName: (name: string) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  const [playerLevel, setPlayerLevel] = useState(1)
  const [playerXP, setPlayerXP] = useState(0)
  const [playerCoins, setPlayerCoins] = useState(100)
  const [playerName, setPlayerName] = useState("Chronos")

  const increaseXP = (amount: number) => {
    setPlayerXP((prev) => {
      const newXP = prev + amount
      // Level up logic - every 100 XP is a level
      if (Math.floor(newXP / 100) > Math.floor(prev / 100)) {
        setPlayerLevel(Math.floor(newXP / 100) + 1)
      }
      return newXP
    })
  }

  const increaseCoins = (amount: number) => {
    setPlayerCoins((prev) => prev + amount)
  }

  // Load saved game data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("chronoClashGameData")
    if (savedData) {
      const { level, xp, coins, name } = JSON.parse(savedData)
      setPlayerLevel(level || 1)
      setPlayerXP(xp || 0)
      setPlayerCoins(coins || 100)
      setPlayerName(name || "Chronos")
    }
  }, [])

  // Save game data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "chronoClashGameData",
      JSON.stringify({
        level: playerLevel,
        xp: playerXP,
        coins: playerCoins,
        name: playerName,
      }),
    )
  }, [playerLevel, playerXP, playerCoins, playerName])

  return (
    <GameContext.Provider
      value={{
        playerLevel,
        playerXP,
        playerCoins,
        increaseXP,
        increaseCoins,
        playerName,
        setPlayerName,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameContextProvider")
  }
  return context
}
