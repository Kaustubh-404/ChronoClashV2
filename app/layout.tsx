import type React from "react"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { GameContextProvider } from "@/components/game-context-provider"
import ArweaveWalletKitWrapper from "@/components/arweave-wallet-kit-wrapper"

export const metadata = {
  title: "Chrono Clash",
  description: "An epic time-based battle game",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <ArweaveWalletKitWrapper>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <GameContextProvider>{children}</GameContextProvider>
          </ThemeProvider>
        </ArweaveWalletKitWrapper>
      </body>
    </html>
  )
}

// import type React from "react"
// import "@/styles/globals.css"
// import { ThemeProvider } from "@/components/theme-provider"
// import { GameContextProvider } from "@/components/game-context-provider"

// export const metadata = {
//   title: "Chrono Clash",
//   description: "An epic time-based battle game",
//     generator: 'v0.dev'
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
//         <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
//           <GameContextProvider>{children}</GameContextProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }
