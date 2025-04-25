"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Droplet, Sword, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameState } from "./game-state-provider"
import { playSound } from "@/lib/sound-utils"
import BattleEffects from "./battle-effects"

interface GameScreenProps {
  onGameOver: () => void
  onVictory: () => void
  onExit: () => void
}

export default function GameScreen({ onGameOver, onVictory, onExit }: GameScreenProps) {
  const {
    selectedCharacter,
    currentEnemy,
    playerHealth,
    playerMaxHealth,
    playerMana,
    playerMaxMana,
    score,
    level,
    gold,
    experience,
    experienceToNextLevel,
    playerLevel,
    battleLog,
    updatePlayerHealth,
    updatePlayerMana,
    damageEnemy,
    increaseScore,
    increaseGold,
    gainExperience,
    addToBattleLog,
    resetBattleLog,
  } = useGameState()

  const [playerTurn, setPlayerTurn] = useState(true)
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)
  const [abilityAnimation, setAbilityAnimation] = useState<string | null>(null)
  const [enemyAnimation, setEnemyAnimation] = useState<string | null>(null)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [turnCount, setTurnCount] = useState(1)
  const [comboCounter, setComboCounter] = useState(0)
  const [showComboText, setShowComboText] = useState(false)

  const battleLogRef = useRef<HTMLDivElement>(null)

  // Scroll battle log to bottom when updated
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Check for game over or victory
  useEffect(() => {
    if (playerHealth <= 0) {
      addToBattleLog("You have been defeated!")
      setTimeout(() => {
        onGameOver()
      }, 2000)
    }

    if (currentEnemy && currentEnemy.health <= 0) {
      const expGained = currentEnemy.level * 25
      const goldGained = currentEnemy.level * 15
      const scoreGained = currentEnemy.level * 100

      addToBattleLog(`You defeated ${currentEnemy.name}!`)
      addToBattleLog(`Gained ${expGained} XP and ${goldGained} gold!`)

      increaseScore(scoreGained)
      increaseGold(goldGained)
      gainExperience(expGained)

      setTimeout(() => {
        onVictory()
      }, 2000)
    }
  }, [playerHealth, currentEnemy, addToBattleLog, onGameOver, onVictory, increaseScore, increaseGold, gainExperience])

  // Enemy turn logic
  useEffect(() => {
    if (!playerTurn && currentEnemy && currentEnemy.health > 0 && playerHealth > 0) {
      const enemyTurnTimeout = setTimeout(() => {
        // Enemy selects a random ability
        const randomAbilityIndex = Math.floor(Math.random() * currentEnemy.abilities.length)
        const enemyAbility = currentEnemy.abilities[randomAbilityIndex]

        // Calculate damage
        const damage = Math.max(5, enemyAbility.damage)

        // Play enemy attack sound
        playSound(enemyAbility.soundEffect)

        // Show enemy attack animation
        setEnemyAnimation(enemyAbility.type)

        // Add to battle log
        addToBattleLog(`${currentEnemy.name} used ${enemyAbility.name}!`)

        // Delay damage to match animation
        setTimeout(() => {
          updatePlayerHealth(-damage)
          addToBattleLog(`You took ${damage} damage!`)

          // Reset combo if hit
          setComboCounter(0)

          // Clear animation after a delay
          setTimeout(() => {
            setEnemyAnimation(null)
            // Switch back to player turn
            setPlayerTurn(true)
            setTurnCount((prev) => prev + 1)
            addToBattleLog("Your turn!")
          }, 500)
        }, 500)
      }, 1500)

      return () => clearTimeout(enemyTurnTimeout)
    }
  }, [playerTurn, currentEnemy, playerHealth, updatePlayerHealth, addToBattleLog])

  const handleAbilitySelect = (abilityId: string) => {
    if (!playerTurn || !currentEnemy || !selectedCharacter) return

    const ability = selectedCharacter.abilities.find((a) => a.id === abilityId)
    if (!ability) return

    setSelectedAbility(abilityId)

    // Check if player has enough mana
    if (playerMana < ability.manaCost) {
      addToBattleLog(`Not enough mana to use ${ability.name}!`)
      setSelectedAbility(null)
      return
    }

    // Use the ability
    updatePlayerMana(-ability.manaCost)

    // Play ability sound
    playSound(ability.soundEffect)

    // Show ability animation
    setAbilityAnimation(ability.type)

    // Add to battle log
    addToBattleLog(`You used ${ability.name}!`)

    // Increase combo counter
    const newCombo = comboCounter + 1
    setComboCounter(newCombo)

    if (newCombo > 1) {
      setShowComboText(true)
      setTimeout(() => setShowComboText(false), 1500)
    }

    // Calculate damage with combo bonus
    const comboMultiplier = 1 + newCombo * 0.1
    const damage = Math.floor(ability.damage * comboMultiplier)

    // Delay damage to match animation
    setTimeout(() => {
      damageEnemy(damage)

      // Add combo text to battle log if applicable
      if (newCombo > 1) {
        addToBattleLog(`${newCombo}x COMBO! ${damage} damage!`)
      } else {
        addToBattleLog(`${currentEnemy.name} took ${damage} damage!`)
      }

      // Clear animation and selected ability after a delay
      setTimeout(() => {
        setAbilityAnimation(null)
        setSelectedAbility(null)

        // Switch to enemy turn if enemy is still alive
        if (currentEnemy.health - damage > 0) {
          setPlayerTurn(false)
          addToBattleLog(`${currentEnemy.name}'s turn...`)
        }
      }, 500)
    }, 500)
  }

  const togglePauseMenu = () => {
    playSound("button-click.mp3")
    setShowPauseMenu(!showPauseMenu)
  }

  const handleExitGame = () => {
    playSound("button-click.mp3")
    resetBattleLog()
    onExit()
  }

  if (!selectedCharacter || !currentEnemy) {
    return <div className="flex items-center justify-center min-h-screen">Loading battle...</div>
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-gray-900"
      style={{
        backgroundImage: `url(/images/battle-background.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Battle UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
        {/* Player Stats */}
        <div className="bg-black/70 p-3 rounded-lg w-64">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 p-0.5 mr-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                <img
                  src={selectedCharacter.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={selectedCharacter.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white">{selectedCharacter.name}</h3>
              <div className="text-xs text-gray-300">Level {playerLevel}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center">
                  <Heart className="h-3 w-3 text-red-500 mr-1" />
                  <span>HP</span>
                </div>
                <span>
                  {playerHealth}/{playerMaxHealth}
                </span>
              </div>
              <Progress
                value={(playerHealth / playerMaxHealth) * 100}
                className="h-2 bg-gray-700"
                indicatorClassName="bg-red-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center">
                  <Droplet className="h-3 w-3 text-blue-500 mr-1" />
                  <span>MP</span>
                </div>
                <span>
                  {playerMana}/{playerMaxMana}
                </span>
              </div>
              <Progress
                value={(playerMana / playerMaxMana) * 100}
                className="h-2 bg-gray-700"
                indicatorClassName="bg-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span>XP</span>
                <span>
                  {experience}/{experienceToNextLevel}
                </span>
              </div>
              <Progress
                value={(experience / experienceToNextLevel) * 100}
                className="h-2 bg-gray-700"
                indicatorClassName="bg-green-500"
              />
            </div>
          </div>
        </div>

        {/* Battle Info */}
        <div className="bg-black/70 p-3 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-300">Turn</div>
              <div className="font-bold text-yellow-400">{turnCount}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-gray-300">Score</div>
              <div className="font-bold text-yellow-400">{score}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-gray-300">Gold</div>
              <div className="font-bold text-yellow-400">{gold}</div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePauseMenu}
              className="bg-gray-800/90 hover:bg-gray-700/90 ml-2"
            >
              Menu
            </Button>
          </div>
        </div>

        {/* Enemy Stats */}
        <div className="bg-black/70 p-3 rounded-lg w-64">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 mr-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                <img
                  src={currentEnemy.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={currentEnemy.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white">{currentEnemy.name}</h3>
              <div className="text-xs text-gray-300">Level {currentEnemy.level}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <div className="flex items-center">
                <Heart className="h-3 w-3 text-red-500 mr-1" />
                <span>HP</span>
              </div>
              <span>
                {currentEnemy.health}/{currentEnemy.maxHealth}
              </span>
            </div>
            <Progress
              value={(currentEnemy.health / currentEnemy.maxHealth) * 100}
              className="h-2 bg-gray-700"
              indicatorClassName="bg-red-500"
            />
          </div>

          <div className="flex justify-between mt-2 text-xs">
            <div className="flex items-center">
              <Sword className="h-3 w-3 text-orange-500 mr-1" />
              <span>Attack: {currentEnemy.level * 10 + 10}</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-3 w-3 text-blue-500 mr-1" />
              <span>Def: {currentEnemy.level * 5 + 5}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Battle Effects */}
        <BattleEffects playerAnimation={abilityAnimation} enemyAnimation={enemyAnimation} />

        {/* Enemy */}
        <motion.div
          className="absolute right-1/4 top-1/3"
          animate={enemyAnimation ? { x: [-10, 10, -5, 5, 0], y: [-5, 5, -2, 2, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                repeatType: "reverse",
              }}
            >
              <img
                src={currentEnemy.avatar || "/placeholder.svg?height=200&width=200"}
                alt={currentEnemy.name}
                className="w-40 h-40 object-contain filter drop-shadow-lg"
              />
            </motion.div>

            {/* Enemy Health Bar */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32">
              <div className="h-2 bg-gray-900/80 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${(currentEnemy.health / currentEnemy.maxHealth) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player Character */}
        <motion.div
          className="absolute left-1/4 bottom-1/3"
          animate={abilityAnimation ? { rotate: [-2, 2, -1, 1, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                repeatType: "reverse",
              }}
            >
              <img
                src={selectedCharacter.avatar || "/placeholder.svg?height=200&width=200"}
                alt={selectedCharacter.name}
                className="w-40 h-40 object-contain filter drop-shadow-lg"
              />
            </motion.div>

            {/* Player Health Bar */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32">
              <div className="h-2 bg-gray-900/80 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Combo Text */}
        <AnimatePresence>
          {showComboText && comboCounter > 1 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 0 }}
              animate={{ scale: 1.5, opacity: 1, y: -50 }}
              exit={{ scale: 0.5, opacity: 0, y: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="text-4xl font-bold text-yellow-400 filter drop-shadow-lg">{comboCounter}x COMBO!</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Battle Log */}
      <div
        ref={battleLogRef}
        className="absolute bottom-32 left-4 w-64 h-40 bg-black/70 rounded-lg p-3 overflow-y-auto text-sm"
      >
        {battleLog.map((log, index) => (
          <div key={index} className="mb-1">
            {log}
          </div>
        ))}
      </div>

      {/* Abilities */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80">
        <div className="grid grid-cols-3 gap-3">
          {selectedCharacter.abilities.map((ability) => (
            <Button
              key={ability.id}
              onClick={() => handleAbilitySelect(ability.id)}
              disabled={!playerTurn || playerMana < ability.manaCost}
              className={`
                relative p-3 h-auto text-left
                ${selectedAbility === ability.id ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-700"}
                ${playerMana < ability.manaCost ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div>
                <div className="font-bold mb-1">{ability.name}</div>
                <div className="text-xs text-gray-300 mb-2">{ability.description}</div>
                <div className="flex justify-between text-xs">
                  <div className="flex items-center">
                    <Sword className="h-3 w-3 text-red-400 mr-1" />
                    <span>{ability.damage}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplet className="h-3 w-3 text-blue-400 mr-1" />
                    <span>{ability.manaCost}</span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Pause Menu */}
      <AnimatePresence>
        {showPauseMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-8 rounded-lg w-80"
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">Game Paused</h2>

              <div className="space-y-4">
                <Button
                  onClick={togglePauseMenu}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                >
                  Resume Game
                </Button>

                <Button onClick={handleExitGame} className="w-full bg-red-600 hover:bg-red-700">
                  Exit to Main Menu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
