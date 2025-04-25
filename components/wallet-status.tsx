"use client"

import { useActiveAddress, useConnection } from "@arweave-wallet-kit/react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { useState } from "react"

interface WalletStatusProps {
  showDisconnect?: boolean
  className?: string
}

export default function WalletStatus({ showDisconnect = false, className = "" }: WalletStatusProps) {
  const { connected, connect, disconnect } = useConnection()
  const address = useActiveAddress()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  if (!connected || !address) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleConnect}
        disabled={isConnecting}
        className={`bg-black/50 border-purple-600 hover:bg-purple-950/30 ${className}`}
      >
        {isConnecting ? (
          <>
            <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin mr-1"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-1" />
            <span>Connect Wallet</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-purple-950/30 border border-purple-600 rounded-full px-3 py-1 text-xs flex items-center">
        <Wallet className="h-3 w-3 text-purple-400 mr-1" />
        <span className="text-purple-200">
          {address.substring(0, 4)}...{address.substring(address.length - 4)}
        </span>
      </div>

      {showDisconnect && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDisconnect}
          className="h-7 w-7 rounded-full bg-red-900/20 hover:bg-red-900/40 text-red-400"
          title="Disconnect wallet"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}