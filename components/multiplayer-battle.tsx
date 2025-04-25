"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Droplet, Sword, Shield, Home } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMultiplayer } from "./multiplayer-context-provider"
import { useGameState } from "./game-state-provider"
import { playSound } from "@/lib/sound-utils"
import BattleEffects from "./battle-effects"

interface MultiplayerBattleProps {
  onGameOver: () => void
  onVictory: () => void
  onExit: () => void
}

export default function MultiplayerBattle({ onGameOver, onVictory, onExit }: MultiplayerBattleProps) {
  const { 
    isHost, 
    playerId, 
    playerName, 
    currentRoom, 
    leaveRoom, 
    updateOpponentHealth, 
    endBattle 
  } = useMultiplayer()
  
  const { 
    selectedCharacter, 
    playerHealth, 
    playerMaxHealth, 
    playerMana, 
    playerMaxMana, 
    updatePlayerHealth, 
    updatePlayerMana, 
    addToBattleLog, 
    battleLog 
  } = useGameState()
  
  // Opponent data
  const opponentName = isHost ? currentRoom?.guestName : currentRoom?.hostName
  const opponentCharacter = isHost ? currentRoom?.guestCharacter : currentRoom?.hostCharacter
  
  // Battle state
  const [opponentHealth, setOpponentHealth] = useState(opponentCharacter?.health || 100)
  const [opponentMaxHealth, setOpponentMaxHealth] = useState(opponentCharacter?.health || 100)
  const [opponentMana, setOpponentMana] = useState(opponentCharacter?.mana || 100)
  const [opponentMaxMana, setOpponentMaxMana] = useState(opponentCharacter?.mana || 100)
  const [playerTurn, setPlayerTurn] = useState(isHost) // Host goes first
  const [turnCount, setTurnCount] = useState(1)
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)
  const [playerAnimation, setPlayerAnimation] = useState<string | null>(null)
  const [opponentAnimation, setOpponentAnimation] = useState<string | null>(null)
  const [comboCounter, setComboCounter] = useState(0)
  const [showComboText, setShowComboText] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  
  const battleLogRef = useRef<HTMLDivElement>(null)

  // Scroll battle log to bottom when updated
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Initialize battle state
  useEffect(() => {
    if (!opponentCharacter) {
      console.error("Opponent character not found");
      return;
    }
    
    // Set initial opponent health and mana
    setOpponentHealth(opponentCharacter.health);
    setOpponentMaxHealth(opponentCharacter.health);
    setOpponentMana(opponentCharacter.mana);
    setOpponentMaxMana(opponentCharacter.mana);
    
    // Add initial battle log messages
    addToBattleLog("Battle started!");
    addToBattleLog(`${isHost ? "You" : opponentName} goes first!`);
    
  }, [opponentCharacter, isHost, opponentName, addToBattleLog]);

  // Listen for game actions from opponent
  useEffect(() => {
    const handleGameAction = (e: CustomEvent) => {
      if (!e.detail) return;
      
      const { 
        playerId: actingPlayerId, 
        action, 
        result 
      } = e.detail;
      
      // Only process actions from opponent
      if (actingPlayerId === playerId) return;
      
      // Handle ability
      if (action?.type === 'ability' && result?.ability) {
        // Set opponent animation
        setOpponentAnimation(result.ability.type);
        
        // Play ability sound
        playSound(result.ability.soundEffect || 'ability.mp3');
        
        // Add to battle log
        addToBattleLog(`${opponentName} used ${result.ability.name || 'an ability'}!`);
        
        // Delay damage to match animation
        setTimeout(() => {
          // Apply damage to player
          if (result.damage) {
            updatePlayerHealth(-result.damage);
            addToBattleLog(`You took ${result.damage} damage!`);
          }
          
          // Reset combo if hit
          setComboCounter(0);
          
          // Clear animation after a delay
          setTimeout(() => {
            setOpponentAnimation(null);
            
            // Switch to player turn
            setPlayerTurn(true);
            setTurnCount(prev => prev + 1);
            addToBattleLog("Your turn!");
          }, 500);
        }, 500);
      }
      
      // Handle surrender
      else if (action?.type === 'surrender') {
        // Opponent surrendered
        addToBattleLog(`${opponentName} surrendered!`);
        setTimeout(() => onVictory(), 1500);
      }
    };
    
    // Add event listener (with type assertion)
    window.addEventListener("game_action_performed", handleGameAction as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener("game_action_performed", handleGameAction as EventListener);
    };
  }, [playerId, opponentName, updatePlayerHealth, addToBattleLog, onVictory]);

  // Check for game over conditions
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
      addToBattleLog("You have been defeated!");
      
      setTimeout(() => onGameOver(), 2000);
    }

    if (opponentHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
      addToBattleLog(`You defeated ${opponentName}!`);
      
      // End battle and declare victory
      endBattle(playerId);
      
      setTimeout(() => onVictory(), 2000);
    }
  }, [playerHealth, opponentHealth, isGameOver, playerId, opponentName, endBattle, addToBattleLog, onGameOver, onVictory]);

  const handleAbilitySelect = (abilityId: string) => {
    if (!playerTurn || isGameOver || !selectedCharacter) return;
    
    const ability = selectedCharacter.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    setSelectedAbility(abilityId);
    
    // Check if player has enough mana
    if (playerMana < ability.manaCost) {
      addToBattleLog(`Not enough mana to use ${ability.name}!`);
      setSelectedAbility(null);
      return;
    }
    
    // Use the ability
    updatePlayerMana(-ability.manaCost);
    
    // Play ability sound
    playSound(ability.soundEffect);
    
    // Show ability animation
    setPlayerAnimation(ability.type);
    
    // Add to battle log
    addToBattleLog(`You used ${ability.name}!`);
    
    // Increase combo counter
    const newCombo = comboCounter + 1;
    setComboCounter(newCombo);
    
    if (newCombo > 1) {
      setShowComboText(true);
      setTimeout(() => setShowComboText(false), 1500);
    }
    
    // Calculate damage with combo bonus
    const comboMultiplier = 1 + newCombo * 0.1;
    const damage = Math.floor(ability.damage * comboMultiplier);
    
    // Delay damage to match animation
    setTimeout(() => {
      // Apply damage to opponent
      const newHealth = Math.max(0, opponentHealth - damage);
      setOpponentHealth(newHealth);
      
      // Send damage to opponent
      updateOpponentHealth(newHealth);
      
      // Add combo text to battle log if applicable
      if (newCombo > 1) {
        addToBattleLog(`${newCombo}x COMBO! ${damage} damage!`);
      } else {
        addToBattleLog(`${opponentName} took ${damage} damage!`);
      }
      
      // Clear animation and selected ability after a delay
      setTimeout(() => {
        setPlayerAnimation(null);
        setSelectedAbility(null);
        
        // Switch to opponent turn if opponent is still alive
        if (newHealth > 0) {
          setPlayerTurn(false);
          addToBattleLog(`${opponentName}'s turn...`);
        }
      }, 500);
    }, 500);
  };

  const togglePauseMenu = () => {
    playSound("button-click.mp3");
    setShowPauseMenu(!showPauseMenu);
  };

  const handleSurrender = () => {
    playSound("button-click.mp3");
    
    // Confirm surrender
    if (window.confirm("Are you sure you want to surrender?")) {
      // Send surrender action
      endBattle(isHost ? currentRoom?.guestId || "" : currentRoom?.hostId || "");
      
      // Add to battle log
      addToBattleLog("You surrendered!");
      
      // Game over
      setTimeout(() => onGameOver(), 1500);
    } else {
      // Close pause menu
      setShowPauseMenu(false);
    }
  };

  const handleExitGame = () => {
    playSound("button-click.mp3");
    
    // Confirm exit during active battle
    if (!isGameOver && window.confirm("Leaving will count as a surrender. Are you sure?")) {
      // Exit and surrender
      handleSurrender();
    } else if (isGameOver || window.confirm("Are you sure you want to exit?")) {
      // Just exit
      leaveRoom();
      onExit();
    } else {
      // User canceled, just close the pause menu
      setShowPauseMenu(false);
    }
  };

  // If essential data is missing, show an error
  if (!selectedCharacter || !opponentCharacter || !currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-black/80 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Battle data not found</h2>
          <p className="text-gray-300 mb-4">There was an error loading the battle. Please try again.</p>
          <Button onClick={onExit}>Return to Menu</Button>
        </div>
      </div>
    );
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
              <h3 className="font-bold text-white">{playerName}</h3>
              <div className="text-xs text-gray-300">{selectedCharacter.name}</div>
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
              <div className="text-xs text-gray-300">VS</div>
              <div className="font-bold text-red-400">PVP</div>
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

        {/* Opponent Stats */}
        <div className="bg-black/70 p-3 rounded-lg w-64">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 mr-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                <img
                  src={opponentCharacter.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={opponentCharacter.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white">{opponentName}</h3>
              <div className="text-xs text-gray-300">{opponentCharacter.name}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <div className="flex items-center">
                <Heart className="h-3 w-3 text-red-500 mr-1" />
                <span>HP</span>
              </div>
              <span>
                {opponentHealth}/{opponentMaxHealth}
              </span>
            </div>
            <Progress
              value={(opponentHealth / opponentMaxHealth) * 100}
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
                {opponentMana}/{opponentMaxMana}
              </span>
            </div>
            <Progress
              value={(opponentMana / opponentMaxMana) * 100}
              className="h-2 bg-gray-700"
              indicatorClassName="bg-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Battle Effects */}
        <BattleEffects playerAnimation={playerAnimation} enemyAnimation={opponentAnimation} />

        {/* Opponent */}
        <motion.div
          className="absolute right-1/4 top-1/3"
          animate={opponentAnimation ? { x: [-10, 10, -5, 5, 0], y: [-5, 5, -2, 2, 0] } : {}}
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
                src={opponentCharacter.avatar || "/placeholder.svg?height=200&width=200"}
                alt={opponentCharacter.name}
                className="w-40 h-40 object-contain filter drop-shadow-lg"
              />
            </motion.div>

            {/* Opponent Health Bar */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32">
              <div className="h-2 bg-gray-900/80 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${(opponentHealth / opponentMaxHealth) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player Character */}
        <motion.div
          className="absolute left-1/4 bottom-1/3"
          animate={playerAnimation ? { rotate: [-2, 2, -1, 1, 0] } : {}}
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
              disabled={!playerTurn || playerMana < ability.manaCost || isGameOver}
              className={`
                relative p-3 h-auto text-left
                ${selectedAbility === ability.id ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-700"}
                ${playerMana < ability.manaCost || !playerTurn ? "opacity-50 cursor-not-allowed" : ""}
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

                <Button 
                  onClick={handleSurrender} 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isGameOver}
                >
                  Surrender
                </Button>

                <Button onClick={handleExitGame} className="w-full bg-gray-600 hover:bg-gray-700">
                  Exit to Main Menu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { Progress } from "@/components/ui/progress"
// import { Heart, Droplet, Sword, Shield, Home } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"
// import { useMultiplayer } from "./multiplayer-context-provider"
// import { useGameState } from "./game-state-provider"
// import { playSound } from "@/lib/sound-utils"
// import BattleEffects from "./battle-effects"

// interface MultiplayerBattleProps {
//   onGameOver: () => void
//   onVictory: () => void
//   onExit: () => void
// }

// export default function MultiplayerBattle({ onGameOver, onVictory, onExit }: MultiplayerBattleProps) {
//   const { isHost, playerId, playerName, currentRoom, endBattle, updateOpponentHealth, leaveRoom } = useMultiplayer()
//   const { selectedCharacter, playerHealth, playerMaxHealth, playerMana, playerMaxMana, updatePlayerHealth, updatePlayerMana, addToBattleLog, battleLog } = useGameState()
  
//   // Setup opponent data
//   const opponentName = isHost ? currentRoom?.guestName : currentRoom?.hostName
//   const opponentCharacter = isHost ? currentRoom?.guestCharacter : currentRoom?.hostCharacter
  
//   const [opponentHealth, setOpponentHealth] = useState(opponentCharacter?.health || 100)
//   const [opponentMaxHealth, setOpponentMaxHealth] = useState(opponentCharacter?.health || 100)
//   const [opponentMana, setOpponentMana] = useState(opponentCharacter?.mana || 100)
//   const [opponentMaxMana, setOpponentMaxMana] = useState(opponentCharacter?.mana || 100)
  
//   const [playerTurn, setPlayerTurn] = useState(isHost) // Host goes first
//   const [turnCount, setTurnCount] = useState(1)
//   const [selectedAbility, setSelectedAbility] = useState<string | null>(null)
//   const [playerAnimation, setPlayerAnimation] = useState<string | null>(null)
//   const [opponentAnimation, setOpponentAnimation] = useState<string | null>(null)
//   const [comboCounter, setComboCounter] = useState(0)
//   const [showComboText, setShowComboText] = useState(false)
//   const [isGameOver, setIsGameOver] = useState(false)
//   const [showPauseMenu, setShowPauseMenu] = useState(false)
  
//   const battleLogRef = useRef<HTMLDivElement>(null)

//   // Scroll battle log to bottom when updated
//   useEffect(() => {
//     if (battleLogRef.current) {
//       battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
//     }
//   }, [battleLog])

//   // Initialize the battle
//   useEffect(() => {
//     // Set initial health and mana values
//     if (opponentCharacter) {
//       setOpponentHealth(opponentCharacter.health)
//       setOpponentMaxHealth(opponentCharacter.health)
//       setOpponentMana(opponentCharacter.mana)
//       setOpponentMaxMana(opponentCharacter.mana)
//     }
    
//     // Clear the battle log and add initial messages
//     addToBattleLog("Battle started!")
//     addToBattleLog(`${isHost ? "You" : opponentName} goes first!`)
//   }, [opponentCharacter, isHost, opponentName, addToBattleLog])

//   // Check for game over conditions
//   useEffect(() => {
//     if (playerHealth <= 0 && !isGameOver) {
//       setIsGameOver(true)
//       addToBattleLog("You have been defeated!")
      
//       // End the battle and declare opponent as winner
//       const opponentId = isHost ? currentRoom?.guestId : currentRoom?.hostId
//       if (opponentId) {
//         endBattle(opponentId)
//       }
      
//       setTimeout(() => {
//         onGameOver()
//       }, 2000)
//     }

//     if (opponentHealth <= 0 && !isGameOver) {
//       setIsGameOver(true)
//       addToBattleLog(`You defeated ${opponentName}!`)
      
//       // End the battle and declare player as winner
//       endBattle(playerId)
      
//       setTimeout(() => {
//         onVictory()
//       }, 2000)
//     }
//   }, [playerHealth, opponentHealth, isGameOver, currentRoom, endBattle, playerId, opponentName, addToBattleLog, onGameOver, onVictory])

//   // Simulate opponent's turn
//   useEffect(() => {
//     if (!playerTurn && !isGameOver && opponentCharacter) {
//       const opponentTurnTimeout = setTimeout(() => {
//         // Opponent selects a random ability
//         const randomAbilityIndex = Math.floor(Math.random() * opponentCharacter.abilities.length)
//         const opponentAbility = opponentCharacter.abilities[randomAbilityIndex]
        
//         // Calculate damage
//         const damage = Math.max(5, opponentAbility.damage)
        
//         // Show opponent attack animation
//         setOpponentAnimation(opponentAbility.type)
        
//         // Play sound effect
//         playSound(opponentAbility.soundEffect || "ability.mp3")
        
//         // Add to battle log
//         addToBattleLog(`${opponentName} used ${opponentAbility.name}!`)
        
//         // Delay damage to match animation
//         setTimeout(() => {
//           // Apply damage to player
//           updatePlayerHealth(-damage)
//           addToBattleLog(`You took ${damage} damage!`)
          
//           // Update opponent mana
//           setOpponentMana(prev => Math.max(0, prev - opponentAbility.manaCost))
          
//           // Reset combo if hit
//           setComboCounter(0)
          
//           // Clear animation after a delay
//           setTimeout(() => {
//             setOpponentAnimation(null)
            
//             // Switch back to player turn
//             setPlayerTurn(true)
//             setTurnCount(prev => prev + 1)
//             addToBattleLog("Your turn!")
//           }, 500)
//         }, 500)
//       }, 1500)
      
//       return () => clearTimeout(opponentTurnTimeout)
//     }
//   }, [playerTurn, isGameOver, opponentCharacter, opponentName, updatePlayerHealth, addToBattleLog])

//   const handleAbilitySelect = (abilityId: string) => {
//     if (!playerTurn || isGameOver || !selectedCharacter) return
    
//     const ability = selectedCharacter.abilities.find(a => a.id === abilityId)
//     if (!ability) return
    
//     setSelectedAbility(abilityId)
    
//     // Check if player has enough mana
//     if (playerMana < ability.manaCost) {
//       addToBattleLog(`Not enough mana to use ${ability.name}!`)
//       setSelectedAbility(null)
//       return
//     }
    
//     // Use ability
//     updatePlayerMana(-ability.manaCost)
    
//     // Play ability sound
//     playSound(ability.soundEffect)
    
//     // Show animation
//     setPlayerAnimation(ability.type)
    
//     // Add to battle log
//     addToBattleLog(`You used ${ability.name}!`)
    
//     // Increase combo counter
//     const newCombo = comboCounter + 1
//     setComboCounter(newCombo)
    
//     if (newCombo > 1) {
//       setShowComboText(true)
//       setTimeout(() => setShowComboText(false), 1500)
//     }
    
//     // Calculate damage with combo bonus
//     const comboMultiplier = 1 + newCombo * 0.1
//     const damage = Math.floor(ability.damage * comboMultiplier)
    
//     // Delay damage to match animation
//     setTimeout(() => {
//       // Apply damage to opponent
//       setOpponentHealth(prev => Math.max(0, prev - damage))
      
//       // In a real multiplayer game, send the damage to opponent
//       updateOpponentHealth(Math.max(0, opponentHealth - damage))
      
//       // Add combo text to battle log if applicable
//       if (newCombo > 1) {
//         addToBattleLog(`${newCombo}x COMBO! ${damage} damage!`)
//       } else {
//         addToBattleLog(`${opponentName} took ${damage} damage!`)
//       }
      
//       // Clear animation and selected ability after a delay
//       setTimeout(() => {
//         setPlayerAnimation(null)
//         setSelectedAbility(null)
        
//         // Switch to opponent turn if opponent is still alive
//         if (opponentHealth - damage > 0) {
//           setPlayerTurn(false)
//           addToBattleLog(`${opponentName}'s turn...`)
//         }
//       }, 500)
//     }, 500)
//   }

//   const togglePauseMenu = () => {
//     playSound("button-click.mp3")
//     setShowPauseMenu(!showPauseMenu)
//   }

//   const handleExitGame = () => {
//     playSound("button-click.mp3")
//     leaveRoom()
//     onExit()
//   }

//   if (!selectedCharacter || !opponentCharacter || !currentRoom) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold mb-4">Battle data not found</h2>
//           <Button onClick={onExit}>Return to Menu</Button>
//         </div>
//       </div>
//     )
//   }
  
//   return (
//     <div
//       className="relative min-h-screen w-full overflow-hidden bg-gray-900"
//       style={{
//         backgroundImage: `url(/images/battle-background.jpg)`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       {/* Battle UI */}
//       <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
//         {/* Player Stats */}
//         <div className="bg-black/70 p-3 rounded-lg w-64">
//           <div className="flex items-center mb-2">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 p-0.5 mr-2">
//               <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
//                 <img
//                   src={selectedCharacter.avatar || "/placeholder.svg?height=40&width=40"}
//                   alt={selectedCharacter.name}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//             <div>
//               <h3 className="font-bold text-white">{playerName}</h3>
//               <div className="text-xs text-gray-300">{selectedCharacter.name}</div>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <div>
//               <div className="flex justify-between items-center text-xs mb-1">
//                 <div className="flex items-center">
//                   <Heart className="h-3 w-3 text-red-500 mr-1" />
//                   <span>HP</span>
//                 </div>
//                 <span>
//                   {playerHealth}/{playerMaxHealth}
//                 </span>
//               </div>
//               <Progress
//                 value={(playerHealth / playerMaxHealth) * 100}
//                 className="h-2 bg-gray-700"
//                 indicatorClassName="bg-red-500"
//               />
//             </div>

//             <div>
//               <div className="flex justify-between items-center text-xs mb-1">
//                 <div className="flex items-center">
//                   <Droplet className="h-3 w-3 text-blue-500 mr-1" />
//                   <span>MP</span>
//                 </div>
//                 <span>
//                   {playerMana}/{playerMaxMana}
//                 </span>
//               </div>
//               <Progress
//                 value={(playerMana / playerMaxMana) * 100}
//                 className="h-2 bg-gray-700"
//                 indicatorClassName="bg-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Battle Info */}
//         <div className="bg-black/70 p-3 rounded-lg">
//           <div className="flex items-center justify-between gap-4">
//             <div className="text-center">
//               <div className="text-xs text-gray-300">Turn</div>
//               <div className="font-bold text-yellow-400">{turnCount}</div>
//             </div>

//             <div className="text-center">
//               <div className="text-xs text-gray-300">VS</div>
//               <div className="font-bold text-red-400">PVP</div>
//             </div>

//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={togglePauseMenu}
//               className="bg-gray-800/90 hover:bg-gray-700/90 ml-2"
//             >
//               Menu
//             </Button>
//           </div>
//         </div>

//         {/* Opponent Stats */}
//         <div className="bg-black/70 p-3 rounded-lg w-64">
//           <div className="flex items-center mb-2">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 mr-2">
//               <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
//                 <img
//                   src={opponentCharacter.avatar || "/placeholder.svg?height=40&width=40"}
//                   alt={opponentCharacter.name}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//             <div>
//               <h3 className="font-bold text-white">{opponentName}</h3>
//               <div className="text-xs text-gray-300">{opponentCharacter.name}</div>
//             </div>
//           </div>

//           <div>
//             <div className="flex justify-between items-center text-xs mb-1">
//               <div className="flex items-center">
//                 <Heart className="h-3 w-3 text-red-500 mr-1" />
//                 <span>HP</span>
//               </div>
//               <span>
//                 {opponentHealth}/{opponentMaxHealth}
//               </span>
//             </div>
//             <Progress
//               value={(opponentHealth / opponentMaxHealth) * 100}
//               className="h-2 bg-gray-700"
//               indicatorClassName="bg-red-500"
//             />
//           </div>

//           <div>
//             <div className="flex justify-between items-center text-xs mb-1">
//               <div className="flex items-center">
//                 <Droplet className="h-3 w-3 text-blue-500 mr-1" />
//                 <span>MP</span>
//               </div>
//               <span>
//                 {opponentMana}/{opponentMaxMana}
//               </span>
//             </div>
//             <Progress
//               value={(opponentMana / opponentMaxMana) * 100}
//               className="h-2 bg-gray-700"
//               indicatorClassName="bg-blue-500"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Battle Area */}
//       <div className="absolute inset-0 flex items-center justify-center">
//         {/* Battle Effects */}
//         <BattleEffects playerAnimation={playerAnimation} enemyAnimation={opponentAnimation} />

//         {/* Opponent */}
//         <motion.div
//           className="absolute right-1/4 top-1/3"
//           animate={opponentAnimation ? { x: [-10, 10, -5, 5, 0], y: [-5, 5, -2, 2, 0] } : {}}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="relative">
//             <motion.div
//               animate={{
//                 scale: [1, 1.05, 1],
//               }}
//               transition={{
//                 repeat: Number.POSITIVE_INFINITY,
//                 duration: 2,
//                 repeatType: "reverse",
//               }}
//             >
//               <img
//                 src={opponentCharacter.avatar || "/placeholder.svg?height=200&width=200"}
//                 alt={opponentCharacter.name}
//                 className="w-40 h-40 object-contain filter drop-shadow-lg"
//               />
//             </motion.div>

//             {/* Opponent Health Bar */}
//             <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32">
//               <div className="h-2 bg-gray-900/80 rounded-full">
//                 <div
//                   className="h-2 bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
//                   style={{ width: `${(opponentHealth / opponentMaxHealth) * 100}%` }}
//                 ></div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Player Character */}
//         <motion.div
//           className="absolute left-1/4 bottom-1/3"
//           animate={playerAnimation ? { rotate: [-2, 2, -1, 1, 0] } : {}}
//           transition={{ duration: 0.3 }}
//         >
//           <div className="relative">
//             <motion.div
//               animate={{
//                 y: [0, -5, 0],
//               }}
//               transition={{
//                 repeat: Number.POSITIVE_INFINITY,
//                 duration: 2,
//                 repeatType: "reverse",
//               }}
//             >
//               <img
//                 src={selectedCharacter.avatar || "/placeholder.svg?height=200&width=200"}
//                 alt={selectedCharacter.name}
//                 className="w-40 h-40 object-contain filter drop-shadow-lg"
//               />
//             </motion.div>

//             {/* Player Health Bar */}
//             <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32">
//               <div className="h-2 bg-gray-900/80 rounded-full">
//                 <div
//                   className="h-2 bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-300"
//                   style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
//                 ></div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Combo Text */}
//         <AnimatePresence>
//           {showComboText && comboCounter > 1 && (
//             <motion.div
//               initial={{ scale: 0.5, opacity: 0, y: 0 }}
//               animate={{ scale: 1.5, opacity: 1, y: -50 }}
//               exit={{ scale: 0.5, opacity: 0, y: -100 }}
//               transition={{ duration: 0.5 }}
//               className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
//             >
//               <div className="text-4xl font-bold text-yellow-400 filter drop-shadow-lg">{comboCounter}x COMBO!</div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Battle Log */}
//       <div
//         ref={battleLogRef}
//         className="absolute bottom-32 left-4 w-64 h-40 bg-black/70 rounded-lg p-3 overflow-y-auto text-sm"
//       >
//         {battleLog.map((log, index) => (
//           <div key={index} className="mb-1">
//             {log}
//           </div>
//         ))}
//       </div>

//       {/* Abilities */}
//       <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80">
//         <div className="grid grid-cols-3 gap-3">
//           {selectedCharacter.abilities.map((ability) => (
//             <Button
//               key={ability.id}
//               onClick={() => handleAbilitySelect(ability.id)}
//               disabled={!playerTurn || playerMana < ability.manaCost || isGameOver}
//               className={`
//                 relative p-3 h-auto text-left
//                 ${selectedAbility === ability.id ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-700"}
//                 ${playerMana < ability.manaCost || !playerTurn ? "opacity-50 cursor-not-allowed" : ""}
//               `}
//             >
//               <div>
//                 <div className="font-bold mb-1">{ability.name}</div>
//                 <div className="text-xs text-gray-300 mb-2">{ability.description}</div>
//                 <div className="flex justify-between text-xs">
//                   <div className="flex items-center">
//                     <Sword className="h-3 w-3 text-red-400 mr-1" />
//                     <span>{ability.damage}</span>
//                   </div>
//                   <div className="flex items-center">
//                     <Droplet className="h-3 w-3 text-blue-400 mr-1" />
//                     <span>{ability.manaCost}</span>
//                   </div>
//                 </div>
//               </div>
//             </Button>
//           ))}
//         </div>
//       </div>

//       {/* Pause Menu */}
//       <AnimatePresence>
//         {showPauseMenu && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
//           >
//             <motion.div
//               initial={{ scale: 0.9 }}
//               animate={{ scale: 1 }}
//               exit={{ scale: 0.9 }}
//               className="bg-gray-900 p-8 rounded-lg w-80"
//             >
//               <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">Game Paused</h2>

//               <div className="space-y-4">
//                 <Button
//                   onClick={togglePauseMenu}
//                   className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
//                 >
//                   Resume Game
//                 </Button>

//                 <Button onClick={handleExitGame} className="w-full bg-red-600 hover:bg-red-700">
//                   Forfeit Match
//                 </Button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )}