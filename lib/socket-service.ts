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
  private roomCache: Map<string, RoomData> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
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
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          
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
      this.roomCache.clear();
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
   * Add event listener with proper error handling
   */
  public on(event: SocketEvent, callback: Function): void {
    if (!this.socket) {
      console.warn(`Socket not connected. Can't add listener for ${event}`);
      return;
    }
    
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
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Create a new room with validated parameters
   */
  public createRoom(name: string = '', isPrivate: boolean = false): string {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot create room.');
      this.emitCustomEvent('create_room_error', { error: 'Not connected to server' });
      // Return a temporary room ID
      return this.generateTempRoomId();
    }
    
    const roomName = name.trim() || `${this.playerName || 'Player'}'s Room`;
    this.socket.emit('create_room', { name: roomName, isPrivate });
    
    // Return a temporary room ID
    return this.generateTempRoomId();
  }

  /**
   * Generate a temporary room ID for UI purposes
   */
  private generateTempRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Join a room with validation
   */
  public joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot join room.');
      this.emitCustomEvent('join_room_error', { error: 'Not connected to server' });
      return;
    }
    
    if (!roomId.trim()) {
      this.emitCustomEvent('join_room_error', { error: 'Room ID is required' });
      return;
    }
    
    this.socket.emit('join_room', { roomId: roomId.trim() });
  }

  /**
   * Leave the current room
   */
  public leaveRoom(roomId: string): void {
    if (!this.socket?.connected || !roomId) {
      console.error('Socket not connected or invalid room ID. Cannot leave room.');
      return;
    }
    
    this.socket.emit('leave_room', { roomId });
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
    
    this.socket.emit('select_character', { character });
  }

  /**
   * Set player ready status
   */
  public setPlayerReady(isReady: boolean = true): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot set ready status.');
      return;
    }
    
    this.socket.emit('player_ready', { isReady });
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
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;







// // lib/socket-service.ts
// import { io, Socket } from 'socket.io-client';
// import { type Character } from '@/components/game-state-provider';

// // Types for socket events
// export type SocketEvent = 
//   | 'connect'
//   | 'disconnect'
//   | 'connection_success'
//   | 'create_room'
//   | 'room_created'
//   | 'create_room_error'
//   | 'join_room'
//   | 'room_joined'
//   | 'join_room_error'
//   | 'leave_room'
//   | 'room_left'
//   | 'leave_room_error'
//   | 'player_joined'
//   | 'player_left'
//   | 'room_updated'
//   | 'room_available'
//   | 'room_unavailable'
//   | 'select_character'
//   | 'character_selected'
//   | 'character_select_error'
//   | 'player_ready'
//   | 'player_ready_updated'
//   | 'player_ready_error'
//   | 'game_countdown'
//   | 'game_started'
//   | 'game_action'
//   | 'game_action_performed'
//   | 'game_action_error'
//   | 'game_over'
//   | 'chat_message';

// // Room data types
// export interface RoomData {
//   id: string;
//   name: string;
//   hostId: string;
//   hostName?: string;
//   hostCharacter?: Character;
//   guestId: string | null;
//   guestName?: string;
//   guestCharacter?: Character;
//   status: 'waiting' | 'ready' | 'in-progress' | 'completed';
//   players: string[];
//   maxPlayers: number;
//   gameData: GameData;
//   createdAt: number;
//   lastActivity: number;
//   isPrivate?: boolean;
// }

// export interface GameData {
//   turnCount: number;
//   currentTurn: string | null;
//   battleLog: string[];
//   startTime: number | null;
//   endTime: number | null;
//   winner: string | null;
// }

// export interface PlayerData {
//   id: string;
//   name: string;
//   character: Character | null;
//   isReady: boolean;
//   health: number;
//   maxHealth: number;
//   mana: number;
//   maxMana: number;
// }

// export interface GameAction {
//   type: 'ability' | 'surrender';
//   abilityId?: string;
//   targetId?: string;
// }

// /**
//  * Socket service for handling multiplayer communication
//  */
// class SocketService {
//   private socket: Socket | null = null;
//   private serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
//   private playerId: string | null = null;
//   private playerName: string | null = null;
//   private roomCache: Map<string, RoomData> = new Map();
//   private reconnectAttempts: number = 0;
//   private maxReconnectAttempts: number = 5;
  
//   /**
//    * Initialize the socket connection
//    */
//   public connect(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       try {
//         // Don't create a new connection if one exists
//         if (this.socket?.connected) {
//           console.log('Socket already connected with ID:', this.socket.id);
//           this.playerId = this.socket.id;
//           return resolve(this.socket.id);
//         }
        
//         console.log('Connecting to socket server at:', this.serverUrl);
        
//         // Initialize socket connection
//         this.socket = io(this.serverUrl, {
//           transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
//           autoConnect: true,
//           reconnection: true,
//           reconnectionAttempts: this.maxReconnectAttempts,
//           reconnectionDelay: 1000,
//           timeout: 10000 // Increase timeout to 10 seconds
//         });

//         // Setup connection event handlers
//         this.socket.on('connect', () => {
//           console.log('Socket connected with ID:', this.socket?.id);
//           this.reconnectAttempts = 0;
//           this.playerId = this.socket?.id || null;
//         });

//         this.socket.on('connection_success', (data) => {
//           console.log('Connection successful:', data);
//           this.playerId = data.playerId;
//           this.playerName = data.playerData?.name || null;
//           resolve(data.playerId);
//         });

//         this.socket.on('connect_error', (error) => {
//           console.error('Socket connection error:', error);
//           this.reconnectAttempts++;
          
//           if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//             reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
//           }
//         });

//         this.socket.on('disconnect', (reason) => {
//           console.log('Socket disconnected:', reason);
          
//           // If the server closed the connection, try to reconnect
//           if (reason === 'io server disconnect') {
//             this.socket?.connect();
//           }
//         });
        
//         // Set a connection timeout
//         const timeout = setTimeout(() => {
//           if (!this.socket?.connected) {
//             reject(new Error('Connection timeout'));
//           }
//           clearTimeout(timeout);
//         }, 10000);

//       } catch (error) {
//         console.error('Socket initialization error:', error);
//         reject(error);
//       }
//     });
//   }

//   /**
//    * Disconnect the socket
//    */
//   public disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//       this.playerId = null;
//       this.roomCache.clear();
//     }
//   }

//   /**
//    * Check if socket is connected
//    */
//   public isConnected(): boolean {
//     return this.socket?.connected || false;
//   }

//   /**
//    * Get player ID
//    */
//   public getPlayerId(): string | null {
//     return this.playerId || this.socket?.id || null;
//   }

//   /**
//    * Add event listener with proper error handling
//    */
//   public on(event: SocketEvent, callback: Function): void {
//     if (!this.socket) {
//       console.warn(`Socket not connected. Can't add listener for ${event}`);
//       return;
//     }
    
//     // Add socket listener with properly typed rest parameters
//     this.socket.on(event, (...args: unknown[]) => {
//       try {
//         callback(...args);
//       } catch (error) {
//         console.error(`Error in ${event} event handler:`, error);
//       }
//     });
//   }

//   /**
//    * Remove event listener
//    */
//   public off(event: SocketEvent, callback?: Function): void {
//     if (!this.socket) return;
    
//     if (callback) {
//       this.socket.off(event, callback as any);
//     } else {
//       this.socket.off(event);
//     }
//   }

//   /**
//    * Create a new room with validated parameters
//    */
//   public createRoom(name: string = '', isPrivate: boolean = false): void {
//     if (!this.socket?.connected) {
//       console.error('Socket not connected. Cannot create room.');
//       this.emitCustomEvent('create_room_error', { error: 'Not connected to server' });
//       return;
//     }
    
//     const roomName = name.trim() || `${this.playerName || 'Player'}'s Room`;
//     this.socket.emit('create_room', { name: roomName, isPrivate });
//   }

//   /**
//    * Join a room with validation
//    */
//   public joinRoom(roomId: string): void {
//     if (!this.socket?.connected) {
//       console.error('Socket not connected. Cannot join room.');
//       this.emitCustomEvent('join_room_error', { error: 'Not connected to server' });
//       return;
//     }
    
//     if (!roomId.trim()) {
//       this.emitCustomEvent('join_room_error', { error: 'Room ID is required' });
//       return;
//     }
    
//     this.socket.emit('join_room', { roomId: roomId.trim() });
//   }

//   /**
//    * Leave the current room
//    */
//   public leaveRoom(roomId: string): void {
//     if (!this.socket?.connected || !roomId) {
//       console.error('Socket not connected or invalid room ID. Cannot leave room.');
//       return;
//     }
    
//     this.socket.emit('leave_room', { roomId });
//   }

//   /**
//    * Select a character with validation
//    */
//   public selectCharacter(character: Character): void {
//     if (!this.socket?.connected) {
//       console.error('Socket not connected. Cannot select character.');
//       return;
//     }
    
//     if (!character) {
//       console.error('Invalid character data.');
//       return;
//     }
    
//     this.socket.emit('select_character', { character });
//   }

//   /**
//    * Set player ready status
//    */
//   public setPlayerReady(isReady: boolean = true): void {
//     if (!this.socket?.connected) {
//       console.error('Socket not connected. Cannot set ready status.');
//       return;
//     }
    
//     this.socket.emit('player_ready', { isReady });
//   }

//   /**
//    * Perform a game action
//    */
//   public performGameAction(action: GameAction): void {
//     if (!this.socket?.connected) {
//       console.error('Socket not connected. Cannot perform game action.');
//       return;
//     }
    
//     this.socket.emit('game_action', action);
//   }

//   /**
//    * Send a chat message
//    */
//   public sendChatMessage(roomId: string, message: string): void {
//     if (!this.socket?.connected || !roomId || !message.trim()) {
//       console.error('Socket not connected or invalid message/room. Cannot send chat message.');
//       return;
//     }
    
//     this.socket.emit('chat_message', { roomId, message: message.trim() });
//   }

//   /**
//    * Get available rooms with error handling
//    */
//   public async getAvailableRooms(): Promise<RoomData[]> {
//     try {
//       // Make a regular HTTP request to the API endpoint
//       const response = await fetch(`${this.serverUrl}/api/rooms`);
      
//       if (!response.ok) {
//         throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
//       }
      
//       const data = await response.json();
//       return data.rooms || [];
//     } catch (error) {
//       console.error('Error fetching available rooms:', error);
//       return [];
//     }
//   }
  
//   /**
//    * Helper method to emit custom events for testing/debugging
//    */
//   private emitCustomEvent(eventName: string, data: any): void {
//     // Create and dispatch a custom event
//     const event = new CustomEvent(eventName, { detail: data });
//     window.dispatchEvent(event);
//   }
// }

// // Create singleton instance
// export const socketService = new SocketService();
// export default socketService;










// import { io, Socket } from 'socket.io-client';
// import { Character, Enemy } from '@/components/game-state-provider';

// // Types for socket events
// export type SocketEvent = 
//   | 'connect'
//   | 'disconnect'
//   | 'connection_success'
//   | 'create_room'
//   | 'room_created'
//   | 'create_room_error'
//   | 'join_room'
//   | 'room_joined'
//   | 'join_room_error'
//   | 'leave_room'
//   | 'room_left'
//   | 'leave_room_error'
//   | 'player_joined'
//   | 'player_left'
//   | 'room_updated'
//   | 'room_available'
//   | 'room_unavailable'
//   | 'select_character'
//   | 'character_selected'
//   | 'character_select_error'
//   | 'player_ready'
//   | 'player_ready_updated'
//   | 'player_ready_error'
//   | 'game_countdown'
//   | 'game_started'
//   | 'game_action'
//   | 'game_action_performed'
//   | 'game_action_error'
//   | 'game_over'
//   | 'chat_message';

// // Room data types
// export interface RoomData {
//   id: string;
//   name: string;
//   hostId: string;
//   hostName?: string; // Added hostName property
//   guestId: string | null;
//   status: 'waiting' | 'ready' | 'in-progress' | 'completed';
//   players: string[];
//   maxPlayers?: number; // Added maxPlayers property
//   gameData: GameData;
//   createdAt: number;
//   lastActivity: number;
// }

// export interface GameData {
//   turnCount: number;
//   currentTurn: string | null;
//   battleLog: string[];
//   startTime: number | null;
//   endTime: number | null;
//   winner: string | null;
// }

// export interface PlayerData {
//   id: string;
//   name: string;
//   character: Character | null;
//   isReady: boolean;
//   health: number;
//   maxHealth: number;
//   mana: number;
//   maxMana: number;
// }

// export interface GameAction {
//   type: 'ability' | 'surrender';
//   abilityId?: string;
//   targetId?: string;
// }

// /**
//  * Socket service for handling multiplayer communication
//  */
// class SocketService {
//   private socket: Socket | null = null;
//   private serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
//   private listeners: Map<SocketEvent, Set<Function>> = new Map();

//   /**
//    * Initialize the socket connection
//    */
//   public connect(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       try {
//         // Initialize socket connection
//         this.socket = io(this.serverUrl, {
//           transports: ['websocket'],
//           autoConnect: true,
//           reconnection: true,
//           reconnectionAttempts: 5,
//           reconnectionDelay: 1000
//         });

//         // Setup connection event handlers
//         this.socket.on('connect', () => {
//           console.log('Socket connected with ID:', this.socket?.id);
//         });

//         this.socket.on('connection_success', (data) => {
//           console.log('Connection successful:', data);
//           resolve(data.playerId);
//         });

//         this.socket.on('connect_error', (error) => {
//           console.error('Socket connection error:', error);
//           reject(error);
//         });

//         this.socket.on('disconnect', (reason) => {
//           console.log('Socket disconnected:', reason);
//         });

//       } catch (error) {
//         console.error('Socket initialization error:', error);
//         reject(error);
//       }
//     });
//   }

//   /**
//    * Disconnect the socket
//    */
//   public disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//     }
//   }

//   /**
//    * Check if socket is connected
//    */
//   public isConnected(): boolean {
//     return this.socket?.connected || false;
//   }

//   /**
//    * Get player ID
//    */
//   public getPlayerId(): string | null {
//     return this.socket?.id || null;
//   }

//   /**
//    * Add event listener
//    * @param event Event name
//    * @param callback Callback function
//    */
//   public on(event: SocketEvent, callback: Function): void {
//     // Initialize listener set if it doesn't exist
//     if (!this.listeners.has(event)) {
//       this.listeners.set(event, new Set());
//     }

//     // Add callback to listeners
//     this.listeners.get(event)?.add(callback);

//     // Add socket listener with properly typed rest parameters
//     this.socket?.on(event, (...args: unknown[]) => {
//       // Call all registered callbacks for this event
//       this.listeners.get(event)?.forEach(cb => cb(...args));
//     });
//   }

//   /**
//    * Remove event listener
//    * @param event Event name
//    * @param callback Callback function to remove
//    */
//   public off(event: SocketEvent, callback: Function): void {
//     // Remove callback from listeners set
//     this.listeners.get(event)?.delete(callback);
    
//     // If there are no more listeners for this event, remove socket listener
//     if (this.listeners.get(event)?.size === 0) {
//       this.socket?.off(event);
//     }
//   }

//   /**
//    * Create a new room
//    * @param name Room name
//    * @param isPrivate Whether the room is private
//    */
//   public createRoom(name: string, isPrivate: boolean = false): void {
//     this.socket?.emit('create_room', { name, isPrivate });
//   }

//   /**
//    * Join a room
//    * @param roomId Room ID
//    */
//   public joinRoom(roomId: string): void {
//     this.socket?.emit('join_room', { roomId });
//   }

//   /**
//    * Leave a room
//    * @param roomId Room ID
//    */
//   public leaveRoom(roomId: string): void {
//     this.socket?.emit('leave_room', { roomId });
//   }

//   /**
//    * Select a character
//    * @param character Character data
//    */
//   public selectCharacter(character: Character): void {
//     this.socket?.emit('select_character', { character });
//   }

//   /**
//    * Set player ready status
//    * @param isReady Ready status
//    */
//   public setPlayerReady(isReady: boolean): void {
//     this.socket?.emit('player_ready', { isReady });
//   }

//   /**
//    * Perform a game action
//    * @param action Game action
//    */
//   public performGameAction(action: GameAction): void {
//     this.socket?.emit('game_action', action);
//   }

//   /**
//    * Send a chat message
//    * @param roomId Room ID
//    * @param message Message text
//    */
//   public sendChatMessage(roomId: string, message: string): void {
//     this.socket?.emit('chat_message', { roomId, message });
//   }

//   /**
//    * Get available rooms
//    */
//   public async getAvailableRooms(): Promise<any[]> {
//     return new Promise((resolve, reject) => {
//       // Make a regular HTTP request to the API endpoint
//       fetch(`${this.serverUrl}/api/rooms`)
//         .then(response => response.json())
//         .then(data => resolve(data.rooms))
//         .catch(error => reject(error));
//     });
//   }
// }

// // Create singleton instance
// const socketService = new SocketService();

// export { socketService };
// export default socketService;

