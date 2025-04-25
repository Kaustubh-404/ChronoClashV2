"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Settings, Trophy, Info, Users, Sword } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameState } from "./game-state-provider"
import { playSound } from "@/lib/sound-utils"
import WalletConnect from "./WalletConnect"
import { useActiveAddress, useConnection } from "@arweave-wallet-kit/react"

interface MainMenuProps {
  onPlay: () => void
  onMultiplayer: () => void
  onSettings: () => void
  soundEnabled: boolean
  toggleSound: () => void
}

export default function MainMenu({ onPlay, onMultiplayer, onSettings, soundEnabled, toggleSound }: MainMenuProps) {
  const { highScore } = useGameState()
  const [showCredits, setShowCredits] = useState(false)
  const [titleAnimation, setTitleAnimation] = useState(false)
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const [pendingAction, setPendingAction] = useState<"play" | "multiplayer" | null>(null)
  
  // Get wallet connection status
  const { connected } = useConnection()
  const address = useActiveAddress()
  const isWalletConnected = connected && address

  useEffect(() => {
    // Start title animation after component mounts
    setTimeout(() => setTitleAnimation(true), 500)
  }, [])

  // When wallet gets connected, proceed with the pending action
  useEffect(() => {
    if (isWalletConnected && pendingAction) {
      if (pendingAction === "play") {
        onPlay()
      } else if (pendingAction === "multiplayer") {
        onMultiplayer()
      }
      setPendingAction(null)
    }
  }, [isWalletConnected, pendingAction, onPlay, onMultiplayer])

  const handlePlayClick = () => {
    playSound("button-click.mp3")
    
    if (isWalletConnected) {
      onPlay()
    } else {
      setPendingAction("play")
      setShowWalletConnect(true)
    }
  }

  const handleMultiplayerClick = () => {
    playSound("button-click.mp3")
    
    if (isWalletConnected) {
      onMultiplayer()
    } else {
      setPendingAction("multiplayer")
      setShowWalletConnect(true)
    }
  }

  const handleSettingsClick = () => {
    playSound("button-click.mp3")
    onSettings()
  }

  const handleCreditsClick = () => {
    playSound("button-click.mp3")
    setShowCredits(!showCredits)
  }

  const handleSoundToggle = () => {
    playSound("button-click.mp3")
    toggleSound()
  }

  const handleWalletConnected = () => {
    playSound("character-select.mp3")
    // We'll let the useEffect handle navigating to the right screen
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 mb-16"
      >
        <motion.div
          animate={
            titleAnimation
              ? {
                  y: [0, -10, 0],
                  filter: [
                    "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
                    "drop-shadow(0 0 15px rgba(255, 215, 0, 0.7))",
                    "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
                  ],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <img src="/images/logo.png" alt="Chrono Clash Logo" className="w-[600px] max-w-full" />
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {showWalletConnect ? (
          <motion.div
            key="wallet-connect"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative z-10 bg-black/70 p-8 rounded-lg max-w-md mb-8"
          >
            <WalletConnect onWalletConnected={handleWalletConnected} />
            
            <div className="mt-6 text-center">
              <Button
                onClick={() => setShowWalletConnect(false)}
                className="bg-gray-700 hover:bg-gray-800 text-white"
              >
                Back to Main Menu
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="relative z-10 flex flex-col items-center space-y-4 w-64">
            <motion.div
              key="main-menu"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Button
                onClick={handlePlayClick}
                className="w-full py-6 text-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-black font-bold border-2 border-amber-800 flex items-center justify-center"
              >
                <Sword className="h-5 w-5 mr-2" />
                SINGLE PLAYER
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <Button
                onClick={handleMultiplayerClick}
                className="w-full py-6 text-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white font-bold border-2 border-purple-800 flex items-center justify-center"
              >
                <Users className="h-5 w-5 mr-2" />
                MULTIPLAYER
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <Button
                onClick={handleSettingsClick}
                className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
              >
                <Settings className="mr-2 h-5 w-5" />
                SETTINGS
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <Button
                onClick={handleCreditsClick}
                className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
              >
                <Info className="mr-2 h-5 w-5" />
                CREDITS
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-4 left-4 z-10 flex items-center space-x-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSoundToggle}
          className="bg-black/50 hover:bg-black/70 text-white"
        >
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </Button>

        <div className="flex items-center bg-black/50 px-3 py-2 rounded-md">
          <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
          <span className="text-white">High Score: {highScore}</span>
        </div>
        
        {isWalletConnected && (
          <div className="flex items-center bg-black/50 px-3 py-2 rounded-md">
            <span className="text-green-400 text-sm">
              Wallet Connected: {address?.substring(0, 4)}...{address?.substring(address.length - 4)}
            </span>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gray-900 p-8 rounded-lg max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Credits</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200">Game Design</h3>
                  <p className="text-gray-300">Chrono Clash Team</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200">Art & Animation</h3>
                  <p className="text-gray-300">Temporal Studios</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200">Music & Sound</h3>
                  <p className="text-gray-300">Echo Harmonics</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200">Special Thanks</h3>
                  <p className="text-gray-300">All our supporters and beta testers</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowCredits(false)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}













// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Volume2, VolumeX, Settings, Trophy, Info, Users, Sword } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"
// import { useGameState } from "./game-state-provider"
// import { playSound } from "@/lib/sound-utils"

// interface MainMenuProps {
//   onPlay: () => void
//   onMultiplayer: () => void
//   onSettings: () => void
//   soundEnabled: boolean
//   toggleSound: () => void
// }

// export default function MainMenu({ onPlay, onMultiplayer, onSettings, soundEnabled, toggleSound }: MainMenuProps) {
//   const { highScore } = useGameState()
//   const [showCredits, setShowCredits] = useState(false)
//   const [titleAnimation, setTitleAnimation] = useState(false)

//   useEffect(() => {
//     // Start title animation after component mounts
//     setTimeout(() => setTitleAnimation(true), 500)
//   }, [])

//   const handlePlayClick = () => {
//     playSound("button-click.mp3")
//     onPlay()
//   }

//   const handleMultiplayerClick = () => {
//     playSound("button-click.mp3")
//     onMultiplayer()
//   }

//   const handleSettingsClick = () => {
//     playSound("button-click.mp3")
//     onSettings()
//   }

//   const handleCreditsClick = () => {
//     playSound("button-click.mp3")
//     setShowCredits(!showCredits)
//   }

//   const handleSoundToggle = () => {
//     playSound("button-click.mp3")
//     toggleSound()
//   }

//   return (
//     <div
//       className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
//       style={{
//         backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

//       <motion.div
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1, delay: 0.5 }}
//         className="relative z-10 mb-16"
//       >
//         <motion.div
//           animate={
//             titleAnimation
//               ? {
//                   y: [0, -10, 0],
//                   filter: [
//                     "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
//                     "drop-shadow(0 0 15px rgba(255, 215, 0, 0.7))",
//                     "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
//                   ],
//                 }
//               : {}
//           }
//           transition={{
//             duration: 3,
//             repeat: Number.POSITIVE_INFINITY,
//             repeatType: "reverse",
//           }}
//         >
//           <img src="/images/logo.png" alt="Chrono Clash Logo" className="w-[600px] max-w-full" />
//         </motion.div>
//       </motion.div>

//       <div className="relative z-10 flex flex-col items-center space-y-4 w-64">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 1 }}
//         >
//           <Button
//             onClick={handlePlayClick}
//             className="w-full py-6 text-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-black font-bold border-2 border-amber-800 flex items-center justify-center"
//           >
//             <Sword className="h-5 w-5 mr-2" />
//             SINGLE PLAYER
//           </Button>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 1.1 }}
//         >
//           <Button
//             onClick={handleMultiplayerClick}
//             className="w-full py-6 text-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white font-bold border-2 border-purple-800 flex items-center justify-center"
//           >
//             <Users className="h-5 w-5 mr-2" />
//             MULTIPLAYER
//           </Button>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 1.2 }}
//         >
//           <Button
//             onClick={handleSettingsClick}
//             className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
//           >
//             <Settings className="mr-2 h-5 w-5" />
//             SETTINGS
//           </Button>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 1.4 }}
//         >
//           <Button
//             onClick={handleCreditsClick}
//             className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
//           >
//             <Info className="mr-2 h-5 w-5" />
//             CREDITS
//           </Button>
//         </motion.div>
//       </div>

//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 1, delay: 1.8 }}
//         className="absolute bottom-4 left-4 z-10 flex items-center space-x-4"
//       >
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={handleSoundToggle}
//           className="bg-black/50 hover:bg-black/70 text-white"
//         >
//           {soundEnabled ? <Volume2 /> : <VolumeX />}
//         </Button>

//         <div className="flex items-center bg-black/50 px-3 py-2 rounded-md">
//           <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
//           <span className="text-white">High Score: {highScore}</span>
//         </div>
//       </motion.div>

//       <AnimatePresence>
//         {showCredits && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
//             onClick={() => setShowCredits(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.8 }}
//               animate={{ scale: 1 }}
//               exit={{ scale: 0.8 }}
//               className="bg-gray-900 p-8 rounded-lg max-w-md"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Credits</h2>
//               <div className="space-y-4">
//                 <div>
//                   <h3 className="text-lg font-semibold text-yellow-200">Game Design</h3>
//                   <p className="text-gray-300">Chrono Clash Team</p>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-yellow-200">Art & Animation</h3>
//                   <p className="text-gray-300">Temporal Studios</p>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-yellow-200">Music & Sound</h3>
//                   <p className="text-gray-300">Echo Harmonics</p>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-yellow-200">Special Thanks</h3>
//                   <p className="text-gray-300">All our supporters and beta testers</p>
//                 </div>
//               </div>
//               <div className="mt-6 text-center">
//                 <Button
//                   onClick={() => setShowCredits(false)}
//                   className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
//                 >
//                   Close
//                 </Button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }














// // "use client"

// // import { useState, useEffect } from "react"
// // import { Button } from "@/components/ui/button"
// // import { Volume2, VolumeX, Settings, Trophy, Info } from "lucide-react"
// // import { motion, AnimatePresence } from "framer-motion"
// // import { useGameState } from "./game-state-provider"
// // import { playSound } from "@/lib/sound-utils"

// // interface MainMenuProps {
// //   onPlay: () => void
// //   onSettings: () => void
// //   soundEnabled: boolean
// //   toggleSound: () => void
// // }

// // export default function MainMenu({ onPlay, onSettings, soundEnabled, toggleSound }: MainMenuProps) {
// //   const { highScore } = useGameState()
// //   const [showCredits, setShowCredits] = useState(false)
// //   const [titleAnimation, setTitleAnimation] = useState(false)

// //   useEffect(() => {
// //     // Start title animation after component mounts
// //     setTimeout(() => setTitleAnimation(true), 500)
// //   }, [])

// //   const handlePlayClick = () => {
// //     playSound("button-click.mp3")
// //     onPlay()
// //   }

// //   const handleSettingsClick = () => {
// //     playSound("button-click.mp3")
// //     onSettings()
// //   }

// //   const handleCreditsClick = () => {
// //     playSound("button-click.mp3")
// //     setShowCredits(!showCredits)
// //   }

// //   const handleSoundToggle = () => {
// //     playSound("button-click.mp3")
// //     toggleSound()
// //   }

// //   return (
// //     <div
// //       className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
// //       style={{
// //         backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
// //         backgroundSize: "cover",
// //         backgroundPosition: "center",
// //       }}
// //     >
// //       <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

// //       <motion.div
// //         initial={{ opacity: 0, y: -50 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ duration: 1, delay: 0.5 }}
// //         className="relative z-10 mb-16"
// //       >
// //         <motion.div
// //           animate={
// //             titleAnimation
// //               ? {
// //                   y: [0, -10, 0],
// //                   filter: [
// //                     "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
// //                     "drop-shadow(0 0 15px rgba(255, 215, 0, 0.7))",
// //                     "drop-shadow(0 0 0px rgba(255, 215, 0, 0.7))",
// //                   ],
// //                 }
// //               : {}
// //           }
// //           transition={{
// //             duration: 3,
// //             repeat: Number.POSITIVE_INFINITY,
// //             repeatType: "reverse",
// //           }}
// //         >
// //           <img src="/images/logo.png" alt="Chrono Clash Logo" className="w-[600px] max-w-full" />
// //         </motion.div>
// //       </motion.div>

// //       <div className="relative z-10 flex flex-col items-center space-y-4 w-64">
// //         <motion.div
// //           initial={{ opacity: 0, scale: 0.8 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           transition={{ duration: 0.5, delay: 1 }}
// //         >
// //           <Button
// //             onClick={handlePlayClick}
// //             className="w-full py-6 text-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-black font-bold border-2 border-amber-800"
// //           >
// //             PLAY
// //           </Button>
// //         </motion.div>

// //         <motion.div
// //           initial={{ opacity: 0, scale: 0.8 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           transition={{ duration: 0.5, delay: 1.2 }}
// //         >
// //           <Button
// //             onClick={handleSettingsClick}
// //             className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
// //           >
// //             <Settings className="mr-2 h-5 w-5" />
// //             SETTINGS
// //           </Button>
// //         </motion.div>

// //         <motion.div
// //           initial={{ opacity: 0, scale: 0.8 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           transition={{ duration: 0.5, delay: 1.4 }}
// //         >
// //           <Button
// //             onClick={handleCreditsClick}
// //             className="w-full py-4 text-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 border border-slate-500"
// //           >
// //             <Info className="mr-2 h-5 w-5" />
// //             CREDITS
// //           </Button>
// //         </motion.div>
// //       </div>

// //       <motion.div
// //         initial={{ opacity: 0 }}
// //         animate={{ opacity: 1 }}
// //         transition={{ duration: 1, delay: 1.8 }}
// //         className="absolute bottom-4 left-4 z-10 flex items-center space-x-4"
// //       >
// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           onClick={handleSoundToggle}
// //           className="bg-black/50 hover:bg-black/70 text-white"
// //         >
// //           {soundEnabled ? <Volume2 /> : <VolumeX />}
// //         </Button>

// //         <div className="flex items-center bg-black/50 px-3 py-2 rounded-md">
// //           <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
// //           <span className="text-white">High Score: {highScore}</span>
// //         </div>
// //       </motion.div>

// //       <AnimatePresence>
// //         {showCredits && (
// //           <motion.div
// //             initial={{ opacity: 0 }}
// //             animate={{ opacity: 1 }}
// //             exit={{ opacity: 0 }}
// //             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
// //             onClick={() => setShowCredits(false)}
// //           >
// //             <motion.div
// //               initial={{ scale: 0.8 }}
// //               animate={{ scale: 1 }}
// //               exit={{ scale: 0.8 }}
// //               className="bg-gray-900 p-8 rounded-lg max-w-md"
// //               onClick={(e) => e.stopPropagation()}
// //             >
// //               <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Credits</h2>
// //               <div className="space-y-4">
// //                 <div>
// //                   <h3 className="text-lg font-semibold text-yellow-200">Game Design</h3>
// //                   <p className="text-gray-300">Chrono Clash Team</p>
// //                 </div>
// //                 <div>
// //                   <h3 className="text-lg font-semibold text-yellow-200">Art & Animation</h3>
// //                   <p className="text-gray-300">Temporal Studios</p>
// //                 </div>
// //                 <div>
// //                   <h3 className="text-lg font-semibold text-yellow-200">Music & Sound</h3>
// //                   <p className="text-gray-300">Echo Harmonics</p>
// //                 </div>
// //                 <div>
// //                   <h3 className="text-lg font-semibold text-yellow-200">Special Thanks</h3>
// //                   <p className="text-gray-300">All our supporters and beta testers</p>
// //                 </div>
// //               </div>
// //               <div className="mt-6 text-center">
// //                 <Button
// //                   onClick={() => setShowCredits(false)}
// //                   className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
// //                 >
// //                   Close
// //                 </Button>
// //               </div>
// //             </motion.div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //     </div>
// //   )
// // }
