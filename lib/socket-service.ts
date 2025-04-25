import { io, Socket } from 'socket.io-client';
import { Character, Enemy } from '@/components/game-state-provider';

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
  hostName?: string; // Added hostName property
  guestId: string | null;
  status: 'waiting' | 'ready' | 'in-progress' | 'completed';
  players: string[];
  maxPlayers?: number; // Added maxPlayers property
  gameData: GameData;
  createdAt: number;
  lastActivity: number;
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
  private listeners: Map<SocketEvent, Set<Function>> = new Map();

  /**
   * Initialize the socket connection
   */
  public connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Initialize socket connection
        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        // Setup connection event handlers
        this.socket.on('connect', () => {
          console.log('Socket connected with ID:', this.socket?.id);
        });

        this.socket.on('connection_success', (data) => {
          console.log('Connection successful:', data);
          resolve(data.playerId);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
        });

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
    return this.socket?.id || null;
  }

  /**
   * Add event listener
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: SocketEvent, callback: Function): void {
    // Initialize listener set if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    // Add callback to listeners
    this.listeners.get(event)?.add(callback);

    // Add socket listener with properly typed rest parameters
    this.socket?.on(event, (...args: unknown[]) => {
      // Call all registered callbacks for this event
      this.listeners.get(event)?.forEach(cb => cb(...args));
    });
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param callback Callback function to remove
   */
  public off(event: SocketEvent, callback: Function): void {
    // Remove callback from listeners set
    this.listeners.get(event)?.delete(callback);
    
    // If there are no more listeners for this event, remove socket listener
    if (this.listeners.get(event)?.size === 0) {
      this.socket?.off(event);
    }
  }

  /**
   * Create a new room
   * @param name Room name
   * @param isPrivate Whether the room is private
   */
  public createRoom(name: string, isPrivate: boolean = false): void {
    this.socket?.emit('create_room', { name, isPrivate });
  }

  /**
   * Join a room
   * @param roomId Room ID
   */
  public joinRoom(roomId: string): void {
    this.socket?.emit('join_room', { roomId });
  }

  /**
   * Leave a room
   * @param roomId Room ID
   */
  public leaveRoom(roomId: string): void {
    this.socket?.emit('leave_room', { roomId });
  }

  /**
   * Select a character
   * @param character Character data
   */
  public selectCharacter(character: Character): void {
    this.socket?.emit('select_character', { character });
  }

  /**
   * Set player ready status
   * @param isReady Ready status
   */
  public setPlayerReady(isReady: boolean): void {
    this.socket?.emit('player_ready', { isReady });
  }

  /**
   * Perform a game action
   * @param action Game action
   */
  public performGameAction(action: GameAction): void {
    this.socket?.emit('game_action', action);
  }

  /**
   * Send a chat message
   * @param roomId Room ID
   * @param message Message text
   */
  public sendChatMessage(roomId: string, message: string): void {
    this.socket?.emit('chat_message', { roomId, message });
  }

  /**
   * Get available rooms
   */
  public async getAvailableRooms(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Make a regular HTTP request to the API endpoint
      fetch(`${this.serverUrl}/api/rooms`)
        .then(response => response.json())
        .then(data => resolve(data.rooms))
        .catch(error => reject(error));
    });
  }
}

// Create singleton instance
const socketService = new SocketService();

export { socketService };
export default socketService;

