"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Character } from "./game-state-provider"
import { socketService } from "@/lib/socket-service"
import { playSound } from "@/lib/sound-utils"

// Define types for room data
export interface RoomData {
  id: string
  name: string
  hostId: string
  hostName?: string
  hostCharacter?: Character
  guestId: string | null
  guestName?: string
  guestCharacter?: Character
  status: 'waiting' | 'ready' | 'in-progress' | 'completed'
  players: string[]
  maxPlayers: number
  gameData: {
    turnCount: number
    currentTurn: string | null
    battleLog: string[]
    startTime: number | null
    endTime: number | null
    winner: string | null
  }
  createdAt: number
  lastActivity: number
}

type MultiplayerContextType = {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  isHost: boolean
  playerId: string | null
  playerName: string
  currentRoom: RoomData | null
  availableRooms: RoomData[]
  setPlayerName: (name: string) => void
  connect: () => Promise<void>
  disconnect: () => void
  createRoom: (name?: string, isPrivate?: boolean) => string | null
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  selectCharacter: (character: Character) => void
  setReady: (isReady?: boolean) => void
  updateOpponentHealth: (health: number) => void
  endBattle: (winnerId: string) => void
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext)
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider")
  }
  return context
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  // Socket and connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  // Player state
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("chronoClash_playerName") || `Player_${Math.floor(Math.random() * 10000)}`
    }
    return `Player_${Math.floor(Math.random() * 10000)}`
  })
  
  // Room state
  const [isHost, setIsHost] = useState<boolean>(false)
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null)
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([])
  
  // Save player name to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("chronoClash_playerName", playerName)
    }
  }, [playerName])
  
  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Room creation events
    socketService.on('room_created', (data: any) => {
      const room = data.room
      console.log("Room created event received:", room)
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('room_created', { detail: data })
      window.dispatchEvent(event)
      
      setCurrentRoom(room)
      setIsHost(true)
      
      // Play sound effect
      playSound('room-created.mp3')
    })
    
    socketService.on('create_room_error', (data: any) => {
      console.error('Failed to create room:', data.error)
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('create_room_error', { detail: data })
      window.dispatchEvent(event)
    })
    
    // Room joining events
    socketService.on('room_joined', (data: any) => {
      const room = data.room
      console.log("Room joined event received:", room)
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('room_joined', { detail: data })
      window.dispatchEvent(event)
      
      setCurrentRoom(room)
      setIsHost(room.hostId === playerId)
      
      // Play sound effect
      playSound('room-joined.mp3')
    })
    
    socketService.on('join_room_error', (data: any) => {
      console.error('Failed to join room:', data.error)
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('join_room_error', { detail: data })
      window.dispatchEvent(event)
    })
    
    // Player events
    socketService.on('player_joined', (data: any) => {
      console.log('Player joined:', data)
      
      // Update current room if we're in it
      if (currentRoom && data.roomId === currentRoom.id) {
        setCurrentRoom(prev => {
          if (!prev) return null
          
          // Add player to the room's players list if not already there
          const updatedPlayers = prev.players.includes(data.player.id)
            ? prev.players
            : [...prev.players, data.player.id]
          
          // Update guest info if this is a new guest
          let updatedGuestId = prev.guestId
          let updatedGuestName = prev.guestName
          
          if (!prev.guestId && data.player.id !== prev.hostId) {
            updatedGuestId = data.player.id
            updatedGuestName = data.player.name
          }
          
          return {
            ...prev,
            players: updatedPlayers,
            guestId: updatedGuestId,
            guestName: updatedGuestName
          }
        })
      }
      
      // Play sound effect
      playSound('player-joined.mp3')
    })
    
    socketService.on('player_left', (data: any) => {
      console.log('Player left:', data)
      
      // Update current room if we're in it
      if (currentRoom && currentRoom.players.includes(data.playerId)) {
        setCurrentRoom(prev => {
          if (!prev) return null
          
          // Remove player from the room's players list
          const updatedPlayers = prev.players.filter(id => id !== data.playerId)
          
          // Clear guest info if the guest left
          let updatedGuestId = prev.guestId
          let updatedGuestName = prev.guestName
          let updatedGuestCharacter = prev.guestCharacter
          
          if (prev.guestId === data.playerId) {
            updatedGuestId = null
            updatedGuestName = undefined
            updatedGuestCharacter = undefined
          }
          
          return {
            ...prev,
            players: updatedPlayers,
            guestId: updatedGuestId,
            guestName: updatedGuestName,
            guestCharacter: updatedGuestCharacter
          }
        })
      }
      
      // Play sound effect
      playSound('player-left.mp3')
    })
    
    // Room updates
    socketService.on('room_updated', (data: any) => {
      console.log('Room updated:', data)
      
      // Update current room if it's our room
      if (currentRoom && data.room.id === currentRoom.id) {
        setCurrentRoom(data.room)
      }
    })
    
    // Available rooms updates
    socketService.on('room_available', (data: any) => {
      console.log('Room available:', data)
      
      setAvailableRooms(prev => {
        // Check if room is already in the list
        const roomIndex = prev.findIndex(room => room.id === data.id)
        
        if (roomIndex >= 0) {
          // Update existing room
          const updatedRooms = [...prev]
          updatedRooms[roomIndex] = data
          return updatedRooms
        } else {
          // Add new room
          return [...prev, data]
        }
      })
    })
    
    socketService.on('room_unavailable', (data: any) => {
      console.log('Room unavailable:', data)
      
      setAvailableRooms(prev => 
        prev.filter(room => room.id !== data.roomId)
      )
    })
    
    // Character selection
    socketService.on('character_selected', (data: any) => {
      console.log('Character selected:', data)
      
      // Update current room with character info
      if (currentRoom) {
        setCurrentRoom(prev => {
          if (!prev) return null
          
          if (data.playerId === prev.hostId) {
            return { ...prev, hostCharacter: data.character }
          } else if (data.playerId === prev.guestId) {
            return { ...prev, guestCharacter: data.character }
          }
          
          return prev
        })
      }
      
      // Play sound effect
      playSound('character-select.mp3')
    })
    
    // Player ready status
    socketService.on('player_ready_updated', (data: any) => {
      console.log('Player ready updated:', data)
      
      // Update current room with ready status
      // In this implementation we don't track individual ready status directly
      // Instead, we rely on the room status updates
      
      // Play sound effect
      if (data.isReady) {
        playSound('player-ready.mp3')
      }
    })
    
    // Game events
    socketService.on('game_countdown', (data: any) => {
      console.log('Game countdown:', data)
      
      // Play countdown sound
      playSound('countdown.mp3')
    })
    
    socketService.on('game_started', (data: any) => {
      console.log('Game started:', data)
      
      // Update current room with game data
      if (currentRoom && data.room.id === currentRoom.id) {
        setCurrentRoom(data.room)
      }
      
      // Play game start sound
      playSound('battle-start.mp3')
    })
    
    socketService.on('game_action_performed', (data: any) => {
      console.log('Game action performed:', data)
      
      // Update current room with latest game state
      if (currentRoom && data.gameData) {
        setCurrentRoom(prev => {
          if (!prev) return null
          
          return {
            ...prev,
            gameData: {
              ...prev.gameData,
              turnCount: data.gameData.turnCount,
              currentTurn: data.gameData.currentTurn,
              battleLog: [
                ...prev.gameData.battleLog,
                ...(data.gameData.battleLog || [])
              ].slice(-20) // Keep last 20 log entries
            }
          }
        })
      }
      
      // Play appropriate ability sound based on the action
      if (data.action?.type === 'ability' && data.result?.ability?.type) {
        const abilityType = data.result.ability.type
        let soundFile = 'ability.mp3'
        
        switch (abilityType) {
          case 'time':
            soundFile = 'time-ability.mp3'
            break
          case 'fire':
            soundFile = 'fire-ability.mp3'
            break
          case 'lightning':
            soundFile = 'lightning-ability.mp3'
            break
        }
        
        playSound(soundFile)
      }
    })
    
    socketService.on('game_over', (data: any) => {
      console.log('Game over:', data)
      
      // Update current room with game over state
      if (currentRoom) {
        setCurrentRoom(prev => {
          if (!prev) return null
          
          return {
            ...prev,
            status: 'completed',
            gameData: {
              ...prev.gameData,
              winner: data.winnerId,
              endTime: Date.now(),
              battleLog: [
                ...prev.gameData.battleLog,
                `${data.winnerName} wins the battle!`
              ]
            }
          }
        })
      }
      
      // Play victory or defeat sound
      if (data.winnerId === playerId) {
        playSound('victory.mp3')
      } else {
        playSound('defeat.mp3')
      }
    })
  }
  
  // Connect to socket server
  const connect = async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      if (socketService.isConnected()) {
        setIsConnected(true)
        setPlayerId(socketService.getPlayerId())
        
        // Fetch available rooms if we're already connected
        const rooms = await socketService.getAvailableRooms()
        setAvailableRooms(rooms || [])
        
        return
      }
      
      // Connect to socket server
      const id = await socketService.connect()
      setPlayerId(id)
      setIsConnected(true)
      
      // Setup socket event listeners
      setupSocketListeners()
      
      // Fetch available rooms
      const rooms = await socketService.getAvailableRooms()
      setAvailableRooms(rooms || [])
      
    } catch (error) {
      console.error('Failed to connect to socket server:', error)
      setConnectionError('Failed to connect to server. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Disconnect from socket server
  const disconnect = () => {
    socketService.disconnect()
    setIsConnected(false)
    setPlayerId(null)
    setCurrentRoom(null)
    setAvailableRooms([])
  }
  
  // Create a new room
  const createRoom = (name?: string, isPrivate: boolean = false): string | null => {
    if (!isConnected) {
      console.error("Socket not connected. Cannot create room.")
      throw new Error("Not connected to multiplayer service")
    }
    
    try {
      // Generate a local room ID for immediate feedback
      // The actual room ID will be provided by the server
      const tempRoomId = generateTempRoomId()
      
      // Call the socket service to create the room
      socketService.createRoom(name || `${playerName}'s Room`, isPrivate)
      
      return tempRoomId
    } catch (error) {
      console.error("Error creating room:", error)
      throw error
    }
  }
  
  // Generate a temporary room ID for UI purposes
  const generateTempRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
  
  // Join a room
  const joinRoom = (roomId: string) => {
    if (!isConnected) {
      connect().then(() => {
        socketService.joinRoom(roomId)
      }).catch(error => {
        console.error("Failed to connect before joining room:", error)
        const errorEvent = new CustomEvent('join_room_error', { 
          detail: { error: "Failed to connect to multiplayer service" } 
        })
        window.dispatchEvent(errorEvent)
      })
    } else {
      socketService.joinRoom(roomId)
    }
  }
  
  // Leave the current room
  const leaveRoom = () => {
    if (currentRoom && isConnected) {
      socketService.leaveRoom(currentRoom.id)
      setCurrentRoom(null)
    }
  }
  
  // Select a character
  const selectCharacter = (character: Character) => {
    if (currentRoom && isConnected) {
      socketService.selectCharacter(character)
      
      // Update local state immediately for better UX
      setCurrentRoom(prev => {
        if (!prev) return null
        
        if (isHost) {
          return { ...prev, hostCharacter: character }
        } else {
          return { ...prev, guestCharacter: character }
        }
      })
    }
  }
  
  // Set ready status
  const setReady = (isReady: boolean = true) => {
    if (currentRoom && isConnected) {
      socketService.setPlayerReady(isReady)
    }
  }
  
  // Update opponent health (for multiplayer battles)
  const updateOpponentHealth = (health: number) => {
    if (!currentRoom || !isConnected) return
    
    // Get the target player ID (opponent)
    const targetPlayerId = isHost ? 
      (currentRoom.guestId || undefined) : 
      (currentRoom.hostId || undefined)
    
    // Only proceed if we have a valid target
    if (!targetPlayerId) {
      console.error("No valid target player found for health update")
      return
    }
    
    // In a real implementation, this would send a game action to the server
    // For now, we'll just simulate it locally
    socketService.performGameAction({
      type: 'ability',
      abilityId: 'damage', // Generic damage ability
      targetId: targetPlayerId // Now this is a string or undefined, not null
    })
  }
  
  // End battle
  const endBattle = (winnerId: string) => {
    if (!currentRoom || !isConnected) return
    
    // In a real implementation, this would be handled by the server
    // For now, we'll just simulate it locally by doing a surrender action
    socketService.performGameAction({
      type: 'surrender'
    })
  }
  
  // Auto-connect to socket server on component mount
  useEffect(() => {
    // Try to connect if not already connected
    if (!isConnected && !isConnecting) {
      connect().catch(err => {
        console.error("Failed to auto-connect:", err)
      })
    }
    
    // Cleanup on unmount
    return () => {
      // Don't disconnect on component unmount as it might be used in other parts of the app
    }
  }, [])
  
  return (
    <MultiplayerContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectionError,
        isHost,
        playerId,
        playerName,
        currentRoom,
        availableRooms,
        setPlayerName,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        leaveRoom,
        selectCharacter,
        setReady,
        updateOpponentHealth,
        endBattle
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}











// "use client"

// import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
// import { type Character } from "./game-state-provider"
// import { 
//   socketService, 
//   type RoomData, 
//   type GameData, 
//   type GameAction,
//   type PlayerData as SocketPlayerData,
//   type SocketEvent
// } from "@/lib/socket-service"
// import { playSound } from "@/lib/sound-utils"

// // Define interfaces for event data
// interface RoomCreatedData {
//   room: RoomData;
// }

// interface RoomErrorData {
//   error: string;
// }

// interface PlayerData {
//   id: string;
//   name: string;
//   character: Character | null;
//   isReady: boolean;
//   health: number;
//   maxHealth: number;
//   mana: number;
//   maxMana: number;
// }

// interface PlayerJoinedData {
//   player: PlayerData;
// }

// interface PlayerLeftData {
//   playerId: string;
//   playerName: string;
// }

// interface RoomUpdatedData {
//   room: RoomData;
// }

// interface CharacterSelectedData {
//   playerId: string;
//   playerName: string;
//   character: Character;
// }

// interface PlayerReadyUpdatedData {
//   playerId: string;
//   playerName: string;
//   isReady: boolean;
// }

// interface GameCountdownData {
//   countdown: number;
// }

// interface GameStartedData {
//   room: RoomData;
//   gameData: GameData;
// }

// interface AbilityResult {
//   actingPlayerId: string;
//   actingPlayerHealth: number;
//   actingPlayerMana: number;
//   targetPlayerId: string;
//   targetPlayerHealth: number;
//   ability?: {
//     id?: string;
//     name?: string;
//     type: 'time' | 'fire' | 'lightning' | string;
//   };
//   damage?: number;
//   surrender?: boolean;
// }

// interface GameActionPerformedData {
//   playerId: string;
//   action: GameAction;
//   result: AbilityResult;
//   gameData: GameData;
// }

// interface GameOverData {
//   winnerId: string;
//   winnerName: string;
//   gameData: GameData;
// }

// interface ChatMessageData {
//   playerId: string;
//   playerName: string;
//   message: string;
// }

// type MultiplayerContextType = {
//   isConnected: boolean
//   isConnecting: boolean
//   connectionError: string | null
//   isHost: boolean
//   playerId: string | null
//   playerName: string
//   currentRoom: RoomData | null
//   availableRooms: RoomData[]
//   setPlayerName: (name: string) => void
//   connect: () => Promise<void>
//   disconnect: () => void
//   createRoom: (name: string, isPrivate?: boolean) => void
//   joinRoom: (roomId: string) => void
//   leaveRoom: () => void
//   selectCharacter: (character: Character) => void
//   setReady: (isReady: boolean) => void
//   performGameAction: (action: GameAction) => void
//   sendChatMessage: (message: string) => void
//   players: Map<string, PlayerData>
//   gameState: {
//     turnCount: number
//     currentTurn: string | null
//     isPlayerTurn: boolean
//     battleLog: string[]
//     gameStarted: boolean
//     gameOver: boolean
//     winner: string | null
//     countdown: number | null
//   }
// }

// const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

// export const useMultiplayer = () => {
//   const context = useContext(MultiplayerContext)
//   if (!context) {
//     throw new Error("useMultiplayer must be used within a MultiplayerProvider")
//   }
//   return context
// }

// export function MultiplayerProvider({ children }: { children: ReactNode }) {
//   // Socket and connection state
//   const [isConnected, setIsConnected] = useState(false)
//   const [isConnecting, setIsConnecting] = useState(false)
//   const [connectionError, setConnectionError] = useState<string | null>(null)
  
//   // Player state
//   const [playerId, setPlayerId] = useState<string | null>(null)
//   const [playerName, setPlayerName] = useState<string>(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem("chronoClash_playerName") || `Player_${Math.floor(Math.random() * 10000)}`
//     }
//     return `Player_${Math.floor(Math.random() * 10000)}`
//   })
  
//   // Room state
//   const [isHost, setIsHost] = useState<boolean>(false)
//   const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null)
//   const [availableRooms, setAvailableRooms] = useState<RoomData[]>([])
  
//   // Game state
//   const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map())
//   const [turnCount, setTurnCount] = useState<number>(0)
//   const [currentTurn, setCurrentTurn] = useState<string | null>(null)
//   const [battleLog, setBattleLog] = useState<string[]>([])
//   const [gameStarted, setGameStarted] = useState<boolean>(false)
//   const [gameOver, setGameOver] = useState<boolean>(false)
//   const [winner, setWinner] = useState<string | null>(null)
//   const [countdown, setCountdown] = useState<number | null>(null)
  
//   // Save player name to localStorage when it changes
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       localStorage.setItem("chronoClash_playerName", playerName)
//     }
//   }, [playerName])
  
//   // Setup socket event listeners
//   const setupSocketListeners = () => {
//     // Room creation events
//     socketService.on('room_created', (data: RoomCreatedData) => {
//       const { room } = data
//       setCurrentRoom(room)
//       setIsHost(true)
//       // Add ourselves to players map
//       const player = {
//         id: playerId as string,
//         name: playerName,
//         character: null,
//         isReady: false,
//         health: 0,
//         maxHealth: 0,
//         mana: 0,
//         maxMana: 0
//       }
//       setPlayers(new Map([[playerId as string, player]]))
      
//       // Play sound effect
//       playSound('room-created.mp3')
//     })
    
//     socketService.on('create_room_error', (data: RoomErrorData) => {
//       console.error('Failed to create room:', data.error)
//       // TODO: Show error message to user
//     })
    
//     // Room joining events
//     socketService.on('room_joined', (data: RoomCreatedData) => {
//       const { room } = data
//       setCurrentRoom(room)
//       setIsHost(room.hostId === playerId)
      
//       // Initialize players map
//       const newPlayers = new Map<string, PlayerData>()
//       room.players.forEach(id => {
//         newPlayers.set(id, {
//           id,
//           name: id === playerId ? playerName : 'Opponent',
//           character: null,
//           isReady: false,
//           health: 0,
//           maxHealth: 0,
//           mana: 0,
//           maxMana: 0
//         })
//       })
//       setPlayers(newPlayers)
      
//       // Play sound effect
//       playSound('room-joined.mp3')
//     })
    
//     socketService.on('join_room_error', (data: RoomErrorData) => {
//       console.error('Failed to join room:', data.error)
//       // TODO: Show error message to user
//     })
    
//     // Player joined/left events
//     socketService.on('player_joined', (data: PlayerJoinedData) => {
//       const { player } = data
      
//       // Update players map
//       setPlayers(prev => {
//         const newPlayers = new Map(prev)
//         newPlayers.set(player.id, player)
//         return newPlayers
//       })
      
//       // Play sound effect
//       playSound('player-joined.mp3')
//     })
    
//     socketService.on('player_left', (data: PlayerLeftData) => {
//       const { playerId, playerName } = data
      
//       // Update players map
//       setPlayers(prev => {
//         const newPlayers = new Map(prev)
//         newPlayers.delete(playerId)
//         return newPlayers
//       })
      
//       // Add to battle log if game was in progress
//       if (gameStarted && !gameOver) {
//         setBattleLog(prev => [...prev, `${playerName} has left the game.`])
//       }
      
//       // Play sound effect
//       playSound('player-left.mp3')
//     })
    
//     // Room update events
//     socketService.on('room_updated', (data: RoomUpdatedData) => {
//       const { room } = data
//       setCurrentRoom(room)
//       setIsHost(room.hostId === playerId)
//     })
    
//     // Room listing events
//     socketService.on('room_available', (data: RoomData) => {
//       setAvailableRooms(prev => {
//         // Check if room is already in the list
//         const exists = prev.some(room => room.id === data.id)
//         if (exists) {
//           // Update existing room
//           return prev.map(room => room.id === data.id ? data : room)
//         }
//         // Add new room
//         return [...prev, data]
//       })
//     })
    
//     socketService.on('room_unavailable', (data: { roomId: string }) => {
//       setAvailableRooms(prev => prev.filter(room => room.id !== data.roomId))
//     })
    
//     // Character selection events
//     socketService.on('character_selected', (data: CharacterSelectedData) => {
//       const { playerId, playerName, character } = data
      
//       // Update player in players map
//       setPlayers(prev => {
//         const newPlayers = new Map(prev)
//         const player = newPlayers.get(playerId) || {
//           id: playerId,
//           name: playerName,
//           character: null,
//           isReady: false,
//           health: 0,
//           maxHealth: 0,
//           mana: 0,
//           maxMana: 0
//         }
        
//         newPlayers.set(playerId, {
//           ...player,
//           character,
//           health: character.health,
//           maxHealth: character.health,
//           mana: character.mana,
//           maxMana: character.mana
//         })
        
//         return newPlayers
//       })
      
//       // Play sound effect
//       playSound('character-select.mp3')
//     })
    
//     // Player ready events
//     socketService.on('player_ready_updated', (data: PlayerReadyUpdatedData) => {
//       const { playerId, playerName, isReady } = data
      
//       // Update player in players map
//       setPlayers(prev => {
//         const newPlayers = new Map(prev)
//         const player = newPlayers.get(playerId)
//         if (player) {
//           newPlayers.set(playerId, {
//             ...player,
//             isReady
//           })
//         }
//         return newPlayers
//       })
      
//       // Play sound effect
//       if (isReady) {
//         playSound('player-ready.mp3')
//       }
//     })
    
//     // Game events
//     socketService.on('game_countdown', (data: GameCountdownData) => {
//       setCountdown(data.countdown)
      
//       // Play countdown sound
//       playSound('countdown.mp3')
//     })
    
//     socketService.on('game_started', (data: GameStartedData) => {
//       const { room, gameData } = data
      
//       setCurrentRoom(room)
//       setTurnCount(gameData.turnCount)
//       setCurrentTurn(gameData.currentTurn)
//       setBattleLog(gameData.battleLog)
//       setGameStarted(true)
//       setGameOver(false)
//       setWinner(null)
//       setCountdown(null)
      
//       // Play game start sound
//       playSound('battle-start.mp3')
//     })
    
//     socketService.on('game_action_performed', (data: GameActionPerformedData) => {
//       const { 
//         action, 
//         result, 
//         gameData,
//       } = data
      
//       // Update turn info
//       setTurnCount(gameData.turnCount)
//       setCurrentTurn(gameData.currentTurn)
      
//       // Update battle log
//       setBattleLog(prev => [...prev, ...gameData.battleLog])
      
//       // Update players health and mana
//       setPlayers(prev => {
//         const newPlayers = new Map(prev)
        
//         // Update acting player
//         const actingPlayer = newPlayers.get(result.actingPlayerId)
//         if (actingPlayer) {
//           newPlayers.set(result.actingPlayerId, {
//             ...actingPlayer,
//             health: result.actingPlayerHealth,
//             mana: result.actingPlayerMana
//           })
//         }
        
//         // Update target player
//         const targetPlayer = newPlayers.get(result.targetPlayerId)
//         if (targetPlayer) {
//           newPlayers.set(result.targetPlayerId, {
//             ...targetPlayer,
//             health: result.targetPlayerHealth
//           })
//         }
        
//         return newPlayers
//       })
      
//       // Play appropriate sound effect
//       if (action.type === 'ability' && result.ability) {
//         // Play ability sound based on type
//         switch (result.ability.type) {
//           case 'time':
//             playSound('time-ability.mp3')
//             break
//           case 'fire':
//             playSound('fire-ability.mp3')
//             break
//           case 'lightning':
//             playSound('lightning-ability.mp3')
//             break
//           default:
//             playSound('ability.mp3')
//         }
//       } else if (action.type === 'surrender') {
//         playSound('surrender.mp3')
//       }
//     })
    
//     socketService.on('game_over', (data: GameOverData) => {
//       const { winnerId, winnerName, gameData } = data
      
//       setGameOver(true)
//       setWinner(winnerId)
//       setBattleLog(prev => [...prev, `${winnerName} wins the battle!`])
      
//       // Play victory or defeat sound
//       if (winnerId === playerId) {
//         playSound('victory.mp3')
//       } else {
//         playSound('defeat.mp3')
//       }
//     })
    
//     // Chat events
//     socketService.on('chat_message', (data: ChatMessageData) => {
//       const { playerName, message } = data
//       setBattleLog(prev => [...prev, `${playerName}: ${message}`])
      
//       // Play chat sound
//       playSound('chat-message.mp3')
//     })
//   }
  
//   // Connect to socket server
//   const connect = async () => {
//     try {
//       setIsConnecting(true)
//       setConnectionError(null)
      
//       // Connect to socket server
//       const id = await socketService.connect()
//       setPlayerId(id)
//       setIsConnected(true)
      
//       // Setup socket event listeners
//       setupSocketListeners()
      
//       // Fetch available rooms
//       const rooms = await socketService.getAvailableRooms()
//       setAvailableRooms(rooms || [])
      
//     } catch (error) {
//       console.error('Failed to connect to socket server:', error)
//       setConnectionError('Failed to connect to server. Please try again.')
//     } finally {
//       setIsConnecting(false)
//     }
//   }
  
//   // Disconnect from socket server
//   const disconnect = () => {
//     socketService.disconnect()
//     setIsConnected(false)
//     setPlayerId(null)
//     setCurrentRoom(null)
//     setAvailableRooms([])
//     setPlayers(new Map())
//     resetGameState()
//   }
  
//   // Reset game state
//   const resetGameState = () => {
//     setTurnCount(0)
//     setCurrentTurn(null)
//     setBattleLog([])
//     setGameStarted(false)
//     setGameOver(false)
//     setWinner(null)
//     setCountdown(null)
//   }
  
//   // Create a new room
//   const createRoom = (name: string, isPrivate: boolean = false) => {
//     if (!isConnected) {
//       connect().then(() => {
//         socketService.createRoom(name || playerName + "'s Room", isPrivate)
//       })
//     } else {
//       socketService.createRoom(name || playerName + "'s Room", isPrivate)
//     }
//   }
  
//   // Join a room
//   const joinRoom = (roomId: string) => {
//     if (!isConnected) {
//       connect().then(() => {
//         socketService.joinRoom(roomId)
//       })
//     } else {
//       socketService.joinRoom(roomId)
//     }
//   }
  
//   // Leave the current room
//   const leaveRoom = () => {
//     if (currentRoom && isConnected) {
//       socketService.leaveRoom(currentRoom.id)
//       setCurrentRoom(null)
//       setPlayers(new Map())
//       resetGameState()
//     }
//   }
  
//   // Select a character
//   const selectCharacter = (character: Character) => {
//     if (currentRoom && isConnected) {
//       socketService.selectCharacter(character)
//     }
//   }
  
//   // Set ready status
//   const setReady = (isReady: boolean) => {
//     if (currentRoom && isConnected) {
//       socketService.setPlayerReady(isReady)
//     }
//   }
  
//   // Perform a game action
//   const performGameAction = (action: GameAction) => {
//     if (currentRoom && isConnected && gameStarted && !gameOver) {
//       socketService.performGameAction(action)
//     }
//   }
  
//   // Send a chat message
//   const sendChatMessage = (message: string) => {
//     if (currentRoom && isConnected) {
//       socketService.sendChatMessage(currentRoom.id, message)
//     }
//   }
  
//   // Auto-connect to socket server on component mount
//   useEffect(() => {
//     // Try to connect if not already connected
//     if (!isConnected && !isConnecting) {
//       connect()
//     }
    
//     // Cleanup on unmount
//     return () => {
//       disconnect()
//     }
//   }, [])
  
//   // Compute if it's the current player's turn
//   const isPlayerTurn = currentTurn === playerId
  
//   return (
//     <MultiplayerContext.Provider
//       value={{
//         isConnected,
//         isConnecting,
//         connectionError,
//         isHost,
//         playerId,
//         playerName,
//         currentRoom,
//         availableRooms,
//         setPlayerName,
//         connect,
//         disconnect,
//         createRoom,
//         joinRoom,
//         leaveRoom,
//         selectCharacter,
//         setReady,
//         performGameAction,
//         sendChatMessage,
//         players,
//         gameState: {
//           turnCount,
//           currentTurn,
//           isPlayerTurn,
//           battleLog,
//           gameStarted,
//           gameOver,
//           winner,
//           countdown
//         }
//       }}
//     >
//       {children}
//     </MultiplayerContext.Provider>
//   )
// }







