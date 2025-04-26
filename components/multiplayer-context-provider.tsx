"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { type Character } from "./game-state-provider"
import { socketService, type RoomData } from "@/lib/socket-service"
import { playSound } from "@/lib/sound-utils"

// Define specific event data types
interface PlayerUpdateData {
  playerId: string;
  playerName: string;
  character?: Character;
  isReady?: boolean;
}

type MultiplayerContextType = {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  isHost: boolean
  playerId: string
  playerName: string
  currentRoom: RoomData | null
  availableRooms: RoomData[]
  setPlayerName: (name: string) => void
  connect: () => Promise<void>
  disconnect: () => void
  createRoom: (name?: string, isPrivate?: boolean) => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  selectCharacter: (character: Character) => void
  setReady: (isReady?: boolean) => void
  updateOpponentHealth: (health: number) => void
  endBattle: (winnerId: string) => void
  startBattle: () => void
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
  const [playerId, setPlayerId] = useState<string>("")
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
  const setupSocketListeners = useCallback(() => {
    // Clear any existing listeners to avoid duplicates
    socketService.off('room_created');
    socketService.off('create_room_error');
    socketService.off('room_joined');
    socketService.off('join_room_error');
    socketService.off('player_joined');
    socketService.off('player_left');
    socketService.off('room_updated');
    socketService.off('room_available');
    socketService.off('room_unavailable');
    socketService.off('character_selected');
    socketService.off('player_ready_updated');
    socketService.off('game_countdown');
    socketService.off('game_started');
    socketService.off('game_action_performed');
    socketService.off('game_over');
    
    // Room creation events
    socketService.on('room_created', (data: any) => {
      console.log("Room created event received:", data);
      const room = data.room;
      
      if (!room) {
        console.error("Received room_created event with no room data");
        // Dispatch error event
        const errorEvent = new CustomEvent('create_room_error', { 
          detail: { error: "Invalid room data received from server" } 
        });
        window.dispatchEvent(errorEvent);
        return;
      }
      
      // Process and store the room data
      setCurrentRoom(room);
      setIsHost(true);
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('room_created', { detail: data });
      window.dispatchEvent(event);
      
      // Play sound effect
      playSound('room-created.mp3');
    });
    
    socketService.on('create_room_error', (data: any) => {
      console.error('Failed to create room:', data.error);
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('create_room_error', { detail: data });
      window.dispatchEvent(event);
    });
    
    // Room joining events
    socketService.on('room_joined', (data: any) => {
      console.log("Room joined event received:", data);
      const room = data.room;
      
      if (!room) {
        console.error("Received room_joined event with no room data");
        // Dispatch error event
        const errorEvent = new CustomEvent('join_room_error', { 
          detail: { error: "Invalid room data received from server" } 
        });
        window.dispatchEvent(errorEvent);
        return;
      }
      
      // Process and store the room data
      setCurrentRoom(room);
      setIsHost(room.hostId === playerId);
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('room_joined', { detail: data });
      window.dispatchEvent(event);
      
      // Play sound effect
      playSound('room-joined.mp3');
    });
    
    socketService.on('join_room_error', (data: any) => {
      console.error('Failed to join room:', data.error);
      
      // Dispatch custom event for components to handle
      const event = new CustomEvent('join_room_error', { detail: data });
      window.dispatchEvent(event);
    });
    
    // Player events
    socketService.on('player_joined', (data: PlayerUpdateData) => {
      console.log('Player joined:', data);
      
      // Update current room if we're in it
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        // Add player to the room's players list if not already there
        const updatedPlayers = prev.players.includes(data.playerId)
          ? prev.players
          : [...prev.players, data.playerId];
        
        // Update guest info if this is a new guest
        let updatedGuestId = prev.guestId;
        let updatedGuestName = prev.guestName;
        
        if (!prev.guestId && data.playerId !== prev.hostId) {
          updatedGuestId = data.playerId;
          updatedGuestName = data.playerName;
        }
        
        return {
          ...prev,
          players: updatedPlayers,
          guestId: updatedGuestId,
          guestName: updatedGuestName
        };
      });
      
      // Play sound effect
      playSound('player-joined.mp3');
    });
    
    socketService.on('player_left', (data: PlayerUpdateData) => {
      console.log('Player left:', data);
      
      // Update current room if we're in it
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        // Remove player from the room's players list
        const updatedPlayers = prev.players.filter(id => id !== data.playerId);
        
        // Clear guest info if the guest left
        let updatedGuestId = prev.guestId;
        let updatedGuestName = prev.guestName;
        let updatedGuestCharacter = prev.guestCharacter;
        
        if (prev.guestId === data.playerId) {
          updatedGuestId = null;
          updatedGuestName = undefined;
          updatedGuestCharacter = undefined;
        }
        
        // If we're the only one left, become the host
        let updatedHostId = prev.hostId;
        let updatedHostName = prev.hostName;
        let updatedHostCharacter = prev.hostCharacter;
        
        if (prev.hostId === data.playerId && updatedPlayers.length > 0) {
          updatedHostId = updatedPlayers[0];
          updatedHostName = updatedPlayers[0] === playerId ? playerName : "Opponent";
          updatedHostCharacter = updatedPlayers[0] === playerId ? prev.guestCharacter : prev.hostCharacter;
          
          // If we became host, we're no longer guest
          if (updatedPlayers[0] === playerId) {
            updatedGuestId = null;
            updatedGuestName = undefined;
            updatedGuestCharacter = undefined;
            setIsHost(true);
          }
        }
        
        return {
          ...prev,
          players: updatedPlayers,
          hostId: updatedHostId,
          hostName: updatedHostName,
          hostCharacter: updatedHostCharacter,
          guestId: updatedGuestId,
          guestName: updatedGuestName,
          guestCharacter: updatedGuestCharacter
        };
      });
      
      // Play sound effect
      playSound('player-left.mp3');
    });
    
    // Room updates
    socketService.on('room_updated', (data: any) => {
      console.log('Room updated:', data);
      
      if (!data.room) {
        console.error("Received room_updated event with no room data");
        return;
      }
      
      // Update current room if it's our room
      if (currentRoom && data.room.id === currentRoom.id) {
        setCurrentRoom(data.room);
      }
    });
    
    // Available rooms updates
    socketService.on('room_available', (data: RoomData) => {
      console.log('Room available:', data);
      
      setAvailableRooms(prev => {
        // Check if room is already in the list
        const roomIndex = prev.findIndex(room => room.id === data.id);
        
        if (roomIndex >= 0) {
          // Update existing room
          const updatedRooms = [...prev];
          updatedRooms[roomIndex] = data;
          return updatedRooms;
        } else {
          // Add new room
          return [...prev, data];
        }
      });
    });
    
    socketService.on('room_unavailable', (data: { roomId: string }) => {
      console.log('Room unavailable:', data);
      
      setAvailableRooms(prev => 
        prev.filter(room => room.id !== data.roomId)
      );
    });
    
    // Character selection
    socketService.on('character_selected', (data: PlayerUpdateData) => {
      console.log('Character selected:', data);
      
      if (!data.character) {
        console.error("Received character_selected event with no character data");
        return;
      }
      
      // Update current room with character info
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        if (data.playerId === prev.hostId) {
          return { ...prev, hostCharacter: data.character };
        } else if (data.playerId === prev.guestId) {
          return { ...prev, guestCharacter: data.character };
        }
        
        return prev;
      });
      
      // Play sound effect
      playSound('character-select.mp3');
    });
    
    // Player ready status
    socketService.on('player_ready_updated', (data: PlayerUpdateData) => {
      console.log('Player ready updated:', data);
      
      // Play sound effect if player is ready
      if (data.isReady) {
        playSound('player-ready.mp3');
      }
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('player_ready_updated', { detail: data });
      window.dispatchEvent(event);
    });
    
    // Game events
    socketService.on('game_countdown', (data: { countdown: number }) => {
      console.log('Game countdown:', data);
      
      // Play countdown sound
      playSound('countdown.mp3');
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('game_countdown', { detail: data });
      window.dispatchEvent(event);
    });
    
    socketService.on('game_started', (data: { room: RoomData, gameData: any }) => {
      console.log('Game started:', data);
      
      // Update current room with game data
      if (currentRoom && data.room.id === currentRoom.id) {
        setCurrentRoom(data.room);
      }
      
      // Play game start sound
      playSound('battle-start.mp3');
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('game_started', { detail: data });
      window.dispatchEvent(event);
    });
    
    socketService.on('game_action_performed', (data: any) => {
      console.log('Game action performed:', data);
      
      // Update current room with latest game state
      if (currentRoom && data.gameData) {
        setCurrentRoom(prev => {
          if (!prev) return null;
          
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
          };
        });
      }
      
      // Play appropriate ability sound based on the action
      if (data.action?.type === 'ability' && data.result?.ability?.type) {
        const abilityType = data.result.ability.type;
        let soundFile = 'ability.mp3';
        
        switch (abilityType) {
          case 'time':
            soundFile = 'time-ability.mp3';
            break;
          case 'fire':
            soundFile = 'fire-ability.mp3';
            break;
          case 'lightning':
            soundFile = 'lightning-ability.mp3';
            break;
        }
        
        playSound(soundFile);
      }
      
      // Dispatch custom event for other components to handle
      const event = new CustomEvent('game_action_performed', { detail: data });
      window.dispatchEvent(event);
    });
    
    socketService.on('game_over', (data: { winnerId: string, winnerName: string }) => {
      console.log('Game over:', data);
      
      // Update current room with game over state
      setCurrentRoom(prev => {
        if (!prev) return null;
        
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
        };
      });
      
      // Play victory or defeat sound
      if (data.winnerId === playerId) {
        playSound('victory.mp3');
      } else {
        playSound('defeat.mp3');
      }
    });
  }, [currentRoom, playerName, playerId]);
  
  // Connect to socket server
  const connect = useCallback(async () => {
    try {
      // Don't try to connect if already connecting
      if (isConnecting) {
        console.log('Already attempting to connect, skipping duplicate call');
        return;
      }
      
      setIsConnecting(true);
      setConnectionError(null);
      
      if (socketService.isConnected()) {
        console.log('Already connected to socket server');
        setIsConnected(true);
        const connectedId = socketService.getPlayerId();
        if (connectedId) {
          setPlayerId(connectedId);
        }
        
        // Get available rooms
        const rooms = await socketService.getAvailableRooms();
        setAvailableRooms(rooms || []);
        
        setupSocketListeners();
        setIsConnecting(false);
        return;
      }
      
      console.log('Connecting to socket server...');
      
      // Connect to socket server
      const id = await socketService.connect();
      console.log(`Connected with ID: ${id}`);
      setPlayerId(id);
      setIsConnected(true);
      
      // Setup socket event listeners
      setupSocketListeners();
      
      // Fetch available rooms
      const rooms = await socketService.getAvailableRooms();
      setAvailableRooms(rooms || []);
      
    } catch (error: any) {
      console.error('Failed to connect to socket server:', error);
      setConnectionError(error.message || 'Failed to connect to server. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, setupSocketListeners]);
  
  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setPlayerId("");
    setCurrentRoom(null);
    setAvailableRooms([]);
  }, []);
  
  // Create a new room
  const createRoom = useCallback((name?: string, isPrivate: boolean = false): void => {
    if (!isConnected) {
      connect().then(() => {
        console.log(`Connected, now creating room with name: ${name}`);
        socketService.createRoom(name, isPrivate);
      }).catch(error => {
        console.error("Failed to connect before creating room:", error);
        const errorEvent = new CustomEvent('create_room_error', { 
          detail: { error: "Failed to connect to server. Please try again." } 
        });
        window.dispatchEvent(errorEvent);
      });
      return;
    }
    
    // Call the socket service to create the room
    socketService.createRoom(name, isPrivate);
  }, [isConnected, connect]);
  
  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    if (!isConnected) {
      connect().then(() => {
        console.log(`Connected, now joining room with ID: ${roomId}`);
        socketService.joinRoom(roomId);
      }).catch(error => {
        console.error("Failed to connect before joining room:", error);
        const errorEvent = new CustomEvent('join_room_error', { 
          detail: { error: "Failed to connect to multiplayer service" } 
        });
        window.dispatchEvent(errorEvent);
      });
    } else {
      socketService.joinRoom(roomId);
    }
  }, [isConnected, connect]);
  
  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (currentRoom && isConnected) {
      socketService.leaveRoom(currentRoom.id);
      setCurrentRoom(null);
      setIsHost(false);
    }
  }, [currentRoom, isConnected]);
  
  // Select a character
  const selectCharacter = useCallback((character: Character) => {
    if (currentRoom && isConnected) {
      socketService.selectCharacter(character);
      
      // Update local state immediately for better UX
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        if (isHost) {
          return { ...prev, hostCharacter: character };
        } else {
          return { ...prev, guestCharacter: character };
        }
      });
    }
  }, [currentRoom, isConnected, isHost]);
  
  // Set ready status
  const setReady = useCallback((isReady: boolean = true) => {
    if (currentRoom && isConnected) {
      socketService.setPlayerReady(isReady);
    }
  }, [currentRoom, isConnected]);
  
  // Start battle - only host can do this
  const startBattle = useCallback(() => {
    if (currentRoom && isConnected && isHost) {
      // In a real implementation, this would be a server-side check
      // For now we'll simulate it by setting everyone to ready
      socketService.setPlayerReady(true);
    }
  }, [currentRoom, isConnected, isHost]);
  
  // Update opponent health (for multiplayer battles)
  const updateOpponentHealth = useCallback((health: number) => {
    if (!currentRoom || !isConnected) return;
    
    // Get the target player ID (opponent)
    const targetPlayerId = isHost ? 
      (currentRoom.guestId || "") : 
      (currentRoom.hostId || "");
    
    // Only proceed if we have a valid target
    if (!targetPlayerId) {
      console.error("No valid target player found for health update");
      return;
    }
    
    // In a real implementation, this would send a game action to the server
    // For now, we'll just simulate it locally
    socketService.performGameAction({
      type: 'ability',
      abilityId: 'damage', // Generic damage ability
      targetId: targetPlayerId
    });
  }, [currentRoom, isConnected, isHost]);
  
  // End battle
  const endBattle = useCallback((winnerId: string) => {
    if (!currentRoom || !isConnected) return;
    
    // In a real implementation, this would be handled by the server
    // For now, we'll just simulate it locally by doing a surrender action
    socketService.performGameAction({
      type: 'surrender'
    });
  }, [currentRoom, isConnected]);
  
  // Auto-connect to socket server on component mount
  useEffect(() => {
    // Try to connect if not already connected
    if (!isConnected && !isConnecting) {
      connect().catch(err => {
        console.error("Failed to auto-connect:", err);
      });
    }
    
    // Setup effect cleanup
    return () => {
      // We don't want to fully disconnect on component unmount
      // as it might be used in other parts of the app
      // Just clean up listeners
      socketService.off('room_created');
      socketService.off('create_room_error');
      socketService.off('room_joined');
      socketService.off('join_room_error');
      socketService.off('player_joined');
      socketService.off('player_left');
      socketService.off('room_updated');
      socketService.off('room_available');
      socketService.off('room_unavailable');
      socketService.off('character_selected');
      socketService.off('player_ready_updated');
      socketService.off('game_countdown');
      socketService.off('game_started');
      socketService.off('game_action_performed');
      socketService.off('game_over');
    };
  }, [isConnected, isConnecting, connect]);
  
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
        endBattle,
        startBattle
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}












