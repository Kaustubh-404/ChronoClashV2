"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Volume2, Music, Gamepad } from "lucide-react"
import { motion } from "framer-motion"
import { playSound } from "@/lib/sound-utils"

interface SettingsScreenProps {
  onBack: () => void
  soundEnabled: boolean
  toggleSound: () => void
  musicVolume: number
  sfxVolume: number
  updateMusicVolume: (volume: number) => void
  updateSfxVolume: (volume: number) => void
}

export default function SettingsScreen({
  onBack,
  soundEnabled,
  toggleSound,
  musicVolume,
  sfxVolume,
  updateMusicVolume,
  updateSfxVolume,
}: SettingsScreenProps) {
  const handleBack = () => {
    playSound("button-click.mp3")
    onBack()
  }

  const handleSoundToggle = () => {
    toggleSound()
  }

  const handleMusicVolumeChange = (value: number[]) => {
    updateMusicVolume(value[0])
  }

  const handleSfxVolumeChange = (value: number[]) => {
    updateSfxVolume(value[0])
    // Play a sound to demonstrate the new volume
    playSound("button-click.mp3")
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8"
      >
        <h1 className="text-4xl font-bold text-center text-yellow-400">Settings</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 bg-black/80 p-8 rounded-lg w-full max-w-md"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Volume2 className="h-5 w-5 text-yellow-400 mr-3" />
              <span className="text-lg">Sound Effects</span>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Music className="h-5 w-5 text-yellow-400 mr-3" />
              <span className="text-lg">Music Volume</span>
            </div>
            <Slider
              defaultValue={[musicVolume]}
              max={1}
              step={0.1}
              value={[musicVolume]}
              onValueChange={handleMusicVolumeChange}
              className="w-full"
            />
            <div className="text-right text-sm text-gray-400">{Math.round(musicVolume * 100)}%</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Gamepad className="h-5 w-5 text-yellow-400 mr-3" />
              <span className="text-lg">SFX Volume</span>
            </div>
            <Slider
              defaultValue={[sfxVolume]}
              max={1}
              step={0.1}
              value={[sfxVolume]}
              onValueChange={handleSfxVolumeChange}
              className="w-full"
            />
            <div className="text-right text-sm text-gray-400">{Math.round(sfxVolume * 100)}%</div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleBack}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-bold"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Main Menu
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
