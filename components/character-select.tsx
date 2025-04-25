"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { motion } from "framer-motion"
import { useGameState } from "./game-state-provider"
import { useMultiplayer } from "./multiplayer-context-provider"
import { playSound } from "@/lib/sound-utils"

interface CharacterSelectProps {
  onSelect: () => void
  onBack: () => void
  isMultiplayer?: boolean
}

export default function CharacterSelect({ onSelect, onBack, isMultiplayer = false }: CharacterSelectProps) {
  const { selectCharacter } = useGameState()
  const { selectCharacter: selectMultiplayerCharacter } = useMultiplayer()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isConfirming, setIsConfirming] = useState(false)

  const characters = [
    {
      id: "chronos",
      name: "Chronos",
      avatar: "/images/chronos.png",
      description: "Master of time with powerful temporal abilities",
      stats: {
        health: 100,
        mana: 100,
        attack: 75,
        defense: 60,
      },
      abilities: [
        {
          id: "time-slash",
          name: "Time Slash",
          damage: 15,
          manaCost: 10,
          cooldown: 1,
          currentCooldown: 0,
          type: "time" as const,
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
          type: "time" as const,
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
          type: "time" as const,
          description: "Freezes time around the enemy",
          soundEffect: "time-freeze.mp3",
        }
      ],
    },
    {
      id: "pyromancer",
      name: "Pyromancer",
      avatar: "/images/pyromancer.png",
      description: "Wields the destructive power of fire",
      stats: {
        health: 85,
        mana: 120,
        attack: 90,
        defense: 40,
      },
      abilities: [
        {
          id: "fireball",
          name: "Fireball",
          damage: 20,
          manaCost: 15,
          cooldown: 1,
          currentCooldown: 0,
          type: "fire" as const,
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
          type: "fire" as const,
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
          type: "fire" as const,
          description: "Summons a raging inferno to engulf the enemy",
          soundEffect: "inferno.mp3",
        }
      ],
    },
    {
      id: "stormcaller",
      name: "Stormcaller",
      avatar: "/images/stormcaller.png",
      description: "Commands the power of lightning and storms",
      stats: {
        health: 90,
        mana: 110,
        attack: 85,
        defense: 50,
      },
      abilities: [
        {
          id: "lightning-bolt",
          name: "Lightning Bolt",
          damage: 18,
          manaCost: 12,
          cooldown: 1,
          currentCooldown: 0,
          type: "lightning" as const,
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
          type: "lightning" as const,
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
          type: "lightning" as const,
          description: "Calls down a devastating storm of lightning",
          soundEffect: "thunderstorm.mp3",
        }
      ],
    },
  ]

  const handlePrevious = () => {
    playSound("button-click.mp3")
    setSelectedIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1))
  }

  const handleNext = () => {
    playSound("button-click.mp3")
    setSelectedIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1))
  }

  const handleSelect = () => {
    playSound("character-select.mp3")
    setIsConfirming(true)

    // Create character object
    const character = {
      id: characters[selectedIndex].id,
      name: characters[selectedIndex].name,
      avatar: characters[selectedIndex].avatar,
      health: characters[selectedIndex].stats.health,
      mana: characters[selectedIndex].stats.mana,
      description: characters[selectedIndex].description,
      abilities: characters[selectedIndex].abilities,
    }

    // Select character for the appropriate mode
    if (isMultiplayer) {
      selectMultiplayerCharacter(character)
    } else {
      selectCharacter(character)
    }
    
    // Simulate character selection process with a short delay
    setTimeout(() => {
      onSelect()
    }, 1500)
  }

  const handleBack = () => {
    playSound("button-click.mp3")
    onBack()
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8"
      >
        <h1 className="text-4xl font-bold text-center text-yellow-400">Choose Your Champion</h1>
        <p className="text-center text-gray-300 mt-2">
          {isMultiplayer 
            ? "Select your character for multiplayer battle" 
            : "Select your character for your time journey"
          }
        </p>
      </motion.div>

      <div className="relative z-10 flex items-center justify-center w-full max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full mr-4"
          disabled={isConfirming}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-black/70 p-8 rounded-lg w-full max-w-2xl"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
                  <img
                    src={characters[selectedIndex].avatar || "/placeholder.svg?height=180&width=180"}
                    alt={characters[selectedIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {isConfirming && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                    <Check className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">{characters[selectedIndex].name}</h2>
              <p className="text-gray-300 mb-4">{characters[selectedIndex].description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {Object.entries(characters[selectedIndex].stats).map(([stat, value]) => (
                  <div key={stat} className="bg-black/50 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-300 capitalize">{stat}</span>
                      <span className="text-yellow-400 font-bold">{value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 h-2 rounded-full"
                        style={{ width: `${(value / 120) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Abilities</h3>
              <ul className="space-y-2">
                {characters[selectedIndex].abilities.map((ability) => (
                  <li key={ability.id} className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="text-gray-200">{ability.name} - </span>
                    <span className="text-gray-400 text-sm ml-1">{ability.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full ml-4"
          disabled={isConfirming}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative z-10 mt-8 flex gap-4">
        <Button
          onClick={handleBack}
          className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2"
          disabled={isConfirming}
        >
          Back
        </Button>
        <Button
          onClick={handleSelect}
          className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-bold px-8 py-2"
          disabled={isConfirming}
        >
          {isConfirming ? "Selecting..." : "Select"}
        </Button>
      </div>
    </div>
  )
}









// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { ArrowLeft, ArrowRight, Check } from "lucide-react"
// import { motion } from "framer-motion"
// import { useGameState } from "./game-state-provider"
// import { playSound } from "@/lib/sound-utils"

// interface CharacterSelectProps {
//   onSelect: () => void
//   onBack: () => void
// }

// export default function CharacterSelect({ onSelect, onBack }: CharacterSelectProps) {
//   const { selectCharacter } = useGameState()
//   const [selectedIndex, setSelectedIndex] = useState(0)
//   const [isConfirming, setIsConfirming] = useState(false)

//   const characters = [
//     {
//       id: "chronos",
//       name: "Chronos",
//       avatar: "/images/chronos.png",
//       description: "Master of time with powerful temporal abilities",
//       stats: {
//         health: 100,
//         mana: 100,
//         attack: 75,
//         defense: 60,
//       },
//       abilities: ["Time Slash", "Temporal Blast", "Time Freeze"],
//     },
//     {
//       id: "pyromancer",
//       name: "Pyromancer",
//       avatar: "/images/pyromancer.png",
//       description: "Wields the destructive power of fire",
//       stats: {
//         health: 85,
//         mana: 120,
//         attack: 90,
//         defense: 40,
//       },
//       abilities: ["Fireball", "Flame Wave", "Inferno"],
//     },
//     {
//       id: "stormcaller",
//       name: "Stormcaller",
//       avatar: "/images/stormcaller.png",
//       description: "Commands the power of lightning and storms",
//       stats: {
//         health: 90,
//         mana: 110,
//         attack: 85,
//         defense: 50,
//       },
//       abilities: ["Lightning Bolt", "Chain Lightning", "Thunderstorm"],
//     },
//   ]

//   const handlePrevious = () => {
//     playSound("button-click.mp3")
//     setSelectedIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1))
//   }

//   const handleNext = () => {
//     playSound("button-click.mp3")
//     setSelectedIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1))
//   }

//   const handleSelect = () => {
//     playSound("character-select.mp3")
//     setIsConfirming(true)

//     // Simulate character selection process
//     setTimeout(() => {
//       const character = {
//         id: characters[selectedIndex].id,
//         name: characters[selectedIndex].name,
//         avatar: characters[selectedIndex].avatar,
//         health: characters[selectedIndex].stats.health,
//         mana: characters[selectedIndex].stats.mana,
//         description: characters[selectedIndex].description,
//         abilities: [
//           {
//             id: "ability-1",
//             name: characters[selectedIndex].abilities[0],
//             damage: 15,
//             manaCost: 10,
//             cooldown: 1,
//             currentCooldown: 0,
//             type: "time" as const,
//             description: "A basic ability",
//             soundEffect: "ability.mp3",
//           },
//           {
//             id: "ability-2",
//             name: characters[selectedIndex].abilities[1],
//             damage: 30,
//             manaCost: 25,
//             cooldown: 3,
//             currentCooldown: 0,
//             type: "time" as const,
//             description: "A medium ability",
//             soundEffect: "ability.mp3",
//           },
//           {
//             id: "ability-3",
//             name: characters[selectedIndex].abilities[2],
//             damage: 50,
//             manaCost: 40,
//             cooldown: 5,
//             currentCooldown: 0,
//             type: "time" as const,
//             description: "An ultimate ability",
//             soundEffect: "ability.mp3",
//           },
//         ],
//       }

//       selectCharacter(character)
//       onSelect()
//     }, 1500)
//   }

//   const handleBack = () => {
//     playSound("button-click.mp3")
//     onBack()
//   }

//   return (
//     <div
//       className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
//       style={{
//         backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundAttachment: "fixed",
//       }}
//     >
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="relative z-10 mb-8"
//       >
//         <h1 className="text-4xl font-bold text-center text-yellow-400">Choose Your Champion</h1>
//       </motion.div>

//       <div className="relative z-10 flex items-center justify-center w-full max-w-4xl">
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={handlePrevious}
//           className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full mr-4"
//           disabled={isConfirming}
//         >
//           <ArrowLeft className="h-6 w-6" />
//         </Button>

//         <motion.div
//           key={selectedIndex}
//           initial={{ opacity: 0, x: 50 }}
//           animate={{ opacity: 1, x: 0 }}
//           exit={{ opacity: 0, x: -50 }}
//           transition={{ duration: 0.3 }}
//           className="bg-black/70 p-8 rounded-lg w-full max-w-2xl"
//         >
//           <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
//             <div className="relative">
//               <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 p-1">
//                 <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
//                   <img
//                     src={characters[selectedIndex].avatar || "/placeholder.svg?height=180&width=180"}
//                     alt={characters[selectedIndex].name}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//               </div>
//               {isConfirming && (
//                 <motion.div
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"
//                 >
//                   <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
//                     <Check className="h-10 w-10 text-white" />
//                   </div>
//                 </motion.div>
//               )}
//             </div>

//             <div className="flex-1">
//               <h2 className="text-3xl font-bold text-yellow-400 mb-2">{characters[selectedIndex].name}</h2>
//               <p className="text-gray-300 mb-4">{characters[selectedIndex].description}</p>

//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 {Object.entries(characters[selectedIndex].stats).map(([stat, value]) => (
//                   <div key={stat} className="bg-black/50 p-2 rounded">
//                     <div className="flex justify-between items-center mb-1">
//                       <span className="text-gray-300 capitalize">{stat}</span>
//                       <span className="text-yellow-400 font-bold">{value}</span>
//                     </div>
//                     <div className="w-full bg-gray-700 rounded-full h-2">
//                       <div
//                         className="bg-gradient-to-r from-yellow-500 to-amber-600 h-2 rounded-full"
//                         style={{ width: `${(value / 120) * 100}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <h3 className="text-xl font-semibold text-yellow-300 mb-2">Abilities</h3>
//               <ul className="space-y-2">
//                 {characters[selectedIndex].abilities.map((ability, index) => (
//                   <li key={index} className="flex items-center">
//                     <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
//                     <span className="text-gray-200">{ability}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </motion.div>

//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={handleNext}
//           className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full ml-4"
//           disabled={isConfirming}
//         >
//           <ArrowRight className="h-6 w-6" />
//         </Button>
//       </div>

//       <div className="relative z-10 mt-8 flex gap-4">
//         <Button
//           onClick={handleBack}
//           className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2"
//           disabled={isConfirming}
//         >
//           Back
//         </Button>
//         <Button
//           onClick={handleSelect}
//           className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-bold px-8 py-2"
//           disabled={isConfirming}
//         >
//           {isConfirming ? "Selecting..." : "Select"}
//         </Button>
//       </div>
//     </div>
//   )
// }
