"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Coins, Zap, CheckCircle, XCircle, PlayCircle } from "lucide-react"

interface QuestCardProps {
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  rewards: {
    xp: number
    coins: number
  }
  progress: number
  timeLeft?: string
  status?: "in-progress" | "completed" | "failed" | "not-started"
}

export function QuestCard({
  title,
  description,
  difficulty,
  rewards,
  progress,
  timeLeft,
  status = progress > 0 && progress < 100 ? "in-progress" : "not-started",
}: QuestCardProps) {
  // If progress is 100, set status to completed
  const questStatus = progress === 100 ? "completed" : status

  // Get color based on difficulty
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-700 text-green-200"
      case "Medium":
        return "bg-yellow-700 text-yellow-200"
      case "Hard":
        return "bg-red-700 text-red-200"
      default:
        return "bg-blue-700 text-blue-200"
    }
  }

  // Get status icon and color
  const getStatusInfo = () => {
    switch (questStatus) {
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 mr-2 text-green-400" />,
          text: "Completed",
          color: "text-green-400",
        }
      case "failed":
        return {
          icon: <XCircle className="h-5 w-5 mr-2 text-red-400" />,
          text: "Failed",
          color: "text-red-400",
        }
      case "in-progress":
        return {
          icon: <Clock className="h-5 w-5 mr-2 text-blue-400" />,
          text: timeLeft ? `${timeLeft} left` : "In Progress",
          color: "text-blue-400",
        }
      default:
        return {
          icon: <PlayCircle className="h-5 w-5 mr-2 text-gray-400" />,
          text: "Not Started",
          color: "text-gray-400",
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{title}</CardTitle>
          <Badge className={`${getDifficultyColor()} border-none`}>{difficulty}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm">
          {statusInfo.icon}
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                questStatus === "completed"
                  ? "bg-green-500"
                  : questStatus === "failed"
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-purple-500 to-indigo-500"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-green-400" />
            <span className="text-green-400">+{rewards.xp} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400">+{rewards.coins} Coins</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${
            questStatus === "completed"
              ? "bg-green-600 hover:bg-green-700"
              : questStatus === "failed"
                ? "bg-red-600 hover:bg-red-700"
                : questStatus === "in-progress"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          }`}
          disabled={questStatus === "completed" || questStatus === "failed"}
        >
          {questStatus === "completed"
            ? "Claim Rewards"
            : questStatus === "failed"
              ? "Quest Failed"
              : questStatus === "in-progress"
                ? "Continue Quest"
                : "Start Quest"}
        </Button>
      </CardFooter>
    </Card>
  )
}
