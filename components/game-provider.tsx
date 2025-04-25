"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type GameContextType = {
  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  playerLevel: number
  playerXP: number
  playerGold: number
  inventory: string[]
  updatePlayerHealth: (amount: number) => void
  updatePlayerMana: (amount: number) => void
  addXP: (amount: number) => void
  addGold: (amount: number) => void
  addToInventory: (item: string) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerMaxHealth, setPlayerMaxHealth] = useState(100)
  const [playerMana, setPlayerMana] = useState(50)
  const [playerMaxMana, setPlayerMaxMana] = useState(50)
  const [playerLevel, setPlayerLevel] = useState(1)
  const [playerXP, setPlayerXP] = useState(0)
  const [playerGold, setPlayerGold] = useState(0)
  const [inventory, setInventory] = useState<string[]>([])

  const updatePlayerHealth = (amount: number) => {
    setPlayerHealth((prev) => {
      const newHealth = prev + amount
      return Math.max(0, Math.min(newHealth, playerMaxHealth))
    })
  }

  const updatePlayerMana = (amount: number) => {
    setPlayerMana((prev) => {
      const newMana = prev + amount
      return Math.max(0, Math.min(newMana, playerMaxMana))
    })
  }

  const addXP = (amount: number) => {
    setPlayerXP((prev) => {
      const newXP = prev + amount
      // Level up logic - every 100 XP is a level
      if (Math.floor(newXP / 100) > Math.floor(prev / 100)) {
        const newLevel = Math.floor(newXP / 100) + 1
        setPlayerLevel(newLevel)
        // Increase max health and mana on level up
        setPlayerMaxHealth(100 + (newLevel - 1) * 20)
        setPlayerMaxMana(50 + (newLevel - 1) * 10)
        // Restore health and mana on level up
        setPlayerHealth(100 + (newLevel - 1) * 20)
        setPlayerMana(50 + (newLevel - 1) * 10)
      }
      return newXP
    })
  }

  const addGold = (amount: number) => {
    setPlayerGold((prev) => prev + amount)
  }

  const addToInventory = (item: string) => {
    setInventory((prev) => [...prev, item])
  }

  // Load saved game data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("chronoClashGameData")
    if (savedData) {
      try {
        const { health, maxHealth, mana, maxMana, level, xp, gold, items } = JSON.parse(savedData)
        setPlayerHealth(health || 100)
        setPlayerMaxHealth(maxHealth || 100)
        setPlayerMana(mana || 50)
        setPlayerMaxMana(maxMana || 50)
        setPlayerLevel(level || 1)
        setPlayerXP(xp || 0)
        setPlayerGold(gold || 0)
        setInventory(items || [])
      } catch (e) {
        console.error("Error loading saved game data", e)
      }
    }
  }, [])

  // Save game data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "chronoClashGameData",
      JSON.stringify({
        health: playerHealth,
        maxHealth: playerMaxHealth,
        mana: playerMana,
        maxMana: playerMaxMana,
        level: playerLevel,
        xp: playerXP,
        gold: playerGold,
        items: inventory,
      }),
    )
  }, [playerHealth, playerMaxHealth, playerMana, playerMaxMana, playerLevel, playerXP, playerGold, inventory])

  return (
    <GameContext.Provider
      value={{
        playerHealth,
        playerMaxHealth,
        playerMana,
        playerMaxMana,
        playerLevel,
        playerXP,
        playerGold,
        inventory,
        updatePlayerHealth,
        updatePlayerMana,
        addXP,
        addGold,
        addToInventory,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
