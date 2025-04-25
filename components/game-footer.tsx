"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Home, Sword, ShoppingBag, Map, User } from "lucide-react"
import { useState } from "react"

export function GameFooter() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <footer className="sticky bottom-0 w-full bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 border-t-2 border-purple-500 shadow-lg py-2 md:hidden">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <NavButton
            icon={<Home className="h-6 w-6" />}
            label="Home"
            isActive={activeTab === "home"}
            onClick={() => setActiveTab("home")}
          />
          <NavButton
            icon={<Sword className="h-6 w-6" />}
            label="Battle"
            isActive={activeTab === "battle"}
            onClick={() => setActiveTab("battle")}
          />
          <NavButton
            icon={<Map className="h-6 w-6" />}
            label="Quests"
            isActive={activeTab === "quests"}
            onClick={() => setActiveTab("quests")}
          />
          <NavButton
            icon={<ShoppingBag className="h-6 w-6" />}
            label="Shop"
            isActive={activeTab === "shop"}
            onClick={() => setActiveTab("shop")}
          />
          <NavButton
            icon={<User className="h-6 w-6" />}
            label="Profile"
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </div>
      </div>
    </footer>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      className={`flex flex-col items-center gap-1 h-auto py-1 ${isActive ? "text-white" : "text-gray-300"}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
      {isActive && <div className="absolute -bottom-2 w-1/2 h-1 bg-white rounded-t-full" />}
    </Button>
  )
}
