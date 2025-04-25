"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Character = {
  id: string
  name: string
  avatar: string
  health: number
  mana: number
  abilities: Ability[]
  description: string
}

export type Ability = {
  id: string
  name: string
  damage: number
  manaCost: number
  cooldown: number
  currentCooldown: number
  type: "fire" | "ice" | "lightning" | "time" | "physical"
  description: string
  soundEffect: string
}

export type Enemy = {
  id: string
  name: string
  avatar: string
  health: number
  maxHealth: number
  abilities: Ability[]
  level: number
}

type GameState = {
  score: number
  highScore: number
  level: number
  gold: number
  selectedCharacter: Character | null
  currentEnemy: Enemy | null
  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  experience: number
  experienceToNextLevel: number
  playerLevel: number
  inventory: string[]
  achievements: string[]
  battleLog: string[]
  selectCharacter: (character: Character) => void
  increaseScore: (amount: number) => void
  increaseGold: (amount: number) => void
  updatePlayerHealth: (amount: number) => void
  updatePlayerMana: (amount: number) => void
  setCurrentEnemy: (enemy: Enemy) => void
  damageEnemy: (amount: number) => void
  addToBattleLog: (message: string) => void
  resetBattleLog: () => void
  resetGame: () => void
  levelUp: () => void
  gainExperience: (amount: number) => void
}

const GameStateContext = createContext<GameState | undefined>(undefined)

export const useGameState = () => {
  const context = useContext(GameStateContext)
  if (!context) {
    throw new Error("useGameState must be used within a GameStateProvider")
  }
  return context
}

const CHARACTERS: Character[] = [
  {
    id: "chronos",
    name: "Chronos",
    avatar: "/images/chronos.png",
    health: 100,
    mana: 100,
    description: "Master of time with powerful temporal abilities",
    abilities: [
      {
        id: "time-slash",
        name: "Time Slash",
        damage: 15,
        manaCost: 10,
        cooldown: 1,
        currentCooldown: 0,
        type: "time",
        description: "A quick slash that cuts through time",
        soundEffect: "time-slash.mp3",
      },
      {
        id: "temporal-blast",
        name: "Temporal Blast",
        damage: 30,
        manaCost: 25,
        cooldown: 3,
        currentCooldown: 0,
        type: "time",
        description: "A powerful blast of temporal energy",
        soundEffect: "temporal-blast.mp3",
      },
      {
        id: "time-freeze",
        name: "Time Freeze",
        damage: 20,
        manaCost: 40,
        cooldown: 5,
        currentCooldown: 0,
        type: "time",
        description: "Freezes time around the enemy",
        soundEffect: "time-freeze.mp3",
      },
    ],
  },
  {
    id: "pyromancer",
    name: "Pyromancer",
    avatar: "/images/pyromancer.png",
    health: 85,
    mana: 120,
    description: "Wields the destructive power of fire",
    abilities: [
      {
        id: "fireball",
        name: "Fireball",
        damage: 20,
        manaCost: 15,
        cooldown: 1,
        currentCooldown: 0,
        type: "fire",
        description: "Launches a ball of fire at the enemy",
        soundEffect: "fireball.mp3",
      },
      {
        id: "flame-wave",
        name: "Flame Wave",
        damage: 35,
        manaCost: 30,
        cooldown: 3,
        currentCooldown: 0,
        type: "fire",
        description: "Sends a wave of fire toward the enemy",
        soundEffect: "flame-wave.mp3",
      },
      {
        id: "inferno",
        name: "Inferno",
        damage: 50,
        manaCost: 45,
        cooldown: 5,
        currentCooldown: 0,
        type: "fire",
        description: "Summons a raging inferno to engulf the enemy",
        soundEffect: "inferno.mp3",
      },
    ],
  },
  {
    id: "stormcaller",
    name: "Stormcaller",
    avatar: "/images/stormcaller.png",
    health: 90,
    mana: 110,
    description: "Commands the power of lightning and storms",
    abilities: [
      {
        id: "lightning-bolt",
        name: "Lightning Bolt",
        damage: 18,
        manaCost: 12,
        cooldown: 1,
        currentCooldown: 0,
        type: "lightning",
        description: "Strikes the enemy with a bolt of lightning",
        soundEffect: "lightning-bolt.mp3",
      },
      {
        id: "chain-lightning",
        name: "Chain Lightning",
        damage: 28,
        manaCost: 25,
        cooldown: 3,
        currentCooldown: 0,
        type: "lightning",
        description: "Lightning that jumps between multiple targets",
        soundEffect: "chain-lightning.mp3",
      },
      {
        id: "thunderstorm",
        name: "Thunderstorm",
        damage: 45,
        manaCost: 40,
        cooldown: 5,
        currentCooldown: 0,
        type: "lightning",
        description: "Calls down a devastating storm of lightning",
        soundEffect: "thunderstorm.mp3",
      },
    ],
  },
]

const ENEMIES: Enemy[] = [
  {
    id: "time-wraith",
    name: "Time Wraith",
    avatar: "/images/time-wraith.png",
    health: 80,
    maxHealth: 80,
    level: 1,
    abilities: [
      {
        id: "temporal-drain",
        name: "Temporal Drain",
        damage: 10,
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        type: "time",
        description: "Drains temporal energy",
        soundEffect: "temporal-drain.mp3",
      },
    ],
  },
  {
    id: "flame-elemental",
    name: "Flame Elemental",
    avatar: "/images/flame-elemental.png",
    health: 100,
    maxHealth: 100,
    level: 2,
    abilities: [
      {
        id: "fire-touch",
        name: "Fire Touch",
        damage: 15,
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        type: "fire",
        description: "Burns with a fiery touch",
        soundEffect: "fire-touch.mp3",
      },
    ],
  },
  {
    id: "chrono-guardian",
    name: "Chrono Guardian",
    avatar: "/images/chrono-guardian.png",
    health: 150,
    maxHealth: 150,
    level: 3,
    abilities: [
      {
        id: "time-crush",
        name: "Time Crush",
        damage: 20,
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        type: "time",
        description: "Crushes with the weight of time",
        soundEffect: "time-crush.mp3",
      },
    ],
  },
]

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gold, setGold] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerMaxHealth, setPlayerMaxHealth] = useState(100)
  const [playerMana, setPlayerMana] = useState(100)
  const [playerMaxMana, setPlayerMaxMana] = useState(100)
  const [experience, setExperience] = useState(0)
  const [experienceToNextLevel, setExperienceToNextLevel] = useState(100)
  const [playerLevel, setPlayerLevel] = useState(1)
  const [inventory, setInventory] = useState<string[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [battleLog, setBattleLog] = useState<string[]>([])

  // Load saved game state from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("chronoClash_highScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  // Save high score to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chronoClash_highScore", highScore.toString())
  }, [highScore])

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setPlayerHealth(character.health)
    setPlayerMaxHealth(character.health)
    setPlayerMana(character.mana)
    setPlayerMaxMana(character.mana)

    // Set initial enemy based on level
    const enemy = { ...ENEMIES[0] }
    setCurrentEnemy(enemy)
  }

  const increaseScore = (amount: number) => {
    const newScore = score + amount
    setScore(newScore)
    if (newScore > highScore) {
      setHighScore(newScore)
    }
  }

  const increaseGold = (amount: number) => {
    setGold(gold + amount)
  }

  const updatePlayerHealth = (amount: number) => {
    const newHealth = Math.min(playerMaxHealth, Math.max(0, playerHealth + amount))
    setPlayerHealth(newHealth)
  }

  const updatePlayerMana = (amount: number) => {
    const newMana = Math.min(playerMaxMana, Math.max(0, playerMana + amount))
    setPlayerMana(newMana)
  }

  const damageEnemy = (amount: number) => {
    if (currentEnemy) {
      const newHealth = Math.max(0, currentEnemy.health - amount)
      setCurrentEnemy({
        ...currentEnemy,
        health: newHealth,
      })
    }
  }

  const addToBattleLog = (message: string) => {
    setBattleLog((prev) => [...prev, message])
  }

  const resetBattleLog = () => {
    setBattleLog([])
  }

  const resetGame = () => {
    setScore(0)
    setLevel(1)
    setGold(0)
    setSelectedCharacter(null)
    setCurrentEnemy(null)
    setPlayerHealth(100)
    setPlayerMaxHealth(100)
    setPlayerMana(100)
    setPlayerMaxMana(100)
    setExperience(0)
    setExperienceToNextLevel(100)
    setPlayerLevel(1)
    setInventory([])
    setBattleLog([])
  }

  const levelUp = () => {
    setPlayerLevel(playerLevel + 1)
    setPlayerMaxHealth((prevMax) => Math.floor(prevMax * 1.2))
    setPlayerHealth((prevMax) => Math.floor(prevMax * 1.2))
    setPlayerMaxMana((prevMax) => Math.floor(prevMax * 1.1))
    setPlayerMana((prevMax) => Math.floor(prevMax * 1.1))
    setExperienceToNextLevel((prev) => Math.floor(prev * 1.5))
  }

  const gainExperience = (amount: number) => {
    const newExperience = experience + amount
    if (newExperience >= experienceToNextLevel) {
      setExperience(newExperience - experienceToNextLevel)
      levelUp()
    } else {
      setExperience(newExperience)
    }
  }

  return (
    <GameStateContext.Provider
      value={{
        score,
        highScore,
        level,
        gold,
        selectedCharacter,
        currentEnemy,
        playerHealth,
        playerMaxHealth,
        playerMana,
        playerMaxMana,
        experience,
        experienceToNextLevel,
        playerLevel,
        inventory,
        achievements,
        battleLog,
        selectCharacter,
        increaseScore,
        increaseGold,
        updatePlayerHealth,
        updatePlayerMana,
        setCurrentEnemy,
        damageEnemy,
        addToBattleLog,
        resetBattleLog,
        resetGame,
        levelUp,
        gainExperience,
      }}
    >
      {children}
    </GameStateContext.Provider>
  )
}
