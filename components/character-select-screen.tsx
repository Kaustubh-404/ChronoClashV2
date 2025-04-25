"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Zap, Shield } from "lucide-react"
import type { JSX } from "react"

type Character = {
  id: string
  name: string
  description: string
  abilities: string[]
  stats: {
    health: number
    mana: number
    attack: number
    defense: number
    speed: number
  }
  color: string
  icon: JSX.Element
}

const characters: Character[] = [
  {
    id: "chronos",
    name: "Chronos",
    description: "Master of time manipulation with powerful temporal abilities",
    abilities: ["Time Stop", "Temporal Shift", "Age Acceleration"],
    stats: {
      health: 100,
      mana: 80,
      attack: 60,
      defense: 50,
      speed: 70,
    },
    color: "from-purple-500 to-indigo-700",
    icon: <Clock className="h-8 w-8" />,
  },
  {
    id: "tempest",
    name: "Tempest",
    description: "Lightning-fast warrior who can strike multiple times in a turn",
    abilities: ["Lightning Strike", "Speed Burst", "Chain Attack"],
    stats: {
      health: 90,
      mana: 60,
      attack: 80,
      defense: 40,
      speed: 90,
    },
    color: "from-yellow-500 to-amber-700",
    icon: <Zap className="h-8 w-8" />,
  },
  {
    id: "guardian",
    name: "Guardian",
    description: "Defensive hero who can absorb damage and protect allies",
    abilities: ["Time Shield", "Protective Aura", "Temporal Barrier"],
    stats: {
      health: 130,
      mana: 50,
      attack: 50,
      defense: 90,
      speed: 40,
    },
    color: "from-blue-500 to-cyan-700",
    icon: <Shield className="h-8 w-8" />,
  },
]

export function CharacterSelectScreen({ onSelect }: { onSelect: (character: string) => void }) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Hero</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {characters.map((character) => (
          <Card
            key={character.id}
            className={`border-2 cursor-pointer transition-all duration-300 ${
              selectedCharacter === character.id
                ? `border-${character.color.split(" ")[0].replace("from-", "")} shadow-lg shadow-${character.color.split(" ")[0].replace("from-", "")}/30`
                : "border-gray-700 hover:border-gray-500"
            } bg-gray-800`}
            onClick={() => setSelectedCharacter(character.id)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center mb-4`}
                >
                  {character.icon}
                </div>

                <h2 className="text-2xl font-bold mb-2">{character.name}</h2>
                <p className="text-gray-400 text-center mb-4">{character.description}</p>

                <div className="w-full space-y-2 mb-4">
                  {Object.entries(character.stats).map(([stat, value]) => (
                    <div key={stat} className="flex items-center justify-between">
                      <span className="capitalize text-gray-400">{stat}</span>
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${character.color} h-2 rounded-full`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="w-full">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Abilities:</h3>
                  <ul className="text-sm text-gray-400">
                    {character.abilities.map((ability, index) => (
                      <li key={index} className="mb-1">
                        • {ability}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => selectedCharacter && onSelect(selectedCharacter)}
          disabled={!selectedCharacter}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedCharacter
            ? `Select ${characters.find((c) => c.id === selectedCharacter)?.name}`
            : "Select a Character"}
        </Button>
      </div>
    </div>
  )
}
