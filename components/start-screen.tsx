"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Sword, Shield } from "lucide-react"

export function StartScreen({ onStart }: { onStart: () => void }) {
  const [titleClass, setTitleClass] = useState("opacity-0 translate-y-10")
  const [subtitleClass, setSubtitleClass] = useState("opacity-0")
  const [buttonClass, setButtonClass] = useState("opacity-0 translate-y-10")

  useEffect(() => {
    // Animate title after component mounts
    setTimeout(() => setTitleClass("opacity-100 translate-y-0"), 300)
    // Animate subtitle after title
    setTimeout(() => setSubtitleClass("opacity-100"), 1000)
    // Animate button after subtitle
    setTimeout(() => setButtonClass("opacity-100 translate-y-0"), 1500)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-2xl">
      <div className={`transition-all duration-1000 ease-out ${titleClass}`}>
        <h1 className="text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          CHRONO CLASH
        </h1>
      </div>

      <div className={`transition-all duration-1000 ease-out ${subtitleClass}`}>
        <p className="text-xl text-gray-300 mb-8">Battle through time, control the clock, defeat your enemies</p>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple-900/50 flex items-center justify-center mb-3">
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="font-bold text-purple-400">Time Magic</h3>
          <p className="text-sm text-gray-400">Control the flow of time</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mb-3">
            <Sword className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="font-bold text-red-400">Epic Battles</h3>
          <p className="text-sm text-gray-400">Fight through the ages</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="font-bold text-blue-400">Strategic Combat</h3>
          <p className="text-sm text-gray-400">Plan your moves wisely</p>
        </div>
      </div>

      <div className={`transition-all duration-1000 ease-out ${buttonClass}`}>
        <Button
          onClick={onStart}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          Begin Your Journey
        </Button>
      </div>
    </div>
  )
}
