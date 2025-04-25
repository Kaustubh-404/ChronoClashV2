"use client"

import { useState, useEffect } from "react"
import { GameStateProvider } from "@/components/game-state-provider"
import { MultiplayerProvider } from "@/components/multiplayer-context-provider"
import MainMenu from "@/components/main-menu"
import GameScreenComponent from "@/components/game-screen"
import CharacterSelect from "@/components/character-select"
import GameOver from "@/components/game-over"
import VictoryScreen from "@/components/victory-screen"
import LoadingScreen from "@/components/loading-screen"
import SettingsScreen from "@/components/settings-screen"
import MultiplayerMenu from "@/components/multiplayer-menu"
import CreateRoom from "@/components/create-room"
import JoinRoom from "@/components/join-room"
import MultiplayerBattleRoom from "@/components/multiplayer-battle-room"
import MultiplayerBattle from "@/components/multiplayer-battle"
import AudioManager from "@/components/audio-manager"
import { Howl } from "howler"

export type GameScreen = 
  | "loading" 
  | "main-menu" 
  | "character-select" 
  | "game" 
  | "game-over" 
  | "victory" 
  | "settings"
  | "multiplayer-menu"
  | "create-room"
  | "join-room"
  | "multiplayer-room"
  | "multiplayer-character-select"
  | "multiplayer-battle"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("loading")
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.7)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [gameMode, setGameMode] = useState<"singleplayer" | "multiplayer">("singleplayer")

  // Simulate loading assets
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
      setCurrentScreen("main-menu")
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Initialize background music
  useEffect(() => {
    const bgMusic = new Howl({
      src: ["/audio/main-theme.mp3"],
      loop: true,
      volume: musicVolume,
      autoplay: false,
    })

    if (isLoaded && !isMusicPlaying) {
      bgMusic.play()
      setIsMusicPlaying(true)
    }

    return () => {
      bgMusic.stop()
    }
  }, [isLoaded, isMusicPlaying, musicVolume])

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  const updateMusicVolume = (volume: number) => {
    setMusicVolume(volume)
  }

  const updateSfxVolume = (volume: number) => {
    setSfxVolume(volume)
  }
  
  // Handle room creation/joining
  const handleRoomCreated = (roomId: string) => {
    setActiveRoomId(roomId)
    setCurrentScreen("multiplayer-room")
  }

  const handleRoomJoined = (roomId: string) => {
    setActiveRoomId(roomId)
    setCurrentScreen("multiplayer-room")
  }

  return (
    <GameStateProvider>
      <MultiplayerProvider>
        <AudioManager soundEnabled={soundEnabled} musicVolume={musicVolume} sfxVolume={sfxVolume} />

        {currentScreen === "loading" && <LoadingScreen />}

        {currentScreen === "main-menu" && (
          <MainMenu
            onPlay={() => {
              setGameMode("singleplayer")
              setCurrentScreen("character-select")
            }}
            onMultiplayer={() => {
              setGameMode("multiplayer")
              setCurrentScreen("multiplayer-menu")
            }}
            onSettings={() => setCurrentScreen("settings")}
            soundEnabled={soundEnabled}
            toggleSound={toggleSound}
          />
        )}

        {/* Single Player Screens */}
        {currentScreen === "character-select" && (
          <CharacterSelect 
            onSelect={() => setCurrentScreen("game")} 
            onBack={() => setCurrentScreen("main-menu")} 
          />
        )}

        {currentScreen === "game" && (
          <GameScreenComponent
            onGameOver={() => setCurrentScreen("game-over")}
            onVictory={() => setCurrentScreen("victory")}
            onExit={() => setCurrentScreen("main-menu")}
          />
        )}

        {currentScreen === "game-over" && (
          <GameOver 
            onRestart={() => setCurrentScreen("game")} 
            onMainMenu={() => setCurrentScreen("main-menu")} 
          />
        )}

        {currentScreen === "victory" && (
          <VictoryScreen 
            onContinue={() => setCurrentScreen("game")} 
            onMainMenu={() => setCurrentScreen("main-menu")} 
          />
        )}

        {/* Multiplayer Screens */}
        {currentScreen === "multiplayer-menu" && (
          <MultiplayerMenu
            onCreateRoom={() => setCurrentScreen("create-room")}
            onJoinRoom={() => setCurrentScreen("join-room")}
            onBack={() => setCurrentScreen("main-menu")}
          />
        )}

        {currentScreen === "create-room" && (
          <CreateRoom
            onBack={() => setCurrentScreen("multiplayer-menu")}
            onRoomCreated={handleRoomCreated}
          />
        )}

        {currentScreen === "join-room" && (
          <JoinRoom
            onBack={() => setCurrentScreen("multiplayer-menu")}
            onRoomJoined={handleRoomJoined}
          />
        )}

        {currentScreen === "multiplayer-room" && (
          <MultiplayerBattleRoom
            onBack={() => {
              setActiveRoomId(null)
              setCurrentScreen("multiplayer-menu")
            }}
            onCharacterSelect={() => setCurrentScreen("multiplayer-character-select")}
            onStartBattle={() => setCurrentScreen("multiplayer-battle")}
            onEndBattle={() => setCurrentScreen("multiplayer-menu")}
          />
        )}

        {currentScreen === "multiplayer-character-select" && (
          <CharacterSelect 
            onSelect={() => setCurrentScreen("multiplayer-room")} 
            onBack={() => setCurrentScreen("multiplayer-room")} 
            isMultiplayer={true}
          />
        )}

        {currentScreen === "multiplayer-battle" && (
          <MultiplayerBattle
            onGameOver={() => setCurrentScreen("game-over")}
            onVictory={() => setCurrentScreen("victory")}
            onExit={() => {
              setActiveRoomId(null)
              setCurrentScreen("multiplayer-menu")
            }}
          />
        )}

        {currentScreen === "settings" && (
          <SettingsScreen
            onBack={() => setCurrentScreen("main-menu")}
            soundEnabled={soundEnabled}
            toggleSound={toggleSound}
            musicVolume={musicVolume}
            sfxVolume={sfxVolume}
            updateMusicVolume={updateMusicVolume}
            updateSfxVolume={updateSfxVolume}
          />
        )}
      </MultiplayerProvider>
    </GameStateProvider>
  )
}

















// "use client"

// import { useState, useEffect } from "react"
// import { GameStateProvider } from "@/components/game-state-provider"
// import MainMenu from "@/components/main-menu"
// import GameScreenComponent from "@/components/game-screen"
// import CharacterSelect from "@/components/character-select"
// import GameOver from "@/components/game-over"
// import VictoryScreen from "@/components/victory-screen"
// import LoadingScreen from "@/components/loading-screen"
// import SettingsScreen from "@/components/settings-screen"
// import AudioManager from "@/components/audio-manager"
// import { Howl } from "howler"

// export type GameScreen = "loading" | "main-menu" | "character-select" | "game" | "game-over" | "victory" | "settings"

// export default function Home() {
//   const [currentScreen, setCurrentScreen] = useState<GameScreen>("loading")
//   const [isLoaded, setIsLoaded] = useState(false)
//   const [isMusicPlaying, setIsMusicPlaying] = useState(false)
//   const [soundEnabled, setSoundEnabled] = useState(true)
//   const [musicVolume, setMusicVolume] = useState(0.5)
//   const [sfxVolume, setSfxVolume] = useState(0.7)

//   // Simulate loading assets
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoaded(true)
//       setCurrentScreen("main-menu")
//     }, 3000)
//     return () => clearTimeout(timer)
//   }, [])

//   // Initialize background music
//   useEffect(() => {
//     const bgMusic = new Howl({
//       src: ["/audio/main-theme.mp3"],
//       loop: true,
//       volume: musicVolume,
//       autoplay: false,
//     })

//     if (isLoaded && !isMusicPlaying) {
//       bgMusic.play()
//       setIsMusicPlaying(true)
//     }

//     return () => {
//       bgMusic.stop()
//     }
//   }, [isLoaded, isMusicPlaying, musicVolume])

//   const toggleSound = () => {
//     setSoundEnabled(!soundEnabled)
//   }

//   const updateMusicVolume = (volume: number) => {
//     setMusicVolume(volume)
//   }

//   const updateSfxVolume = (volume: number) => {
//     setSfxVolume(volume)
//   }

//   return (
//     <GameStateProvider>
//       <AudioManager soundEnabled={soundEnabled} musicVolume={musicVolume} sfxVolume={sfxVolume} />

//       {currentScreen === "loading" && <LoadingScreen />}

//       {currentScreen === "main-menu" && (
//         <MainMenu
//           onPlay={() => setCurrentScreen("character-select")}
//           onSettings={() => setCurrentScreen("settings")}
//           soundEnabled={soundEnabled}
//           toggleSound={toggleSound}
//         />
//       )}

//       {currentScreen === "character-select" && (
//         <CharacterSelect onSelect={() => setCurrentScreen("game")} onBack={() => setCurrentScreen("main-menu")} />
//       )}

//       {currentScreen === "game" && (
//         <GameScreenComponent
//           onGameOver={() => setCurrentScreen("game-over")}
//           onVictory={() => setCurrentScreen("victory")}
//           onExit={() => setCurrentScreen("main-menu")}
//         />
//       )}

//       {currentScreen === "game-over" && (
//         <GameOver onRestart={() => setCurrentScreen("game")} onMainMenu={() => setCurrentScreen("main-menu")} />
//       )}

//       {currentScreen === "victory" && (
//         <VictoryScreen onContinue={() => setCurrentScreen("game")} onMainMenu={() => setCurrentScreen("main-menu")} />
//       )}

//       {currentScreen === "settings" && (
//         <SettingsScreen
//           onBack={() => setCurrentScreen("main-menu")}
//           soundEnabled={soundEnabled}
//           toggleSound={toggleSound}
//           musicVolume={musicVolume}
//           sfxVolume={sfxVolume}
//           updateMusicVolume={updateMusicVolume}
//           updateSfxVolume={updateSfxVolume}
//         />
//       )}
//     </GameStateProvider>
//   )
// }
