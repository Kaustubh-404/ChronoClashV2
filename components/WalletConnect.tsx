"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConnectButton, useActiveAddress, useConnection } from "@arweave-wallet-kit/react"
import { motion } from "framer-motion"

interface WalletConnectProps {
  onWalletConnected: () => void
}

export default function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const { connected, connect } = useConnection()
  const address = useActiveAddress()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Check if wallet is connected and call the callback
  useEffect(() => {
    if (connected && address) {
      onWalletConnected()
    }
  }, [connected, address, onWalletConnected])

  const handleConnect = async () => {
    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      await connect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      setConnectionError("Could not connect to wallet. Please ensure Wander extension is installed.")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Connect Your Wallet</h2>
        <p className="text-center text-gray-300">Connect your Wander wallet to continue to Chrono Clash</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center"
      >
        {!connected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-6 rounded-full flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin mr-2"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M4 4H20V16H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 16V20H16V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Connect Wander Wallet</span>
              </>
            )}
          </Button>
        ) : (
          <div className="bg-green-800/30 border border-green-600 rounded-lg px-4 py-3 text-center">
            <p className="text-green-400 font-bold">Wallet Connected!</p>
            <p className="text-sm text-gray-300 mt-1">
              {address?.substring(0, 6)}...{address?.substring(address.length - 6)}
            </p>
          </div>
        )}

        {connectionError && (
          <div className="mt-4 bg-red-800/30 border border-red-600 rounded-lg px-4 py-3 text-center max-w-xs">
            <p className="text-red-400 text-sm">{connectionError}</p>
          </div>
        )}
      </motion.div>

      <div className="mt-2 text-sm text-gray-400">
        <p>Don't have a wallet? <a href="https://wander.app/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Get Wander</a></p>
      </div>
    </div>
  )
}