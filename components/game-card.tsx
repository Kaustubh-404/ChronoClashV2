"use client"

import type React from "react"

import { Button } from "@/components/ui/card"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Lock } from "lucide-react"

interface GameCardProps {
  title: string
  description: string
  icon: React.ReactNode
  rewards: {
    xp: number
    coins: number
  }
  energy: number
  maxEnergy: number
  buttonText: string
  onAction: () => void
  locked?: boolean
  lockedReason?: string
}

export function GameCard({
  title,
  description,
  icon,
  rewards,
  energy,
  maxEnergy,
  buttonText,
  onAction,
  locked = false,
  lockedReason = "Locked",
}: GameCardProps) {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-40 w-full rounded-md overflow-hidden mb-4">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              locked ? "from-gray-700/80 to-gray-800/80" : "from-indigo-900/80 to-purple-900/80"
            } flex items-center justify-center`}
          >
            {locked ? (
              <div className="text-center">
                <Lock className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-lg font-bold mt-2 text-gray-300">{lockedReason}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-purple-700/50 flex items-center justify-center">
                  {icon}
                </div>
                <p className="text-lg font-bold mt-2">{title}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-1 text-yellow-400" />
            <span>
              Energy: {energy}/{maxEnergy}
            </span>
          </div>
          <div>
            <span className="text-green-400">+{rewards.xp} XP</span> |{" "}
            <span className="text-yellow-400">+{rewards.coins} Coins</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${
            locked
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          }`}
          onClick={locked ? undefined : onAction}
          disabled={locked}
        >
          {locked ? lockedReason : buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}
