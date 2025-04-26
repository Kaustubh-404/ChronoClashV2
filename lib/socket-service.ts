// lib/socket-service.ts
import { io, Socket } from 'socket.io-client';
import { type Character } from '@/components/game-state-provider';

// Types for socket events
export type SocketEvent = 
  | 'connect'
  | 'disconnect'
  | 'connection_success'
  | 'create_room'
  | 'room_created'
  | 'create_room_error'
  | 'join_room'
  | 'room_joined'
  | 'join_room_error'
  | 'leave_room'
  | 'room_left'
  | 'leave_room_error'
  | 'player_joined'
  | 'player_left'
  | 'room_updated'
  | 'room_available'
  | 'room_unavailable'
  | 'select_character'
  | 'character_selected'
  | 'character_select_error'
  | 'player_ready'
  | 'player_ready_updated'
  | 'player_ready_error'
  | 'game_countdown'
  | 'game_started'
  | 'game_action'
  | 'game_action_performed'
  | 'game_action_error'
  | 'game_over'
  | 'chat_message';

// Room data types
export interface RoomData {
  id: string;
  name: string;
  hostId: string;
  hostName?: string;
  hostCharacter?: Character;
  guestId: string | null;
  guestName?: string;
  guestCharacter?: Character;
  status: 'waiting' | 'ready' | 'in-progress' | 'completed';
  players: string[];
  maxPlayers: number;
  gameData: GameData;
  createdAt: number;
  lastActivity: number;
  isPrivate?: boolean;
}

export interface GameData {
  turnCount: number;
  currentTurn: string | null;
  battleLog: string[];
  startTime: number | null;
  endTime: number | null;
  winner: string | null;
}

export interface PlayerData {
  id: string;
  name: string;
  character: Character | null;
  isReady: boolean;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
}

export interface GameAction {
  type: 'ability' | 'surrender';
  abilityId?: string;
  targetId?: string;
}

/**
 * Socket service for handling multiplayer communication
 */
class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
  private playerId: string | null = null;
  private playerName: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private connectedListeners: Set<Function> = new Set();
  private disconnectedListeners: Set<Function> = new Set();
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  // Track active operations for debugging and error handling
  private activeOperations: {
    createRoom: boolean;
    joinRoom: boolean;
    leaveRoom: boolean;
    selectCharacter: boolean;
    setReady: boolean;
  } = {
    createRoom: false,
    joinRoom: false,
    leaveRoom: false,
    selectCharacter: false,
    setReady: false
  };
  
  /**
   * Initialize the socket connection
   */
  public connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Don't create a new connection if one exists
        if (this.socket?.connected) {
          console.log('Socket already connected with ID:', this.socket.id);
          if (this.socket.id) {
            this.playerId = this.socket.id;
            
            // Notify connected listeners
            this.connectedListeners.forEach(listener => {
              try {
                listener(this.playerId);
              } catch (err) {
                console.error('Error in connected listener:', err);
              }
            });
            
            return resolve(this.socket.id);
          }
        }
        
        console.log('Connecting to socket server at:', this.serverUrl);
        
        // Initialize socket connection
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 10000 // Increase timeout to 10 seconds
        });

        // Setup connection event handlers
        this.socket.on('connect', () => {
          console.log('Socket connected with ID:', this.socket?.id);
          this.reconnectAttempts = 0;
          if (this.socket?.id) {
            this.playerId = this.socket.id;
            
            // Notify connected listeners
            this.connectedListeners.forEach(listener => {
              try {
                listener(this.playerId);
              } catch (err) {
                console.error('Error in connected listener:', err);
              }
            });
          }
        });

        this.socket.on('connection_success', (data: { playerId: string, playerData?: { name?: string } }) => {
          console.log('Connection successful:', data);
          if (data.playerId) {
            this.playerId = data.playerId;
            this.playerName = data.playerData?.name || null;
            resolve(data.playerId);
          } else {
            reject(new Error('No player ID received from server'));
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.reconnectAttempts++;
          
          // Notify disconnected listeners
          this.disconnectedListeners.forEach(listener => {
            try {
              listener(error);
            } catch (err) {
              console.error('Error in disconnected listener:', err);
            }
          });
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          
          // Notify disconnected listeners
          this.disconnectedListeners.forEach(listener => {
            try {
              listener(reason);
            } catch (err) {
              console.error('Error in disconnected listener:', err);
            }
          });
          
          // If the server closed the connection, try to reconnect
          if (reason === 'io server disconnect' && this.socket) {
            this.socket.connect();
          }
        });
        
        // Set a connection timeout
        const timeout = setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new Error('Connection timeout'));
          }
          clearTimeout(timeout);
        }, 10000);

      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect the socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.playerId = null;
      
      // Clear all operation flags
      this.activeOperations = {
        createRoom: false,
        joinRoom: false,
        leaveRoom: false,
        selectCharacter: false,
        setReady: false
      };
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get player ID
   */
  public getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * Add connected event listener
   */
  public onConnected(callback: Function): void {
    this.connectedListeners.add(callback);
    
    // If already connected, call the callback immediately
    if (this.socket?.connected && this.playerId) {
      try {
        callback(this.playerId);
      } catch (err) {
        console.error('Error in connected listener:', err);
      }
    }
  }

  /**
   * Add disconnected event listener
   */
  public onDisconnected(callback: Function): void {
    this.disconnectedListeners.add(callback);
  }

  /**
   * Add event listener with proper error handling
   */
  public on(event: SocketEvent, callback: Function): void {
    if (!this.socket) {
      console.warn(`Socket not connected. Can't add listener for ${event}`);
      
      // Store the event listener for when we connect
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set());
      }
      
      this.eventListeners.get(event)?.add(callback);
      return;
    }
    
    // Store the event listener
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)?.add(callback);
    
    // Add socket listener with properly typed rest parameters
    this.socket.on(event, (...args: unknown[]) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error);
      }
    });
  }

  /**
   * Remove event listener
   */
  public off(event: SocketEvent, callback?: Function): void {
    // Remove from stored listeners
    if (this.eventListeners.has(event)) {
      if (callback) {
        this.eventListeners.get(event)?.delete(callback);
      } else {
        this.eventListeners.delete(event);
      }
    }
    
    // Remove from socket if connected
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as any);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Create a new room with improved error handling
   */
  public createRoom(name: string = '', isPrivate: boolean = false): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot create room.');
      this.emitCustomEvent('create_room_error', { error: 'Not connected to server' });
      return;
    }
    
    const roomName = name.trim() || `${this.playerName || 'Player'}'s Room`;
    
    // Prevent multiple simultaneous room creation attempts
    if (this.activeOperations.createRoom) {
      console.warn('Room creation already in progress');
      return;
    }
    
    this.activeOperations.createRoom = true;
    
    // Create room with timeout handling
    this.socket.emit('create_room', { name: roomName, isPrivate });
    
    // Set timeout to clear operation flag after reasonable time
    setTimeout(() => {
      if (this.activeOperations.createRoom) {
        console.warn('Room creation timeout - clearing operation flag');
        this.activeOperations.createRoom = false;
      }
    }, 15000);
  }

  /**
   * Join a room with validation and improved error handling
   */
  public joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot join room.');
      this.emitCustomEvent('join_room_error', { error: 'Not connected to server' });
      return;
    }
    
    if (!roomId?.trim()) {
      this.emitCustomEvent('join_room_error', { error: 'Room ID is required' });
      return;
    }
    
    // Prevent multiple simultaneous join attempts
    if (this.activeOperations.joinRoom) {
      console.warn('Room join already in progress');
      return;
    }
    
    this.activeOperations.joinRoom = true;
    
    // Join room
    this.socket.emit('join_room', { roomId: roomId.trim() });
    
    // Set timeout to clear operation flag after reasonable time
    setTimeout(() => {
      if (this.activeOperations.joinRoom) {
        console.warn('Room join timeout - clearing operation flag');
        this.activeOperations.joinRoom = false;
      }
    }, 15000);
  }

  /**
   * Leave the current room
   */
  public leaveRoom(roomId: string): void {
    if (!this.socket?.connected || !roomId) {
      console.error('Socket not connected or invalid room ID. Cannot leave room.');
      return;
    }
    
    // Prevent multiple simultaneous leave operations
    if (this.activeOperations.leaveRoom) {
      console.warn('Room leave already in progress');
      return;
    }
    
    this.activeOperations.leaveRoom = true;
    
    // Leave room
    this.socket.emit('leave_room', { roomId });
    
    // Set timeout to clear operation flag after reasonable time
    setTimeout(() => {
      if (this.activeOperations.leaveRoom) {
        console.warn('Room leave timeout - clearing operation flag');
        this.activeOperations.leaveRoom = false;
      }
    }, 5000);
  }

  /**
   * Select a character with validation
   */
  public selectCharacter(character: Character): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot select character.');
      return;
    }
    
    if (!character) {
      console.error('Invalid character data.');
      return;
    }
    
    // Prevent multiple simultaneous character selections
    if (this.activeOperations.selectCharacter) {
      console.warn('Character selection already in progress');
      return;
    }
    
    this.activeOperations.selectCharacter = true;
    
    // Select character
    this.socket.emit('select_character', { character });
    
    // Set timeout to clear operation flag after reasonable time
    setTimeout(() => {
      if (this.activeOperations.selectCharacter) {
        console.warn('Character selection timeout - clearing operation flag');
        this.activeOperations.selectCharacter = false;
      }
    }, 5000);
  }

  /**
   * Set player ready status
   */
  public setPlayerReady(isReady: boolean = true): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot set ready status.');
      return;
    }
    
    // Prevent multiple simultaneous ready status changes
    if (this.activeOperations.setReady) {
      console.warn('Ready status change already in progress');
      return;
    }
    
    this.activeOperations.setReady = true;
    
    // Set ready status
    this.socket.emit('player_ready', { isReady });
    
    // Set timeout to clear operation flag after reasonable time
    setTimeout(() => {
      if (this.activeOperations.setReady) {
        console.warn('Ready status change timeout - clearing operation flag');
        this.activeOperations.setReady = false;
      }
    }, 5000);
  }

  /**
   * Perform a game action
   */
  public performGameAction(action: GameAction): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot perform game action.');
      return;
    }
    
    this.socket.emit('game_action', action);
  }

  /**
   * Send a chat message
   */
  public sendChatMessage(roomId: string, message: string): void {
    if (!this.socket?.connected || !roomId || !message.trim()) {
      console.error('Socket not connected or invalid message/room. Cannot send chat message.');
      return;
    }
    
    this.socket.emit('chat_message', { roomId, message: message.trim() });
  }

  /**
   * Get available rooms with error handling
   */
  public async getAvailableRooms(): Promise<RoomData[]> {
    try {
      // Make a regular HTTP request to the API endpoint
      const response = await fetch(`${this.serverUrl}/api/rooms`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.rooms || [];
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      return [];
    }
  }
  
  /**
   * Helper method to emit custom events for testing/debugging
   */
  private emitCustomEvent(eventName: string, data: any): void {
    // Create and dispatch a custom event
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
    
    // Also log for debugging
    console.log(`Emitted custom event: ${eventName}`, data);
  }
  
  /**
   * Reset active operations (useful for cleaning up)
   */
  public resetActiveOperations(): void {
    this.activeOperations = {
      createRoom: false,
      joinRoom: false,
      leaveRoom: false,
      selectCharacter: false,
      setReady: false
    };
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;



