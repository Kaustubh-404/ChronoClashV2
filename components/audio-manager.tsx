"use client"

import { useEffect, useRef } from "react"
import { Howl, Howler } from "howler"

interface AudioManagerProps {
  soundEnabled: boolean
  musicVolume: number
  sfxVolume: number
}

export default function AudioManager({ soundEnabled, musicVolume, sfxVolume }: AudioManagerProps) {
  const bgMusicRef = useRef<Howl | null>(null)

  // Initialize background music
  useEffect(() => {
    bgMusicRef.current = new Howl({
      src: ["/audio/main-theme.mp3"],
      loop: true,
      volume: musicVolume,
      autoplay: true,
    })

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop()
      }
    }
  }, [])

  // Update music volume when it changes
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume(musicVolume)
    }
  }, [musicVolume])

  // Update global Howler volume for sound effects
  useEffect(() => {
    Howler.volume(sfxVolume)
  }, [sfxVolume])

  // Mute/unmute all sounds
  useEffect(() => {
    Howler.mute(!soundEnabled)
  }, [soundEnabled])

  return null
}
