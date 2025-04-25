"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Character } from "./game-state-provider"
import { 
  socketService, 
  type RoomData, 
  type GameData, 
  type GameAction,
  type PlayerData as SocketPlayerData,
  type SocketEvent
} from "@/lib/socket-service"
import { playSound } from "@/lib/sound-utils"

// Define interfaces for event data
interface RoomCreatedData {
  room: RoomData;
}

interface RoomErrorData {
  error: string;
}

interface PlayerData {
  id: string;
  name: string;
  character: Character | null;
  isReady: boolean;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
}

interface PlayerJoinedData {
  player: PlayerData;
}

interface PlayerLeftData {
  playerId: string;
  playerName: string;
}

interface RoomUpdatedData {
  room: RoomData;
}

interface CharacterSelectedData {
  playerId: string;
  playerName: string;
  character: Character;
}

interface PlayerReadyUpdatedData {
  playerId: string;
  playerName: string;
  isReady: boolean;
}

interface GameCountdownData {
  countdown: number;
}

interface GameStartedData {
  room: RoomData;
  gameData: GameData;
}

interface AbilityResult {
  actingPlayerId: string;
  actingPlayerHealth: number;
  actingPlayerMana: number;
  targetPlayerId: string;
  targetPlayerHealth: number;
  ability?: {
    id?: string;
    name?: string;
    type: 'time' | 'fire' | 'lightning' | string;
  };
  damage?: number;
  surrender?: boolean;
}

interface GameActionPerformedData {
  playerId: string;
  action: GameAction;
  result: AbilityResult;
  gameData: GameData;
}

interface GameOverData {
  winnerId: string;
  winnerName: string;
  gameData: GameData;
}

interface ChatMessageData {
  playerId: string;
  playerName: string;
  message: string;
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
  createRoom: (name: string, isPrivate?: boolean) => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  selectCharacter: (character: Character) => void
  setReady: (isReady: boolean) => void
  performGameAction: (action: GameAction) => void
  sendChatMessage: (message: string) => void
  players: Map<string, PlayerData>
  gameState: {
    turnCount: number
    currentTurn: string | null
    isPlayerTurn: boolean
    battleLog: string[]
    gameStarted: boolean
    gameOver: boolean
    winner: string | null
    countdown: number | null
  }
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
  
  // Game state
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map())
  const [turnCount, setTurnCount] = useState<number>(0)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  
  // Save player name to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("chronoClash_playerName", playerName)
    }
  }, [playerName])
  
  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Room creation events
    socketService.on('room_created', (data: RoomCreatedData) => {
      const { room } = data
      setCurrentRoom(room)
      setIsHost(true)
      // Add ourselves to players map
      const player = {
        id: playerId as string,
        name: playerName,
        character: null,
        isReady: false,
        health: 0,
        maxHealth: 0,
        mana: 0,
        maxMana: 0
      }
      setPlayers(new Map([[playerId as string, player]]))
      
      // Play sound effect
      playSound('room-created.mp3')
    })
    
    socketService.on('create_room_error', (data: RoomErrorData) => {
      console.error('Failed to create room:', data.error)
      // TODO: Show error message to user
    })
    
    // Room joining events
    socketService.on('room_joined', (data: RoomCreatedData) => {
      const { room } = data
      setCurrentRoom(room)
      setIsHost(room.hostId === playerId)
      
      // Initialize players map
      const newPlayers = new Map<string, PlayerData>()
      room.players.forEach(id => {
        newPlayers.set(id, {
          id,
          name: id === playerId ? playerName : 'Opponent',
          character: null,
          isReady: false,
          health: 0,
          maxHealth: 0,
          mana: 0,
          maxMana: 0
        })
      })
      setPlayers(newPlayers)
      
      // Play sound effect
      playSound('room-joined.mp3')
    })
    
    socketService.on('join_room_error', (data: RoomErrorData) => {
      console.error('Failed to join room:', data.error)
      // TODO: Show error message to user
    })
    
    // Player joined/left events
    socketService.on('player_joined', (data: PlayerJoinedData) => {
      const { player } = data
      
      // Update players map
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        newPlayers.set(player.id, player)
        return newPlayers
      })
      
      // Play sound effect
      playSound('player-joined.mp3')
    })
    
    socketService.on('player_left', (data: PlayerLeftData) => {
      const { playerId, playerName } = data
      
      // Update players map
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        newPlayers.delete(playerId)
        return newPlayers
      })
      
      // Add to battle log if game was in progress
      if (gameStarted && !gameOver) {
        setBattleLog(prev => [...prev, `${playerName} has left the game.`])
      }
      
      // Play sound effect
      playSound('player-left.mp3')
    })
    
    // Room update events
    socketService.on('room_updated', (data: RoomUpdatedData) => {
      const { room } = data
      setCurrentRoom(room)
      setIsHost(room.hostId === playerId)
    })
    
    // Room listing events
    socketService.on('room_available', (data: RoomData) => {
      setAvailableRooms(prev => {
        // Check if room is already in the list
        const exists = prev.some(room => room.id === data.id)
        if (exists) {
          // Update existing room
          return prev.map(room => room.id === data.id ? data : room)
        }
        // Add new room
        return [...prev, data]
      })
    })
    
    socketService.on('room_unavailable', (data: { roomId: string }) => {
      setAvailableRooms(prev => prev.filter(room => room.id !== data.roomId))
    })
    
    // Character selection events
    socketService.on('character_selected', (data: CharacterSelectedData) => {
      const { playerId, playerName, character } = data
      
      // Update player in players map
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        const player = newPlayers.get(playerId) || {
          id: playerId,
          name: playerName,
          character: null,
          isReady: false,
          health: 0,
          maxHealth: 0,
          mana: 0,
          maxMana: 0
        }
        
        newPlayers.set(playerId, {
          ...player,
          character,
          health: character.health,
          maxHealth: character.health,
          mana: character.mana,
          maxMana: character.mana
        })
        
        return newPlayers
      })
      
      // Play sound effect
      playSound('character-select.mp3')
    })
    
    // Player ready events
    socketService.on('player_ready_updated', (data: PlayerReadyUpdatedData) => {
      const { playerId, playerName, isReady } = data
      
      // Update player in players map
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        const player = newPlayers.get(playerId)
        if (player) {
          newPlayers.set(playerId, {
            ...player,
            isReady
          })
        }
        return newPlayers
      })
      
      // Play sound effect
      if (isReady) {
        playSound('player-ready.mp3')
      }
    })
    
    // Game events
    socketService.on('game_countdown', (data: GameCountdownData) => {
      setCountdown(data.countdown)
      
      // Play countdown sound
      playSound('countdown.mp3')
    })
    
    socketService.on('game_started', (data: GameStartedData) => {
      const { room, gameData } = data
      
      setCurrentRoom(room)
      setTurnCount(gameData.turnCount)
      setCurrentTurn(gameData.currentTurn)
      setBattleLog(gameData.battleLog)
      setGameStarted(true)
      setGameOver(false)
      setWinner(null)
      setCountdown(null)
      
      // Play game start sound
      playSound('battle-start.mp3')
    })
    
    socketService.on('game_action_performed', (data: GameActionPerformedData) => {
      const { 
        action, 
        result, 
        gameData,
      } = data
      
      // Update turn info
      setTurnCount(gameData.turnCount)
      setCurrentTurn(gameData.currentTurn)
      
      // Update battle log
      setBattleLog(prev => [...prev, ...gameData.battleLog])
      
      // Update players health and mana
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        
        // Update acting player
        const actingPlayer = newPlayers.get(result.actingPlayerId)
        if (actingPlayer) {
          newPlayers.set(result.actingPlayerId, {
            ...actingPlayer,
            health: result.actingPlayerHealth,
            mana: result.actingPlayerMana
          })
        }
        
        // Update target player
        const targetPlayer = newPlayers.get(result.targetPlayerId)
        if (targetPlayer) {
          newPlayers.set(result.targetPlayerId, {
            ...targetPlayer,
            health: result.targetPlayerHealth
          })
        }
        
        return newPlayers
      })
      
      // Play appropriate sound effect
      if (action.type === 'ability' && result.ability) {
        // Play ability sound based on type
        switch (result.ability.type) {
          case 'time':
            playSound('time-ability.mp3')
            break
          case 'fire':
            playSound('fire-ability.mp3')
            break
          case 'lightning':
            playSound('lightning-ability.mp3')
            break
          default:
            playSound('ability.mp3')
        }
      } else if (action.type === 'surrender') {
        playSound('surrender.mp3')
      }
    })
    
    socketService.on('game_over', (data: GameOverData) => {
      const { winnerId, winnerName, gameData } = data
      
      setGameOver(true)
      setWinner(winnerId)
      setBattleLog(prev => [...prev, `${winnerName} wins the battle!`])
      
      // Play victory or defeat sound
      if (winnerId === playerId) {
        playSound('victory.mp3')
      } else {
        playSound('defeat.mp3')
      }
    })
    
    // Chat events
    socketService.on('chat_message', (data: ChatMessageData) => {
      const { playerName, message } = data
      setBattleLog(prev => [...prev, `${playerName}: ${message}`])
      
      // Play chat sound
      playSound('chat-message.mp3')
    })
  }
  
  // Connect to socket server
  const connect = async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
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
    setPlayers(new Map())
    resetGameState()
  }
  
  // Reset game state
  const resetGameState = () => {
    setTurnCount(0)
    setCurrentTurn(null)
    setBattleLog([])
    setGameStarted(false)
    setGameOver(false)
    setWinner(null)
    setCountdown(null)
  }
  
  // Create a new room
  const createRoom = (name: string, isPrivate: boolean = false) => {
    if (!isConnected) {
      connect().then(() => {
        socketService.createRoom(name || playerName + "'s Room", isPrivate)
      })
    } else {
      socketService.createRoom(name || playerName + "'s Room", isPrivate)
    }
  }
  
  // Join a room
  const joinRoom = (roomId: string) => {
    if (!isConnected) {
      connect().then(() => {
        socketService.joinRoom(roomId)
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
      setPlayers(new Map())
      resetGameState()
    }
  }
  
  // Select a character
  const selectCharacter = (character: Character) => {
    if (currentRoom && isConnected) {
      socketService.selectCharacter(character)
    }
  }
  
  // Set ready status
  const setReady = (isReady: boolean) => {
    if (currentRoom && isConnected) {
      socketService.setPlayerReady(isReady)
    }
  }
  
  // Perform a game action
  const performGameAction = (action: GameAction) => {
    if (currentRoom && isConnected && gameStarted && !gameOver) {
      socketService.performGameAction(action)
    }
  }
  
  // Send a chat message
  const sendChatMessage = (message: string) => {
    if (currentRoom && isConnected) {
      socketService.sendChatMessage(currentRoom.id, message)
    }
  }
  
  // Auto-connect to socket server on component mount
  useEffect(() => {
    // Try to connect if not already connected
    if (!isConnected && !isConnecting) {
      connect()
    }
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [])
  
  // Compute if it's the current player's turn
  const isPlayerTurn = currentTurn === playerId
  
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
        performGameAction,
        sendChatMessage,
        players,
        gameState: {
          turnCount,
          currentTurn,
          isPlayerTurn,
          battleLog,
          gameStarted,
          gameOver,
          winner,
          countdown
        }
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}







