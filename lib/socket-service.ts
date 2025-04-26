// lib/socket-service.ts
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
  hostName?: string | null;  // Changed to accept undefined
  hostCharacter?: Character | null;  // Changed to accept undefined
  guestId: string | null;
  guestName?: string | null;  // Changed to accept undefined
  guestCharacter?: Character | null;  // Changed to accept undefined
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

// Type for callback functions
type SocketCallback = (...args: any[]) => void;

/**
 * Mock SocketService for client-side testing and development
 * This simulates socket.io functionality when a server isn't available
 */
class MockSocketService {
  private playerId: string;
  private rooms: Map<string, RoomData> = new Map();
  private connected: boolean = false;
  private eventHandlers: Map<string, SocketCallback[]> = new Map();
  private playerName: string = '';

  constructor() {
    this.playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  }

  // Mock connection
  public connect(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        
        // Trigger connect event handlers
        this.triggerEvent('connect', null);
        this.triggerEvent('connection_success', { 
          playerId: this.playerId,
          playerData: { name: this.playerName || 'Player' }
        });
        
        resolve(this.playerId);
      }, 500);
    });
  }

  // Mock disconnect
  public disconnect(): void {
    this.connected = false;
    this.triggerEvent('disconnect', 'client disconnect');
  }

  // Check if socket is connected
  public isConnected(): boolean {
    return this.connected;
  }

  // Get player ID
  public getPlayerId(): string | null {
    return this.playerId;
  }

  // Add event listener
  public on(event: string, callback: SocketCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(callback);
  }

  // Remove event listener
  public off(event: string, callback?: SocketCallback): void {
    if (callback && this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.eventHandlers.delete(event);
    }
  }
  
  // Trigger event for testing
  private triggerEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  // Create a new room
  public createRoom(name: string = '', isPrivate: boolean = false): void {
    const roomId = this.generateRoomCode();
    this.playerName = this.playerName || 'Player';
    
    // Create room object
    const room: RoomData = {
      id: roomId,
      name: name || `${this.playerName}'s Room`,
      hostId: this.playerId,
      hostName: this.playerName,
      guestId: null,
      status: 'waiting',
      players: [this.playerId],
      maxPlayers: 2,
      gameData: {
        turnCount: 0,
        currentTurn: null,
        battleLog: [],
        startTime: null,
        endTime: null,
        winner: null
      },
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isPrivate
    };
    
    // Store room
    this.rooms.set(roomId, room);
    
    // Trigger room_created event after a short delay
    setTimeout(() => {
      this.triggerEvent('room_created', { room });
    }, 800);
  }

  // Generate a room code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Join a room
  public joinRoom(roomId: string): void {
    // Simulate room join
    setTimeout(() => {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        this.triggerEvent('join_room_error', { error: 'Room not found' });
        return;
      }
      
      if (room.players.length >= room.maxPlayers) {
        this.triggerEvent('join_room_error', { error: 'Room is full' });
        return;
      }
      
      // Add player to room
      room.players.push(this.playerId);
      room.guestId = this.playerId;
      room.guestName = this.playerName;
      
      // Trigger join event
      this.triggerEvent('room_joined', { room });
      
      // Notify host
      this.triggerEvent('player_joined', {
        playerId: this.playerId,
        playerName: this.playerName
      });
    }, 800);
  }

  // Leave a room
  public leaveRoom(roomId: string): void {
    setTimeout(() => {
      const room = this.rooms.get(roomId);
      
      if (room) {
        // Remove player from room
        room.players = room.players.filter(id => id !== this.playerId);
        
        // Clear guest if needed
        if (room.guestId === this.playerId) {
          room.guestId = null;
          room.guestName = null;
          room.guestCharacter = null;
        }
        
        // Delete room if empty
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          // Update room data
          room.lastActivity = Date.now();
        }
        
        this.triggerEvent('room_left', { roomId });
      }
    }, 500);
  }

  // Select character
  public selectCharacter(character: Character): void {
    setTimeout(() => {
      // Find room player is in
      let playerRoom: RoomData | undefined;
      
      this.rooms.forEach(room => {
        if (room.players.includes(this.playerId)) {
          playerRoom = room;
        }
      });
      
      if (!playerRoom) {
        this.triggerEvent('character_select_error', { error: 'Not in a room' });
        return;
      }
      
      // Update character
      if (playerRoom.hostId === this.playerId) {
        playerRoom.hostCharacter = character;
      } else {
        playerRoom.guestCharacter = character;
      }
      
      // Trigger event
      this.triggerEvent('character_selected', {
        playerId: this.playerId,
        playerName: this.playerName,
        character
      });
    }, 500);
  }

  // Set player ready status
  public setPlayerReady(isReady: boolean = true): void {
    setTimeout(() => {
      let playerRoom: RoomData | undefined;
      
      this.rooms.forEach(room => {
        if (room.players.includes(this.playerId)) {
          playerRoom = room;
        }
      });
      
      if (!playerRoom) {
        this.triggerEvent('player_ready_error', { error: 'Not in a room' });
        return;
      }
      
      this.triggerEvent('player_ready_updated', {
        playerId: this.playerId,
        playerName: this.playerName,
        isReady
      });
      
      // If both players ready, start countdown
      if (playerRoom.players.length === 2) {
        const bothReady = (playerRoom.hostId === this.playerId && isReady) ||
                         (playerRoom.guestId === this.playerId && isReady);
                         
        if (bothReady) {
          // Start countdown
          this.triggerEvent('game_countdown', { countdown: 3 });
          
          setTimeout(() => {
            this.triggerEvent('game_countdown', { countdown: 2 });
          }, 1000);
          
          setTimeout(() => {
            this.triggerEvent('game_countdown', { countdown: 1 });
          }, 2000);
          
          setTimeout(() => {
            playerRoom!.status = 'in-progress';
            playerRoom!.gameData.currentTurn = playerRoom!.hostId;
            playerRoom!.gameData.turnCount = 1;
            playerRoom!.gameData.startTime = Date.now();
            playerRoom!.gameData.battleLog = ['Battle started!', `${playerRoom!.hostName} goes first!`];
            
            this.triggerEvent('game_started', { 
              room: playerRoom,
              gameData: playerRoom!.gameData
            });
          }, 3000);
        }
      }
    }, 500);
  }

  // Perform game action
  public performGameAction(action: GameAction): void {
    setTimeout(() => {
      let playerRoom: RoomData | undefined;
      
      this.rooms.forEach(room => {
        if (room.players.includes(this.playerId)) {
          playerRoom = room;
        }
      });
      
      if (!playerRoom) {
        this.triggerEvent('game_action_error', { error: 'Not in a room' });
        return;
      }
      
      // For our mock, just simulate simple ability usage
      if (action.type === 'ability') {
        // Get opponent ID
        const opponentId = playerRoom.hostId === this.playerId ? 
          playerRoom.guestId : playerRoom.hostId;
        
        const damage = 15; // Simulated damage
        
        this.triggerEvent('game_action_performed', {
          playerId: this.playerId,
          action,
          result: {
            ability: {
              id: action.abilityId || 'default-ability',
              name: 'Attack',
              type: 'physical'
            },
            damage,
            targetPlayerId: opponentId
          }
        });
      }
      
      // Handle surrender
      if (action.type === 'surrender') {
        const opponentId = playerRoom.hostId === this.playerId ? 
          playerRoom.guestId : playerRoom.hostId;
          
        playerRoom.status = 'completed';
        playerRoom.gameData.winner = opponentId;
        playerRoom.gameData.endTime = Date.now();
        
        this.triggerEvent('game_over', {
          winnerId: opponentId,
          winnerName: playerRoom.hostId === opponentId ? 
            playerRoom.hostName : playerRoom.guestName
        });
      }
    }, 500);
  }

  // Update opponent health
  public updateOpponentHealth(health: number): void {
    // This would be handled by game_action in a real implementation
  }

  // Get available rooms
  public async getAvailableRooms(): Promise<RoomData[]> {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate && room.status === 'waiting' && room.players.length < room.maxPlayers);
  }
}

// Determine whether to use real socket.io or mock
const isMockMode = process.env.NEXT_PUBLIC_MOCK_SOCKETS === 'true' || 
                  !process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
                  typeof window === 'undefined';

// Create the appropriate service
let socketService: any;

// Initialize server connection only in browser
if (typeof window !== 'undefined') {
  if (isMockMode) {
    console.log("Using mock socket service for development");
    socketService = new MockSocketService();
  } else {
    // Dynamically import socket.io-client to avoid SSR issues
    import('socket.io-client').then(io => {
      const socket = io.io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true
      });
      
      socketService = {
        socket,
        
        connect: function(): Promise<string> {
          return new Promise((resolve, reject) => {
            let connectionTimeout: ReturnType<typeof setTimeout>;
            
            const onConnect = () => {
              clearTimeout(connectionTimeout);
              socket.off('connect', onConnect);
              socket.off('connect_error', onConnectError);
              
              // Set timeout for getting player ID
              const idTimeout = setTimeout(() => {
                reject(new Error('Connection success event timeout'));
              }, 5000);
              
              socket.once('connection_success', (data: any) => {
                clearTimeout(idTimeout);
                resolve(data.playerId);
              });
            };
            
            const onConnectError = (error: any) => {
              clearTimeout(connectionTimeout);
              socket.off('connect', onConnect);
              socket.off('connect_error', onConnectError);
              reject(error);
            };
            
            socket.on('connect', onConnect);
            socket.on('connect_error', onConnectError);
            
            // Set connection timeout
            connectionTimeout = setTimeout(() => {
              socket.off('connect', onConnect);
              socket.off('connect_error', onConnectError);
              reject(new Error('Connection timeout'));
            }, 10000);
            
            socket.connect();
          });
        },
        
        disconnect: function(): void {
          socket.disconnect();
        },
        
        isConnected: function(): boolean {
          return socket.connected;
        },
        
        getPlayerId: function(): string | null {
          // Fix: Convert undefined to null to match return type
          return socket.id || null;
        },
        
        on: function(event: string, callback: SocketCallback): void {
          socket.on(event, callback);
        },
        
        off: function(event: string, callback?: SocketCallback): void {
          if (callback) {
            socket.off(event, callback as any);
          } else {
            socket.off(event);
          }
        },
        
        createRoom: function(name: string = '', isPrivate: boolean = false): void {
          socket.emit('create_room', { name, isPrivate });
        },
        
        joinRoom: function(roomId: string): void {
          socket.emit('join_room', { roomId });
        },
        
        leaveRoom: function(roomId: string): void {
          socket.emit('leave_room', { roomId });
        },
        
        selectCharacter: function(character: Character): void {
          socket.emit('select_character', { character });
        },
        
        setPlayerReady: function(isReady: boolean = true): void {
          socket.emit('player_ready', { isReady });
        },
        
        performGameAction: function(action: GameAction): void {
          socket.emit('game_action', action);
        },
        
        updateOpponentHealth: function(health: number): void {
          // This would be handled by game_action in a real implementation
        },
        
        getAvailableRooms: async function(): Promise<RoomData[]> {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'}/api/rooms`);
            if (!response.ok) {
              throw new Error(`Failed to fetch rooms: ${response.status}`);
            }
            const data = await response.json();
            return data.rooms || [];
          } catch (error) {
            console.error('Error fetching available rooms:', error);
            return [];
          }
        }
      };
    }).catch(err => {
      console.error("Failed to load socket.io-client:", err);
      // Fallback to mock service if socket.io fails to load
      socketService = new MockSocketService();
    });
  }
} else {
  // Server-side rendering placeholder
  socketService = {
    connect: () => Promise.resolve('server-side'),
    disconnect: () => {},
    isConnected: () => false,
    getPlayerId: () => null,
    on: () => {},
    off: () => {},
    createRoom: () => {},
    joinRoom: () => {},
    leaveRoom: () => {},
    selectCharacter: () => {},
    setPlayerReady: () => {},
    performGameAction: () => {},
    updateOpponentHealth: () => {},
    getAvailableRooms: async () => []
  };
}

// For development, force mock mode if specified
if (typeof window !== 'undefined' && window.location.search.includes('mock=true')) {
  console.log("Forced mock mode via URL parameter");
  socketService = new MockSocketService();
}

export { socketService };
export default socketService;


// // lib/socket-service.ts
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
//   hostName?: string | null;  // Changed to accept undefined
//   hostCharacter?: Character | null;  // Changed to accept undefined
//   guestId: string | null;
//   guestName?: string | null;  // Changed to accept undefined
//   guestCharacter?: Character | null;  // Changed to accept undefined
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

// // Type for callback functions
// type SocketCallback = (...args: any[]) => void;

// /**
//  * Mock SocketService for client-side testing and development
//  * This simulates socket.io functionality when a server isn't available
//  */
// class MockSocketService {
//   private playerId: string;
//   private rooms: Map<string, RoomData> = new Map();
//   private connected: boolean = false;
//   private eventHandlers: Map<string, SocketCallback[]> = new Map();
//   private playerName: string = '';

//   constructor() {
//     this.playerId = 'player_' + Math.random().toString(36).substring(2, 9);
//   }

//   // Mock connection
//   public connect(): Promise<string> {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         this.connected = true;
        
//         // Trigger connect event handlers
//         this.triggerEvent('connect', null);
//         this.triggerEvent('connection_success', { 
//           playerId: this.playerId,
//           playerData: { name: this.playerName || 'Player' }
//         });
        
//         resolve(this.playerId);
//       }, 500);
//     });
//   }

//   // Mock disconnect
//   public disconnect(): void {
//     this.connected = false;
//     this.triggerEvent('disconnect', 'client disconnect');
//   }

//   // Check if socket is connected
//   public isConnected(): boolean {
//     return this.connected;
//   }

//   // Get player ID
//   public getPlayerId(): string | null {
//     return this.playerId;
//   }

//   // Add event listener
//   public on(event: string, callback: SocketCallback): void {
//     if (!this.eventHandlers.has(event)) {
//       this.eventHandlers.set(event, []);
//     }
//     this.eventHandlers.get(event)?.push(callback);
//   }

//   // Remove event listener
//   public off(event: string, callback?: SocketCallback): void {
//     if (callback && this.eventHandlers.has(event)) {
//       const handlers = this.eventHandlers.get(event);
//       if (handlers) {
//         const index = handlers.indexOf(callback);
//         if (index !== -1) {
//           handlers.splice(index, 1);
//         }
//       }
//     } else {
//       this.eventHandlers.delete(event);
//     }
//   }
  
//   // Trigger event for testing
//   private triggerEvent(event: string, data: any): void {
//     const handlers = this.eventHandlers.get(event) || [];
//     handlers.forEach(handler => {
//       try {
//         handler(data);
//       } catch (error) {
//         console.error(`Error in ${event} handler:`, error);
//       }
//     });
//   }

//   // Create a new room
//   public createRoom(name: string = '', isPrivate: boolean = false): void {
//     const roomId = this.generateRoomCode();
//     this.playerName = this.playerName || 'Player';
    
//     // Create room object
//     const room: RoomData = {
//       id: roomId,
//       name: name || `${this.playerName}'s Room`,
//       hostId: this.playerId,
//       hostName: this.playerName,
//       guestId: null,
//       status: 'waiting',
//       players: [this.playerId],
//       maxPlayers: 2,
//       gameData: {
//         turnCount: 0,
//         currentTurn: null,
//         battleLog: [],
//         startTime: null,
//         endTime: null,
//         winner: null
//       },
//       createdAt: Date.now(),
//       lastActivity: Date.now(),
//       isPrivate
//     };
    
//     // Store room
//     this.rooms.set(roomId, room);
    
//     // Trigger room_created event after a short delay
//     setTimeout(() => {
//       this.triggerEvent('room_created', { room });
//     }, 800);
//   }

//   // Generate a room code
//   private generateRoomCode(): string {
//     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
//     let code = '';
//     for (let i = 0; i < 6; i++) {
//       code += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return code;
//   }

//   // Join a room
//   public joinRoom(roomId: string): void {
//     // Simulate room join
//     setTimeout(() => {
//       const room = this.rooms.get(roomId);
      
//       if (!room) {
//         this.triggerEvent('join_room_error', { error: 'Room not found' });
//         return;
//       }
      
//       if (room.players.length >= room.maxPlayers) {
//         this.triggerEvent('join_room_error', { error: 'Room is full' });
//         return;
//       }
      
//       // Add player to room
//       room.players.push(this.playerId);
//       room.guestId = this.playerId;
//       room.guestName = this.playerName;
      
//       // Trigger join event
//       this.triggerEvent('room_joined', { room });
      
//       // Notify host
//       this.triggerEvent('player_joined', {
//         playerId: this.playerId,
//         playerName: this.playerName
//       });
//     }, 800);
//   }

//   // Leave a room
//   public leaveRoom(roomId: string): void {
//     setTimeout(() => {
//       const room = this.rooms.get(roomId);
      
//       if (room) {
//         // Remove player from room
//         room.players = room.players.filter(id => id !== this.playerId);
        
//         // Clear guest if needed
//         if (room.guestId === this.playerId) {
//           room.guestId = null;
//           room.guestName = null;
//           room.guestCharacter = null;
//         }
        
//         // Delete room if empty
//         if (room.players.length === 0) {
//           this.rooms.delete(roomId);
//         } else {
//           // Update room data
//           room.lastActivity = Date.now();
//         }
        
//         this.triggerEvent('room_left', { roomId });
//       }
//     }, 500);
//   }

//   // Select character
//   public selectCharacter(character: Character): void {
//     setTimeout(() => {
//       // Find room player is in
//       let playerRoom: RoomData | undefined;
      
//       this.rooms.forEach(room => {
//         if (room.players.includes(this.playerId)) {
//           playerRoom = room;
//         }
//       });
      
//       if (!playerRoom) {
//         this.triggerEvent('character_select_error', { error: 'Not in a room' });
//         return;
//       }
      
//       // Update character
//       if (playerRoom.hostId === this.playerId) {
//         playerRoom.hostCharacter = character;
//       } else {
//         playerRoom.guestCharacter = character;
//       }
      
//       // Trigger event
//       this.triggerEvent('character_selected', {
//         playerId: this.playerId,
//         playerName: this.playerName,
//         character
//       });
//     }, 500);
//   }

//   // Set player ready status
//   public setPlayerReady(isReady: boolean = true): void {
//     setTimeout(() => {
//       let playerRoom: RoomData | undefined;
      
//       this.rooms.forEach(room => {
//         if (room.players.includes(this.playerId)) {
//           playerRoom = room;
//         }
//       });
      
//       if (!playerRoom) {
//         this.triggerEvent('player_ready_error', { error: 'Not in a room' });
//         return;
//       }
      
//       this.triggerEvent('player_ready_updated', {
//         playerId: this.playerId,
//         playerName: this.playerName,
//         isReady
//       });
      
//       // If both players ready, start countdown
//       if (playerRoom.players.length === 2) {
//         const bothReady = (playerRoom.hostId === this.playerId && isReady) ||
//                          (playerRoom.guestId === this.playerId && isReady);
                         
//         if (bothReady) {
//           // Start countdown
//           this.triggerEvent('game_countdown', { countdown: 3 });
          
//           setTimeout(() => {
//             this.triggerEvent('game_countdown', { countdown: 2 });
//           }, 1000);
          
//           setTimeout(() => {
//             this.triggerEvent('game_countdown', { countdown: 1 });
//           }, 2000);
          
//           setTimeout(() => {
//             playerRoom!.status = 'in-progress';
//             playerRoom!.gameData.currentTurn = playerRoom!.hostId;
//             playerRoom!.gameData.turnCount = 1;
//             playerRoom!.gameData.startTime = Date.now();
//             playerRoom!.gameData.battleLog = ['Battle started!', `${playerRoom!.hostName} goes first!`];
            
//             this.triggerEvent('game_started', { 
//               room: playerRoom,
//               gameData: playerRoom!.gameData
//             });
//           }, 3000);
//         }
//       }
//     }, 500);
//   }

//   // Perform game action
//   public performGameAction(action: GameAction): void {
//     setTimeout(() => {
//       let playerRoom: RoomData | undefined;
      
//       this.rooms.forEach(room => {
//         if (room.players.includes(this.playerId)) {
//           playerRoom = room;
//         }
//       });
      
//       if (!playerRoom) {
//         this.triggerEvent('game_action_error', { error: 'Not in a room' });
//         return;
//       }
      
//       // For our mock, just simulate simple ability usage
//       if (action.type === 'ability') {
//         // Get opponent ID
//         const opponentId = playerRoom.hostId === this.playerId ? 
//           playerRoom.guestId : playerRoom.hostId;
        
//         const damage = 15; // Simulated damage
        
//         this.triggerEvent('game_action_performed', {
//           playerId: this.playerId,
//           action,
//           result: {
//             ability: {
//               id: action.abilityId || 'default-ability',
//               name: 'Attack',
//               type: 'physical'
//             },
//             damage,
//             targetPlayerId: opponentId
//           }
//         });
//       }
      
//       // Handle surrender
//       if (action.type === 'surrender') {
//         const opponentId = playerRoom.hostId === this.playerId ? 
//           playerRoom.guestId : playerRoom.hostId;
          
//         playerRoom.status = 'completed';
//         playerRoom.gameData.winner = opponentId;
//         playerRoom.gameData.endTime = Date.now();
        
//         this.triggerEvent('game_over', {
//           winnerId: opponentId,
//           winnerName: playerRoom.hostId === opponentId ? 
//             playerRoom.hostName : playerRoom.guestName
//         });
//       }
//     }, 500);
//   }

//   // Update opponent health
//   public updateOpponentHealth(health: number): void {
//     // This would be handled by game_action in a real implementation
//   }

//   // Get available rooms
//   public async getAvailableRooms(): Promise<RoomData[]> {
//     return Array.from(this.rooms.values())
//       .filter(room => !room.isPrivate && room.status === 'waiting' && room.players.length < room.maxPlayers);
//   }
// }

// // Determine whether to use real socket.io or mock
// const isMockMode = process.env.NEXT_PUBLIC_MOCK_SOCKETS === 'true' || 
//                   !process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
//                   typeof window === 'undefined';

// // Create the appropriate service
// let socketService: any;

// // Initialize server connection only in browser
// if (typeof window !== 'undefined') {
//   if (isMockMode) {
//     console.log("Using mock socket service for development");
//     socketService = new MockSocketService();
//   } else {
//     // Dynamically import socket.io-client to avoid SSR issues
//     import('socket.io-client').then(io => {
//       const socket = io.io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001', {
//         transports: ['websocket', 'polling'],
//         autoConnect: false,
//         reconnection: true
//       });
      
//       socketService = {
//         socket,
        
//         connect: function(): Promise<string> {
//           return new Promise((resolve, reject) => {
//             let connectionTimeout: ReturnType<typeof setTimeout>;
            
//             const onConnect = () => {
//               clearTimeout(connectionTimeout);
//               socket.off('connect', onConnect);
//               socket.off('connect_error', onConnectError);
              
//               // Set timeout for getting player ID
//               const idTimeout = setTimeout(() => {
//                 reject(new Error('Connection success event timeout'));
//               }, 5000);
              
//               socket.once('connection_success', (data: any) => {
//                 clearTimeout(idTimeout);
//                 resolve(data.playerId);
//               });
//             };
            
//             const onConnectError = (error: any) => {
//               clearTimeout(connectionTimeout);
//               socket.off('connect', onConnect);
//               socket.off('connect_error', onConnectError);
//               reject(error);
//             };
            
//             socket.on('connect', onConnect);
//             socket.on('connect_error', onConnectError);
            
//             // Set connection timeout
//             connectionTimeout = setTimeout(() => {
//               socket.off('connect', onConnect);
//               socket.off('connect_error', onConnectError);
//               reject(new Error('Connection timeout'));
//             }, 10000);
            
//             socket.connect();
//           });
//         },
        
//         disconnect: function(): void {
//           socket.disconnect();
//         },
        
//         isConnected: function(): boolean {
//           return socket.connected;
//         },
        
//         getPlayerId: function(): string | null {
//           return socket.id;
//         },
        
//         on: function(event: string, callback: SocketCallback): void {
//           socket.on(event, callback);
//         },
        
//         off: function(event: string, callback?: SocketCallback): void {
//           if (callback) {
//             socket.off(event, callback as any);
//           } else {
//             socket.off(event);
//           }
//         },
        
//         createRoom: function(name: string = '', isPrivate: boolean = false): void {
//           socket.emit('create_room', { name, isPrivate });
//         },
        
//         joinRoom: function(roomId: string): void {
//           socket.emit('join_room', { roomId });
//         },
        
//         leaveRoom: function(roomId: string): void {
//           socket.emit('leave_room', { roomId });
//         },
        
//         selectCharacter: function(character: Character): void {
//           socket.emit('select_character', { character });
//         },
        
//         setPlayerReady: function(isReady: boolean = true): void {
//           socket.emit('player_ready', { isReady });
//         },
        
//         performGameAction: function(action: GameAction): void {
//           socket.emit('game_action', action);
//         },
        
//         updateOpponentHealth: function(health: number): void {
//           // This would be handled by game_action in a real implementation
//         },
        
//         getAvailableRooms: async function(): Promise<RoomData[]> {
//           try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'}/api/rooms`);
//             if (!response.ok) {
//               throw new Error(`Failed to fetch rooms: ${response.status}`);
//             }
//             const data = await response.json();
//             return data.rooms || [];
//           } catch (error) {
//             console.error('Error fetching available rooms:', error);
//             return [];
//           }
//         }
//       };
//     }).catch(err => {
//       console.error("Failed to load socket.io-client:", err);
//       // Fallback to mock service if socket.io fails to load
//       socketService = new MockSocketService();
//     });
//   }
// } else {
//   // Server-side rendering placeholder
//   socketService = {
//     connect: () => Promise.resolve('server-side'),
//     disconnect: () => {},
//     isConnected: () => false,
//     getPlayerId: () => null,
//     on: () => {},
//     off: () => {},
//     createRoom: () => {},
//     joinRoom: () => {},
//     leaveRoom: () => {},
//     selectCharacter: () => {},
//     setPlayerReady: () => {},
//     performGameAction: () => {},
//     updateOpponentHealth: () => {},
//     getAvailableRooms: async () => []
//   };
// }

// // For development, force mock mode if specified
// if (typeof window !== 'undefined' && window.location.search.includes('mock=true')) {
//   console.log("Forced mock mode via URL parameter");
//   socketService = new MockSocketService();
// }

// export { socketService };
// export default socketService;










// // // lib/socket-service.ts
// // import { io, Socket } from 'socket.io-client';
// // import { type Character } from '@/components/game-state-provider';

// // // Types for socket events
// // export type SocketEvent = 
// //   | 'connect'
// //   | 'disconnect'
// //   | 'connection_success'
// //   | 'create_room'
// //   | 'room_created'
// //   | 'create_room_error'
// //   | 'join_room'
// //   | 'room_joined'
// //   | 'join_room_error'
// //   | 'leave_room'
// //   | 'room_left'
// //   | 'leave_room_error'
// //   | 'player_joined'
// //   | 'player_left'
// //   | 'room_updated'
// //   | 'room_available'
// //   | 'room_unavailable'
// //   | 'select_character'
// //   | 'character_selected'
// //   | 'character_select_error'
// //   | 'player_ready'
// //   | 'player_ready_updated'
// //   | 'player_ready_error'
// //   | 'game_countdown'
// //   | 'game_started'
// //   | 'game_action'
// //   | 'game_action_performed'
// //   | 'game_action_error'
// //   | 'game_over'
// //   | 'chat_message';

// // // Room data types
// // export interface RoomData {
// //   id: string;
// //   name: string;
// //   hostId: string;
// //   hostName?: string;
// //   hostCharacter?: Character;
// //   guestId: string | null;
// //   guestName?: string;
// //   guestCharacter?: Character;
// //   status: 'waiting' | 'ready' | 'in-progress' | 'completed';
// //   players: string[];
// //   maxPlayers: number;
// //   gameData: GameData;
// //   createdAt: number;
// //   lastActivity: number;
// //   isPrivate?: boolean;
// // }

// // export interface GameData {
// //   turnCount: number;
// //   currentTurn: string | null;
// //   battleLog: string[];
// //   startTime: number | null;
// //   endTime: number | null;
// //   winner: string | null;
// // }

// // export interface PlayerData {
// //   id: string;
// //   name: string;
// //   character: Character | null;
// //   isReady: boolean;
// //   health: number;
// //   maxHealth: number;
// //   mana: number;
// //   maxMana: number;
// // }

// // export interface GameAction {
// //   type: 'ability' | 'surrender';
// //   abilityId?: string;
// //   targetId?: string;
// // }

// // /**
// //  * Socket service for handling multiplayer communication
// //  */
// // class SocketService {
// //   private socket: Socket | null = null;
// //   private serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
// //   private playerId: string | null = null;
// //   private playerName: string | null = null;
// //   private reconnectAttempts: number = 0;
// //   private maxReconnectAttempts: number = 5;
// //   private connectedListeners: Set<Function> = new Set();
// //   private disconnectedListeners: Set<Function> = new Set();
// //   private eventListeners: Map<string, Set<Function>> = new Map();
  
// //   // Track active operations for debugging and error handling
// //   private activeOperations: {
// //     createRoom: boolean;
// //     joinRoom: boolean;
// //     leaveRoom: boolean;
// //     selectCharacter: boolean;
// //     setReady: boolean;
// //   } = {
// //     createRoom: false,
// //     joinRoom: false,
// //     leaveRoom: false,
// //     selectCharacter: false,
// //     setReady: false
// //   };
  
// //   /**
// //    * Initialize the socket connection
// //    */
// //   public connect(): Promise<string> {
// //     return new Promise((resolve, reject) => {
// //       try {
// //         // Don't create a new connection if one exists
// //         if (this.socket?.connected) {
// //           console.log('Socket already connected with ID:', this.socket.id);
// //           if (this.socket.id) {
// //             this.playerId = this.socket.id;
            
// //             // Notify connected listeners
// //             this.connectedListeners.forEach(listener => {
// //               try {
// //                 listener(this.playerId);
// //               } catch (err) {
// //                 console.error('Error in connected listener:', err);
// //               }
// //             });
            
// //             return resolve(this.socket.id);
// //           }
// //         }
        
// //         console.log('Connecting to socket server at:', this.serverUrl);
        
// //         // Initialize socket connection
// //         this.socket = io(this.serverUrl, {
// //           transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
// //           autoConnect: true,
// //           reconnection: true,
// //           reconnectionAttempts: this.maxReconnectAttempts,
// //           reconnectionDelay: 1000,
// //           timeout: 10000 // Increase timeout to 10 seconds
// //         });

// //         // Setup connection event handlers
// //         this.socket.on('connect', () => {
// //           console.log('Socket connected with ID:', this.socket?.id);
// //           this.reconnectAttempts = 0;
// //           if (this.socket?.id) {
// //             this.playerId = this.socket.id;
            
// //             // Notify connected listeners
// //             this.connectedListeners.forEach(listener => {
// //               try {
// //                 listener(this.playerId);
// //               } catch (err) {
// //                 console.error('Error in connected listener:', err);
// //               }
// //             });
// //           }
// //         });

// //         this.socket.on('connection_success', (data: { playerId: string, playerData?: { name?: string } }) => {
// //           console.log('Connection successful:', data);
// //           if (data.playerId) {
// //             this.playerId = data.playerId;
// //             this.playerName = data.playerData?.name || null;
// //             resolve(data.playerId);
// //           } else {
// //             reject(new Error('No player ID received from server'));
// //           }
// //         });

// //         this.socket.on('connect_error', (error) => {
// //           console.error('Socket connection error:', error);
// //           this.reconnectAttempts++;
          
// //           // Notify disconnected listeners
// //           this.disconnectedListeners.forEach(listener => {
// //             try {
// //               listener(error);
// //             } catch (err) {
// //               console.error('Error in disconnected listener:', err);
// //             }
// //           });
          
// //           if (this.reconnectAttempts >= this.maxReconnectAttempts) {
// //             reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
// //           }
// //         });

// //         this.socket.on('disconnect', (reason) => {
// //           console.log('Socket disconnected:', reason);
          
// //           // Notify disconnected listeners
// //           this.disconnectedListeners.forEach(listener => {
// //             try {
// //               listener(reason);
// //             } catch (err) {
// //               console.error('Error in disconnected listener:', err);
// //             }
// //           });
          
// //           // If the server closed the connection, try to reconnect
// //           if (reason === 'io server disconnect' && this.socket) {
// //             this.socket.connect();
// //           }
// //         });
        
// //         // Set a connection timeout
// //         const timeout = setTimeout(() => {
// //           if (!this.socket?.connected) {
// //             reject(new Error('Connection timeout'));
// //           }
// //           clearTimeout(timeout);
// //         }, 10000);

// //       } catch (error) {
// //         console.error('Socket initialization error:', error);
// //         reject(error);
// //       }
// //     });
// //   }

// //   /**
// //    * Disconnect the socket
// //    */
// //   public disconnect(): void {
// //     if (this.socket) {
// //       this.socket.disconnect();
// //       this.socket = null;
// //       this.playerId = null;
      
// //       // Clear all operation flags
// //       this.activeOperations = {
// //         createRoom: false,
// //         joinRoom: false,
// //         leaveRoom: false,
// //         selectCharacter: false,
// //         setReady: false
// //       };
// //     }
// //   }

// //   /**
// //    * Check if socket is connected
// //    */
// //   public isConnected(): boolean {
// //     return this.socket?.connected || false;
// //   }

// //   /**
// //    * Get player ID
// //    */
// //   public getPlayerId(): string | null {
// //     return this.playerId;
// //   }

// //   /**
// //    * Add connected event listener
// //    */
// //   public onConnected(callback: Function): void {
// //     this.connectedListeners.add(callback);
    
// //     // If already connected, call the callback immediately
// //     if (this.socket?.connected && this.playerId) {
// //       try {
// //         callback(this.playerId);
// //       } catch (err) {
// //         console.error('Error in connected listener:', err);
// //       }
// //     }
// //   }

// //   /**
// //    * Add disconnected event listener
// //    */
// //   public onDisconnected(callback: Function): void {
// //     this.disconnectedListeners.add(callback);
// //   }

// //   /**
// //    * Add event listener with proper error handling
// //    */
// //   public on(event: SocketEvent, callback: Function): void {
// //     if (!this.socket) {
// //       console.warn(`Socket not connected. Can't add listener for ${event}`);
      
// //       // Store the event listener for when we connect
// //       if (!this.eventListeners.has(event)) {
// //         this.eventListeners.set(event, new Set());
// //       }
      
// //       this.eventListeners.get(event)?.add(callback);
// //       return;
// //     }
    
// //     // Store the event listener
// //     if (!this.eventListeners.has(event)) {
// //       this.eventListeners.set(event, new Set());
// //     }
    
// //     this.eventListeners.get(event)?.add(callback);
    
// //     // Add socket listener with properly typed rest parameters
// //     this.socket.on(event, (...args: unknown[]) => {
// //       try {
// //         callback(...args);
// //       } catch (error) {
// //         console.error(`Error in ${event} event handler:`, error);
// //       }
// //     });
// //   }

// //   /**
// //    * Remove event listener
// //    */
// //   public off(event: SocketEvent, callback?: Function): void {
// //     // Remove from stored listeners
// //     if (this.eventListeners.has(event)) {
// //       if (callback) {
// //         this.eventListeners.get(event)?.delete(callback);
// //       } else {
// //         this.eventListeners.delete(event);
// //       }
// //     }
    
// //     // Remove from socket if connected
// //     if (this.socket) {
// //       if (callback) {
// //         this.socket.off(event, callback as any);
// //       } else {
// //         this.socket.off(event);
// //       }
// //     }
// //   }

// //   /**
// //    * Create a new room with improved error handling
// //    */
// //   public createRoom(name: string = '', isPrivate: boolean = false): void {
// //     if (!this.socket?.connected) {
// //       console.error('Socket not connected. Cannot create room.');
// //       this.emitCustomEvent('create_room_error', { error: 'Not connected to server' });
// //       return;
// //     }
    
// //     const roomName = name.trim() || `${this.playerName || 'Player'}'s Room`;
    
// //     // Prevent multiple simultaneous room creation attempts
// //     if (this.activeOperations.createRoom) {
// //       console.warn('Room creation already in progress');
// //       return;
// //     }
    
// //     this.activeOperations.createRoom = true;
    
// //     // Create room with timeout handling
// //     this.socket.emit('create_room', { name: roomName, isPrivate });
    
// //     // Set timeout to clear operation flag after reasonable time
// //     setTimeout(() => {
// //       if (this.activeOperations.createRoom) {
// //         console.warn('Room creation timeout - clearing operation flag');
// //         this.activeOperations.createRoom = false;
// //       }
// //     }, 15000);
// //   }

// //   /**
// //    * Join a room with validation and improved error handling
// //    */
// //   public joinRoom(roomId: string): void {
// //     if (!this.socket?.connected) {
// //       console.error('Socket not connected. Cannot join room.');
// //       this.emitCustomEvent('join_room_error', { error: 'Not connected to server' });
// //       return;
// //     }
    
// //     if (!roomId?.trim()) {
// //       this.emitCustomEvent('join_room_error', { error: 'Room ID is required' });
// //       return;
// //     }
    
// //     // Prevent multiple simultaneous join attempts
// //     if (this.activeOperations.joinRoom) {
// //       console.warn('Room join already in progress');
// //       return;
// //     }
    
// //     this.activeOperations.joinRoom = true;
    
// //     // Join room
// //     this.socket.emit('join_room', { roomId: roomId.trim() });
    
// //     // Set timeout to clear operation flag after reasonable time
// //     setTimeout(() => {
// //       if (this.activeOperations.joinRoom) {
// //         console.warn('Room join timeout - clearing operation flag');
// //         this.activeOperations.joinRoom = false;
// //       }
// //     }, 15000);
// //   }

// //   /**
// //    * Leave the current room
// //    */
// //   public leaveRoom(roomId: string): void {
// //     if (!this.socket?.connected || !roomId) {
// //       console.error('Socket not connected or invalid room ID. Cannot leave room.');
// //       return;
// //     }
    
// //     // Prevent multiple simultaneous leave operations
// //     if (this.activeOperations.leaveRoom) {
// //       console.warn('Room leave already in progress');
// //       return;
// //     }
    
// //     this.activeOperations.leaveRoom = true;
    
// //     // Leave room
// //     this.socket.emit('leave_room', { roomId });
    
// //     // Set timeout to clear operation flag after reasonable time
// //     setTimeout(() => {
// //       if (this.activeOperations.leaveRoom) {
// //         console.warn('Room leave timeout - clearing operation flag');
// //         this.activeOperations.leaveRoom = false;
// //       }
// //     }, 5000);
// //   }

// //   /**
// //    * Select a character with validation
// //    */
// //   public selectCharacter(character: Character): void {
// //     if (!this.socket?.connected) {
// //       console.error('Socket not connected. Cannot select character.');
// //       return;
// //     }
    
// //     if (!character) {
// //       console.error('Invalid character data.');
// //       return;
// //     }
    
// //     // Prevent multiple simultaneous character selections
// //     if (this.activeOperations.selectCharacter) {
// //       console.warn('Character selection already in progress');
// //       return;
// //     }
    
// //     this.activeOperations.selectCharacter = true;
    
// //     // Select character
// //     this.socket.emit('select_character', { character });
    
// //     // Set timeout to clear operation flag after reasonable time
// //     setTimeout(() => {
// //       if (this.activeOperations.selectCharacter) {
// //         console.warn('Character selection timeout - clearing operation flag');
// //         this.activeOperations.selectCharacter = false;
// //       }
// //     }, 5000);
// //   }

// //   /**
// //    * Set player ready status
// //    */
// //   public setPlayerReady(isReady: boolean = true): void {
// //     if (!this.socket?.connected) {
// //       console.error('Socket not connected. Cannot set ready status.');
// //       return;
// //     }
    
// //     // Prevent multiple simultaneous ready status changes
// //     if (this.activeOperations.setReady) {
// //       console.warn('Ready status change already in progress');
// //       return;
// //     }
    
// //     this.activeOperations.setReady = true;
    
// //     // Set ready status
// //     this.socket.emit('player_ready', { isReady });
    
// //     // Set timeout to clear operation flag after reasonable time
// //     setTimeout(() => {
// //       if (this.activeOperations.setReady) {
// //         console.warn('Ready status change timeout - clearing operation flag');
// //         this.activeOperations.setReady = false;
// //       }
// //     }, 5000);
// //   }

// //   /**
// //    * Perform a game action
// //    */
// //   public performGameAction(action: GameAction): void {
// //     if (!this.socket?.connected) {
// //       console.error('Socket not connected. Cannot perform game action.');
// //       return;
// //     }
    
// //     this.socket.emit('game_action', action);
// //   }

// //   /**
// //    * Send a chat message
// //    */
// //   public sendChatMessage(roomId: string, message: string): void {
// //     if (!this.socket?.connected || !roomId || !message.trim()) {
// //       console.error('Socket not connected or invalid message/room. Cannot send chat message.');
// //       return;
// //     }
    
// //     this.socket.emit('chat_message', { roomId, message: message.trim() });
// //   }

// //   /**
// //    * Get available rooms with error handling
// //    */
// //   public async getAvailableRooms(): Promise<RoomData[]> {
// //     try {
// //       // Make a regular HTTP request to the API endpoint
// //       const response = await fetch(`${this.serverUrl}/api/rooms`);
      
// //       if (!response.ok) {
// //         throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
// //       }
      
// //       const data = await response.json();
// //       return data.rooms || [];
// //     } catch (error) {
// //       console.error('Error fetching available rooms:', error);
// //       return [];
// //     }
// //   }
  
// //   /**
// //    * Helper method to emit custom events for testing/debugging
// //    */
// //   private emitCustomEvent(eventName: string, data: any): void {
// //     // Create and dispatch a custom event
// //     const event = new CustomEvent(eventName, { detail: data });
// //     window.dispatchEvent(event);
    
// //     // Also log for debugging
// //     console.log(`Emitted custom event: ${eventName}`, data);
// //   }
  
// //   /**
// //    * Reset active operations (useful for cleaning up)
// //    */
// //   public resetActiveOperations(): void {
// //     this.activeOperations = {
// //       createRoom: false,
// //       joinRoom: false,
// //       leaveRoom: false,
// //       selectCharacter: false,
// //       setReady: false
// //     };
// //   }
// // }

// // // Create singleton instance
// // export const socketService = new SocketService();
// // export default socketService;



