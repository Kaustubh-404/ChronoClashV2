import { Clock, Zap, Shield, Skull, Flame, Snowflake } from "lucide-react"
import type { Enemy } from "./game-types"

export function generateEnemy(level: number): Enemy {
  // Enemy types with different abilities and stats
  const enemyTypes = [
    {
      name: "Time Wraith",
      baseHealth: 80,
      baseAttack: 15,
      baseDefense: 10,
      abilities: [
        { name: "Temporal Drain", type: "time", power: 15, manaCost: 0 },
        { name: "Aging Touch", type: "time", power: 25, manaCost: 0 },
        { name: "Time Ripple", type: "time", power: 20, manaCost: 0 },
      ],
      icon: <Clock className="h-12 w-12" />,
    },
    {
      name: "Lightning Elemental",
      baseHealth: 70,
      baseAttack: 20,
      baseDefense: 5,
      abilities: [
        { name: "Shock", type: "lightning", power: 20, manaCost: 0 },
        { name: "Thunder Clap", type: "lightning", power: 30, manaCost: 0 },
        { name: "Static Discharge", type: "lightning", power: 15, manaCost: 0 },
      ],
      icon: <Zap className="h-12 w-12" />,
    },
    {
      name: "Chrono Guardian",
      baseHealth: 100,
      baseAttack: 10,
      baseDefense: 20,
      abilities: [
        { name: "Shield Slam", type: "shield", power: 15, manaCost: 0 },
        { name: "Time Barrier", type: "shield", power: 10, manaCost: 0 },
        { name: "Guardian's Strike", type: "shield", power: 25, manaCost: 0 },
      ],
      icon: <Shield className="h-12 w-12" />,
    },
    {
      name: "Void Reaper",
      baseHealth: 90,
      baseAttack: 25,
      baseDefense: 8,
      abilities: [
        { name: "Soul Harvest", type: "void", power: 20, manaCost: 0 },
        { name: "Void Touch", type: "void", power: 15, manaCost: 0 },
        { name: "Death's Embrace", type: "void", power: 30, manaCost: 0 },
      ],
      icon: <Skull className="h-12 w-12" />,
    },
    {
      name: "Flame Djinn",
      baseHealth: 75,
      baseAttack: 22,
      baseDefense: 7,
      abilities: [
        { name: "Fireball", type: "fire", power: 18, manaCost: 0 },
        { name: "Flame Wave", type: "fire", power: 25, manaCost: 0 },
        { name: "Burning Touch", type: "fire", power: 15, manaCost: 0 },
      ],
      icon: <Flame className="h-12 w-12" />,
    },
    {
      name: "Frost Giant",
      baseHealth: 110,
      baseAttack: 18,
      baseDefense: 15,
      abilities: [
        { name: "Ice Spike", type: "ice", power: 20, manaCost: 0 },
        { name: "Frost Breath", type: "ice", power: 25, manaCost: 0 },
        { name: "Freezing Touch", type: "ice", power: 15, manaCost: 0 },
      ],
      icon: <Snowflake className="h-12 w-12" />,
    },
  ]

  // Select a random enemy type
  const randomIndex = Math.floor(Math.random() * enemyTypes.length)
  const enemyType = enemyTypes[randomIndex]

  // Scale enemy stats based on level
  const scaleFactor = 1 + (level - 1) * 0.2
  const health = Math.floor(enemyType.baseHealth * scaleFactor)
  const attack = Math.floor(enemyType.baseAttack * scaleFactor)
  const defense = Math.floor(enemyType.baseDefense * scaleFactor)

  // Create enemy object
  const enemy: Enemy = {
    name: enemyType.name,
    level,
    health,
    maxHealth: health,
    attack,
    defense,
    abilities: enemyType.abilities,
    icon: enemyType.icon,
  }

  return enemy
}
