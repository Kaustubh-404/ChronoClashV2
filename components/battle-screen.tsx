"use client"

import { useState, useEffect, useRef } from "react"
import { useGame } from "./game-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Zap, Shield, Sword, Heart, Droplet } from "lucide-react"
import { BattleAnimation } from "./battle-animation"
import { generateEnemy } from "@/lib/game-utils"
import type { Enemy, Ability } from "@/lib/game-types"
import type { JSX } from "react/jsx-runtime"

export function BattleScreen({
  character,
  level,
  onGameOver,
  onVictory,
}: {
  character: string
  level: number
  onGameOver: () => void
  onVictory: () => void
}) {
  const {
    playerHealth,
    playerMaxHealth,
    playerMana,
    playerMaxMana,
    updatePlayerHealth,
    updatePlayerMana,
    addXP,
    addGold,
  } = useGame()

  const [enemy, setEnemy] = useState<Enemy | null>(null)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [animation, setAnimation] = useState<{ type: string; target: "player" | "enemy" } | null>(null)
  const [turnCount, setTurnCount] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)

  const logEndRef = useRef<HTMLDivElement>(null)

  // Character abilities based on selected character
  const abilities: Ability[] = getCharacterAbilities(character)

  // Generate enemy based on level
  useEffect(() => {
    setEnemy(generateEnemy(level))
    addLog(`Battle started! Level ${level}`)
    addLog("Your turn. Choose an ability!")
  }, [level])

  // Scroll battle log to bottom when updated
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [battleLog])

  // Check for game over conditions
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      setIsGameOver(true)
      addLog("You have been defeated!")
      setTimeout(() => {
        onGameOver()
      }, 2000)
    }
  }, [playerHealth, isGameOver, onGameOver])

  useEffect(() => {
    if (enemy && enemy.health <= 0 && !isGameOver) {
      setIsGameOver(true)
      const xpGained = enemy.level * 25
      const goldGained = enemy.level * 10

      addLog(`You defeated ${enemy.name}!`)
      addLog(`Gained ${xpGained} XP and ${goldGained} gold!`)

      addXP(xpGained)
      addGold(goldGained)

      setTimeout(() => {
        onVictory()
      }, 2000)
    }
  }, [enemy, isGameOver, addXP, addGold, onVictory])

  // Enemy turn logic
  useEffect(() => {
    if (!playerTurn && enemy && enemy.health > 0 && playerHealth > 0) {
      const enemyTurnTimeout = setTimeout(() => {
        // Enemy selects a random ability
        const randomAbilityIndex = Math.floor(Math.random() * enemy.abilities.length)
        const enemyAbility = enemy.abilities[randomAbilityIndex]

        // Calculate damage based on enemy attack and player defense
        const baseDamage = enemyAbility.power
        const damage = Math.max(5, baseDamage)

        // Apply damage to player
        updatePlayerHealth(-damage)

        // Show animation
        setAnimation({ type: enemyAbility.type, target: "player" })

        // Add to battle log
        addLog(`${enemy.name} used ${enemyAbility.name}!`)
        addLog(`You took ${damage} damage!`)

        // Clear animation after a delay
        setTimeout(() => {
          setAnimation(null)
          // Switch back to player turn
          setPlayerTurn(true)
          setTurnCount((prev) => prev + 1)
          addLog("Your turn. Choose an ability!")
        }, 1000)
      }, 1500)

      return () => clearTimeout(enemyTurnTimeout)
    }
  }, [playerTurn, enemy, playerHealth, updatePlayerHealth])

  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message])
  }

  const handleAbilitySelect = (ability: Ability) => {
    if (!playerTurn || isGameOver || !enemy) return

    setSelectedAbility(ability)

    // Check if player has enough mana
    if (playerMana < ability.manaCost) {
      addLog(`Not enough mana to use ${ability.name}!`)
      return
    }

    // Calculate damage based on ability power, player attack, and enemy defense
    const baseDamage = ability.power
    let damage = Math.max(5, baseDamage)

    // Apply special ability effects
    if (ability.type === "time" && ability.name === "Time Stop") {
      // Time Stop: Extra turn
      addLog("Time stopped! You get an extra turn!")
      setTurnCount((prev) => prev + 1)
    } else if (ability.type === "lightning" && ability.name === "Chain Attack") {
      // Chain Attack: Multiple hits
      damage = Math.floor(damage * 0.6)
      const hits = 3
      damage = damage * hits
      addLog(`${ability.name} hit ${hits} times!`)
    }

    // Apply damage to enemy
    const newEnemyHealth = Math.max(0, enemy.health - damage)
    setEnemy({
      ...enemy,
      health: newEnemyHealth,
    })

    // Use mana
    updatePlayerMana(-ability.manaCost)

    // Show animation
    setAnimation({ type: ability.type, target: "enemy" })

    // Add to battle log
    addLog(`You used ${ability.name}!`)
    addLog(`${enemy.name} took ${damage} damage!`)

    // Clear animation and selected ability after a delay
    setTimeout(() => {
      setAnimation(null)
      setSelectedAbility(null)

      // Switch to enemy turn if enemy is still alive
      if (newEnemyHealth > 0) {
        setPlayerTurn(false)
        addLog(`${enemy.name}'s turn...`)
      }
    }, 1000)
  }

  if (!enemy) {
    return <div className="text-center">Loading battle...</div>
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Stats */}
        <Card className="bg-gray-800 border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center mr-3">
                {getCharacterIcon(character)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{getCharacterName(character)}</h2>
                <div className="text-sm text-gray-400">Level {level}</div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm">Health</span>
                  </div>
                  <span className="text-sm">
                    {playerHealth}/{playerMaxHealth}
                  </span>
                </div>
                <Progress
                  value={(playerHealth / playerMaxHealth) * 100}
                  className="h-2 bg-gray-700"
                  indicatorClassName="bg-gradient-to-r from-red-500 to-red-700"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Droplet className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">Mana</span>
                  </div>
                  <span className="text-sm">
                    {playerMana}/{playerMaxMana}
                  </span>
                </div>
                <Progress
                  value={(playerMana / playerMaxMana) * 100}
                  className="h-2 bg-gray-700"
                  indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Abilities:</h3>
              {abilities.map((ability) => (
                <Button
                  key={ability.name}
                  onClick={() => handleAbilitySelect(ability)}
                  disabled={!playerTurn || playerMana < ability.manaCost || isGameOver}
                  className={`w-full justify-start text-left mb-2 ${
                    selectedAbility?.name === ability.name
                      ? "bg-purple-700 hover:bg-purple-800"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getAbilityColor(ability.type)}`}
                    >
                      {getAbilityIcon(ability.type)}
                    </div>
                    <div>
                      <div className="font-medium">{ability.name}</div>
                      <div className="text-xs flex items-center">
                        <Sword className="h-3 w-3 mr-1 text-red-400" />
                        {ability.power}
                        <Droplet className="h-3 w-3 ml-2 mr-1 text-blue-400" />
                        {ability.manaCost}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Battle Area */}
        <Card className="bg-gray-800 border-purple-700 lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">
                <span className="text-purple-400">Turn {turnCount}</span> • {playerTurn ? "Your Turn" : "Enemy Turn"}
              </div>
              <div className="text-sm">Level {level} Battle</div>
            </div>

            <div className="relative h-64 mb-4 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden">
              {/* Battle Animations */}
              {animation && <BattleAnimation type={animation.type} target={animation.target} />}

              {/* Enemy */}
              <div
                className={`absolute top-4 right-8 transition-all duration-300 ${animation?.target === "enemy" ? "animate-hit" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center mb-2 relative">
                    {enemy.icon}

                    {/* Enemy Health Bar */}
                    <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20">
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-red-500 to-red-700 rounded-full transition-all duration-300"
                          style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{enemy.name}</div>
                    <div className="text-xs text-gray-400">Level {enemy.level}</div>
                  </div>
                </div>
              </div>

              {/* Player Character */}
              <div
                className={`absolute bottom-4 left-8 transition-all duration-300 ${animation?.target === "player" ? "animate-hit" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center mb-2 relative">
                    {getCharacterIcon(character)}

                    {/* Player Health Bar */}
                    <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20">
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-green-500 to-green-700 rounded-full transition-all duration-300"
                          style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{getCharacterName(character)}</div>
                    <div className="text-xs text-gray-400">Level {level}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Log */}
            <div className="bg-gray-900 rounded-lg p-3 h-40 overflow-y-auto">
              <div className="space-y-1">
                {battleLog.map((log, index) => (
                  <div key={index} className="text-sm">
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions
function getCharacterName(characterId: string): string {
  switch (characterId) {
    case "chronos":
      return "Chronos"
    case "tempest":
      return "Tempest"
    case "guardian":
      return "Guardian"
    default:
      return "Hero"
  }
}

function getCharacterIcon(characterId: string): JSX.Element {
  switch (characterId) {
    case "chronos":
      return <Clock className="h-8 w-8" />
    case "tempest":
      return <Zap className="h-8 w-8" />
    case "guardian":
      return <Shield className="h-8 w-8" />
    default:
      return <Sword className="h-8 w-8" />
  }
}

function getCharacterAbilities(characterId: string): Ability[] {
  switch (characterId) {
    case "chronos":
      return [
        { name: "Time Strike", type: "time", power: 20, manaCost: 10 },
        { name: "Temporal Blast", type: "time", power: 35, manaCost: 25 },
        { name: "Time Stop", type: "time", power: 15, manaCost: 40 },
      ]
    case "tempest":
      return [
        { name: "Lightning Strike", type: "lightning", power: 25, manaCost: 15 },
        { name: "Speed Burst", type: "lightning", power: 20, manaCost: 20 },
        { name: "Chain Attack", type: "lightning", power: 15, manaCost: 35 },
      ]
    case "guardian":
      return [
        { name: "Shield Bash", type: "shield", power: 15, manaCost: 10 },
        { name: "Protective Aura", type: "shield", power: 10, manaCost: 20 },
        { name: "Temporal Barrier", type: "shield", power: 30, manaCost: 30 },
      ]
    default:
      return [
        { name: "Attack", type: "physical", power: 15, manaCost: 0 },
        { name: "Defend", type: "physical", power: 5, manaCost: 0 },
        { name: "Special", type: "physical", power: 25, manaCost: 20 },
      ]
  }
}

function getAbilityIcon(type: string): JSX.Element {
  switch (type) {
    case "time":
      return <Clock className="h-4 w-4" />
    case "lightning":
      return <Zap className="h-4 w-4" />
    case "shield":
      return <Shield className="h-4 w-4" />
    default:
      return <Sword className="h-4 w-4" />
  }
}

function getAbilityColor(type: string): string {
  switch (type) {
    case "time":
      return "bg-purple-700"
    case "lightning":
      return "bg-yellow-700"
    case "shield":
      return "bg-blue-700"
    default:
      return "bg-red-700"
  }
}
