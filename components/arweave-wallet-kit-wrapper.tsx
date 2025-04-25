"use client"

import { ArweaveWalletKit } from "@arweave-wallet-kit/react"
import WanderStrategy from "@arweave-wallet-kit/wander-strategy"
import { ReactNode } from "react"

export default function ArweaveWalletKitWrapper({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <ArweaveWalletKit
      config={{
        permissions: [
          "ACCESS_ADDRESS",
          "ACCESS_PUBLIC_KEY",
        ],
        ensurePermissions: true,
        strategies: [
          new WanderStrategy(),
        ],
      }}
    >
      {children}
    </ArweaveWalletKit>
  )
}