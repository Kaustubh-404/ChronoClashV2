"use client"

import { useState, useEffect } from "react"
import { useGameContext } from "./game-context-provider"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Clock, Sword, Shield, Coins, Settings, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnimatedNumber } from "./animated-number"
import WalletStatus from "./wallet-status"

export function GameHeader() {
  const { playerLevel, playerXP, playerCoins, playerName } = useGameContext()
  const [time, setTime] = useState(new Date())

  // XP needed for next level
  const xpForNextLevel = playerLevel * 100
  const xpProgress = ((playerXP % 100) / 100) * 100

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="w-full bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 border-b-2 border-purple-500 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center border-2 border-purple-300 shadow-glow">
              <span className="text-white font-bold">{playerLevel}</span>
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-xs rounded-full w-6 h-6 flex items-center justify-center border border-yellow-300">
                {playerLevel}
              </div>
            </div>
            <div className="ml-2">
              <h3 className="font-bold text-white">{playerName}</h3>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-32">
                  <Progress value={xpProgress} className="h-2 bg-gray-700" />
                </div>
                <span className="text-purple-200">
                  {playerXP % 100}/{100} XP
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1 text-yellow-300 font-bold">
              <Clock className="h-5 w-5" />
              <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-1 text-red-400 font-bold">
              <Sword className="h-5 w-5" />
              <span>Attack: 75</span>
            </div>
            <div className="flex items-center gap-1 text-blue-400 font-bold">
              <Shield className="h-5 w-5" />
              <span>Defense: 50</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-600">
              <Coins className="h-5 w-5 text-yellow-400" />
              <AnimatedNumber value={playerCoins} className="font-bold text-yellow-300" />
            </div>

            <WalletStatus />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Daily quest available!</DropdownMenuItem>
                <DropdownMenuItem>New challenge unlocked</DropdownMenuItem>
                <DropdownMenuItem>Friend request from TimeWizard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Inventory</DropdownMenuItem>
                <DropdownMenuItem>Achievements</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}







// "use client"

// import { useState, useEffect } from "react"
// import { useGameContext } from "./game-context-provider"
// import { Progress } from "@/components/ui/progress"
// import { Button } from "@/components/ui/button"
// import { Clock, Sword, Shield, Coins, Settings, Bell } from "lucide-react"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { AnimatedNumber } from "./animated-number"

// export function GameHeader() {
//   const { playerLevel, playerXP, playerCoins, playerName } = useGameContext()
//   const [time, setTime] = useState(new Date())

//   // XP needed for next level
//   const xpForNextLevel = playerLevel * 100
//   const xpProgress = ((playerXP % 100) / 100) * 100

//   // Update time every second
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTime(new Date())
//     }, 1000)
//     return () => clearInterval(timer)
//   }, [])

//   return (
//     <header className="w-full bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 border-b-2 border-purple-500 shadow-lg">
//       <div className="container mx-auto px-4 py-3">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center border-2 border-purple-300 shadow-glow">
//               <span className="text-white font-bold">{playerLevel}</span>
//               <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-xs rounded-full w-6 h-6 flex items-center justify-center border border-yellow-300">
//                 {playerLevel}
//               </div>
//             </div>
//             <div className="ml-2">
//               <h3 className="font-bold text-white">{playerName}</h3>
//               <div className="flex items-center gap-1 text-xs">
//                 <div className="w-32">
//                   <Progress value={xpProgress} className="h-2 bg-gray-700" />
//                 </div>
//                 <span className="text-purple-200">
//                   {playerXP % 100}/{100} XP
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="hidden md:flex items-center gap-6">
//             <div className="flex items-center gap-1 text-yellow-300 font-bold">
//               <Clock className="h-5 w-5" />
//               <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
//             </div>
//             <div className="flex items-center gap-1 text-red-400 font-bold">
//               <Sword className="h-5 w-5" />
//               <span>Attack: 75</span>
//             </div>
//             <div className="flex items-center gap-1 text-blue-400 font-bold">
//               <Shield className="h-5 w-5" />
//               <span>Defense: 50</span>
//             </div>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-1 bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-600">
//               <Coins className="h-5 w-5 text-yellow-400" />
//               <AnimatedNumber value={playerCoins} className="font-bold text-yellow-300" />
//             </div>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon" className="relative">
//                   <Bell className="h-5 w-5" />
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                     3
//                   </span>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-56">
//                 <DropdownMenuLabel>Notifications</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>Daily quest available!</DropdownMenuItem>
//                 <DropdownMenuItem>New challenge unlocked</DropdownMenuItem>
//                 <DropdownMenuItem>Friend request from TimeWizard</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon">
//                   <Settings className="h-5 w-5" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuLabel>Settings</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>Profile</DropdownMenuItem>
//                 <DropdownMenuItem>Inventory</DropdownMenuItem>
//                 <DropdownMenuItem>Achievements</DropdownMenuItem>
//                 <DropdownMenuItem>Settings</DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>Logout</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }
