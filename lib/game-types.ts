import type { JSX } from "react"

export type Ability = {
  name: string
  type: string
  power: number
  manaCost: number
}

export type Enemy = {
  name: string
  level: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  abilities: Ability[]
  icon: JSX.Element
}
