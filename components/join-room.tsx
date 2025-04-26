"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Copy, Users, RefreshCw, LogIn, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useMultiplayer } from "./multiplayer-context-provider"
import { playSound } from "@/lib/sound-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface JoinRoomProps {
  onBack: () => void
  onRoomJoined: (roomId: string) => void
}

export default function JoinRoom({ onBack, onRoomJoined }: JoinRoomProps) {
  const { 
    playerName, 
    setPlayerName, 
    availableRooms, 
    joinRoom, 
    isConnected, 
    isConnecting,
    connect, 
    currentRoom, 
    connectionError: contextConnectionError 
  } = useMultiplayer()
  
  const [name, setName] = useState(playerName)
  const [roomCode, setRoomCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewingRooms, setViewingRooms] = useState(false)
  const [refreshingRooms, setRefreshingRooms] = useState(false)

  // Reset errors when the room code changes
  useEffect(() => {
    setError(null)
  }, [roomCode])

  // Function to ensure connection is established
  const ensureConnection = useCallback(async () => {
    if (!isConnected && !isConnecting) {
      try {
        setError(null);
        await connect();
        return true;
      } catch (err) {
        console.error("Failed to connect to multiplayer service:", err);
        setError("Failed to connect to multiplayer service. Please try again.");
        return false;
      }
    }
    return isConnected;
  }, [isConnected, isConnecting, connect]);

  // Make sure the connection is established on component mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      ensureConnection();
    }
  }, [isConnected, isConnecting, ensureConnection]);

  // Show connection error from context if available
  useEffect(() => {
    if (contextConnectionError && !error) {
      setError(contextConnectionError);
    }
  }, [contextConnectionError, error]);

  // Set up event listeners for room joining success/failure
  useEffect(() => {
    const handleJoinSuccess = (e: Event) => {
      console.log("Room join success event received");
      setJoining(false);
      
      // If we get to this point, the room should be updated in the context
      if (currentRoom && currentRoom.id) {
        onRoomJoined(currentRoom.id);
      } else {
        // Wait a short moment for the context to update
        setTimeout(() => {
          if (currentRoom && currentRoom.id) {
            onRoomJoined(currentRoom.id);
          } else {
            setError("Failed to get room data after joining");
          }
        }, 300);
      }
    };

    const handleJoinError = (e: CustomEvent) => {
      console.log("Room join error event received:", e.detail);
      setJoining(false);
      setError(e.detail?.error || "Failed to join room");
    };

    // Add event listeners
    window.addEventListener("room_joined", handleJoinSuccess);
    window.addEventListener("join_room_error", handleJoinError as EventListener);

    // Set a timeout for error handling in case no event is received
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (joining) {
      timeoutId = setTimeout(() => {
        console.warn("Room join timeout reached");
        setJoining(false);
        setError("Timed out waiting for server response. Please try again.");
      }, 10000);
    }

    // Cleanup
    return () => {
      window.removeEventListener("room_joined", handleJoinSuccess);
      window.removeEventListener("join_room_error", handleJoinError as EventListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [joining, onRoomJoined, currentRoom]);

  // Watch for room changes to detect joining
  useEffect(() => {
    if (currentRoom && joining) {
      setJoining(false);
      // Make sure we have a valid room ID before proceeding
      if (currentRoom.id) {
        onRoomJoined(currentRoom.id);
      } else {
        setError("Room joined but no valid room ID found");
      }
    }
  }, [currentRoom, joining, onRoomJoined]);

  const handleRefreshRooms = async () => {
    try {
      setRefreshingRooms(true);
      
      // Reconnect to refresh the room list
      if (!isConnected) {
        await ensureConnection();
      }
      
      playSound("button-click.mp3");
      
      // Simulate delay for UX feedback
      setTimeout(() => {
        setRefreshingRooms(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to refresh rooms:", error);
      setRefreshingRooms(false);
    }
  };

  const handleJoinRoom = async () => {
    playSound("button-click.mp3");
    
    // Validate input
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    
    // Ensure we're connected
    const connected = await ensureConnection();
    if (!connected) return;
    
    // Update player name if changed
    if (name !== playerName) {
      setPlayerName(name);
    }
    
    setJoining(true);
    setError(null);
    
    console.log("Attempting to join room:", roomCode.trim());
    
    // Attempt to join the room
    joinRoom(roomCode.trim());
  };

  const handleJoinSpecificRoom = async (roomId: string) => {
    playSound("button-click.mp3");
    
    // Validate input
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Ensure we're connected
    const connected = await ensureConnection();
    if (!connected) return;
    
    // Update player name if changed
    if (name !== playerName) {
      setPlayerName(name);
    }
    
    setJoining(true);
    setError(null);
    setRoomCode(roomId);
    
    console.log("Attempting to join specific room:", roomId);
    
    // Attempt to join the room
    joinRoom(roomId);
  };

  const handleBack = () => {
    playSound("button-click.mp3");
    onBack();
  };

  const toggleViewRooms = () => {
    playSound("button-click.mp3");
    setViewingRooms(!viewingRooms);
    if (!viewingRooms) {
      handleRefreshRooms();
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8"
      >
        <h1 className="text-4xl font-bold text-center text-yellow-400">Join Room</h1>
        <p className="text-center text-gray-300 mt-2">Enter a room code to join a battle</p>
        {isConnecting && (
          <p className="text-center text-blue-400 mt-2">
            <RefreshCw className="inline-block mr-1 animate-spin" size={16} />
            Connecting to multiplayer service...
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 bg-black/80 p-8 rounded-lg w-full max-w-md mb-8"
      >
        {!joining ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Your Display Name</label>
              <Input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter your name"
                disabled={joining || isConnecting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Room Code</label>
              <Input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white uppercase tracking-widest font-mono"
                placeholder="Enter room code"
                maxLength={6}
                disabled={joining || isConnecting}
              />
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <Button
              onClick={handleJoinRoom}
              disabled={!name.trim() || !roomCode.trim() || joining || isConnecting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Join Battle Room
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-4 text-sm text-gray-400">or</span>
              </div>
            </div>

            <Button
              onClick={toggleViewRooms}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white"
              disabled={isConnecting}
            >
              <Search className="mr-2 h-5 w-5" />
              {viewingRooms ? "Hide Available Rooms" : "Browse Available Rooms"}
            </Button>

            {viewingRooms && (
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-200">Available Rooms</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefreshRooms}
                    disabled={refreshingRooms || isConnecting}
                    className="text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshingRooms ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                {availableRooms.length > 0 ? (
                  availableRooms
                    .filter(room => room.status === "waiting" && room.players.length < (room.maxPlayers || 2))
                    .map(room => (
                      <Card key={room.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-yellow-400">{room.name || (room.hostName ? `${room.hostName}'s Room` : `Room ${room.id}`)}</h3>
                              <p className="text-xs text-gray-400">Room Code: {room.id}</p>
                            </div>
                            <Button 
                              onClick={() => handleJoinSpecificRoom(room.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                              size="sm"
                              disabled={joining || isConnecting}
                            >
                              Join
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                    <p>No available rooms found</p>
                    <p className="text-sm mt-1">Create your own room or try again later</p>
                  </div>
                )}
                
                {window.location.hostname === 'localhost' && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Development options:</p>
                    <Button
                      onClick={() => window.location.href = window.location.pathname + '?mock=true'}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-xs py-1"
                    >
                      Use Mock Mode (No Server Required)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-yellow-400 animate-spin" />
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Joining Room...</h2>
            <p className="text-gray-300">Connecting to {roomCode}</p>
          </div>
        )}
      </motion.div>

      {!joining && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={handleBack}
            className="bg-gray-800/90 hover:bg-gray-700/90 text-white px-6 py-2 rounded-full"
            disabled={joining || isConnecting}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </motion.div>
      )}
    </div>
  )
}








// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { ArrowLeft, Copy, Users, RefreshCw, LogIn, Search } from "lucide-react"
// import { motion } from "framer-motion"
// import { useMultiplayer } from "./multiplayer-context-provider"
// import { playSound } from "@/lib/sound-utils"
// import { Card, CardContent } from "@/components/ui/card"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { AlertCircle } from "lucide-react"

// interface JoinRoomProps {
//   onBack: () => void
//   onRoomJoined: (roomId: string) => void
// }

// export default function JoinRoom({ onBack, onRoomJoined }: JoinRoomProps) {
//   const { playerName, setPlayerName, availableRooms, joinRoom, isConnected, connect, currentRoom } = useMultiplayer()
//   const [name, setName] = useState(playerName)
//   const [roomCode, setRoomCode] = useState("")
//   const [joining, setJoining] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [viewingRooms, setViewingRooms] = useState(false)
//   const [refreshingRooms, setRefreshingRooms] = useState(false)

//   // Reset errors when the room code changes
//   useEffect(() => {
//     setError(null)
//   }, [roomCode])

//   // Make sure the connection is established
//   useEffect(() => {
//     if (!isConnected) {
//       connect().catch(err => {
//         console.error("Failed to connect to multiplayer service:", err);
//         setError("Failed to connect to multiplayer service. Please try again.");
//       });
//     }
//   }, [isConnected, connect]);

//   // Set up event listeners for room joining success/failure
//   useEffect(() => {
//     const handleJoinSuccess = (e: Event) => {
//       console.log("Room join success event received");
//       setJoining(false);
      
//       // If we get to this point, the room should be updated in the context
//       if (currentRoom && currentRoom.id) {
//         onRoomJoined(currentRoom.id);
//       } else {
//         // Wait a short moment for the context to update
//         setTimeout(() => {
//           if (currentRoom && currentRoom.id) {
//             onRoomJoined(currentRoom.id);
//           } else {
//             setError("Failed to get room data after joining");
//           }
//         }, 300);
//       }
//     };

//     const handleJoinError = (e: CustomEvent) => {
//       console.log("Room join error event received:", e.detail);
//       setJoining(false);
//       setError(e.detail?.error || "Failed to join room");
//     };

//     // Add event listeners
//     window.addEventListener("room_joined", handleJoinSuccess);
//     window.addEventListener("join_room_error", handleJoinError as EventListener);

//     // Cleanup
//     return () => {
//       window.removeEventListener("room_joined", handleJoinSuccess);
//       window.removeEventListener("join_room_error", handleJoinError as EventListener);
//     };
//   }, [onRoomJoined, currentRoom]);

//   // Watch for room changes to detect joining
//   useEffect(() => {
//     if (currentRoom && joining) {
//       setJoining(false);
//       // Make sure we have a valid room ID before proceeding
//       if (currentRoom.id) {
//         onRoomJoined(currentRoom.id);
//       } else {
//         setError("Room joined but no valid room ID found");
//       }
//     }
//   }, [currentRoom, joining, onRoomJoined]);

//   const handleRefreshRooms = async () => {
//     try {
//       setRefreshingRooms(true);
      
//       // Reconnect to refresh the room list
//       if (!isConnected) {
//         await connect();
//       }
      
//       playSound("button-click.mp3");
      
//       // Simulate delay for UX feedback
//       setTimeout(() => {
//         setRefreshingRooms(false);
//       }, 1000);
//     } catch (error) {
//       console.error("Failed to refresh rooms:", error);
//       setRefreshingRooms(false);
//     }
//   };

//   const handleJoinRoom = () => {
//     playSound("button-click.mp3");
    
//     // Validate input
//     if (!name.trim()) {
//       setError("Please enter your name");
//       return;
//     }
    
//     if (!roomCode.trim()) {
//       setError("Please enter a room code");
//       return;
//     }
    
//     // Update player name if changed
//     if (name !== playerName) {
//       setPlayerName(name);
//     }
    
//     setJoining(true);
//     setError(null);
    
//     console.log("Attempting to join room:", roomCode.trim());
    
//     // Attempt to join the room
//     joinRoom(roomCode.trim());
    
//     // Set a timeout to handle cases where no event is received
//     const timeout = setTimeout(() => {
//       if (joining) {
//         setJoining(false);
//         setError("Timed out waiting for server response. Please try again.");
//       }
//     }, 10000);
    
//     return () => clearTimeout(timeout);
//   };

//   const handleJoinSpecificRoom = (roomId: string) => {
//     playSound("button-click.mp3");
    
//     // Validate input
//     if (!name.trim()) {
//       setError("Please enter your name");
//       return;
//     }
    
//     // Update player name if changed
//     if (name !== playerName) {
//       setPlayerName(name);
//     }
    
//     setJoining(true);
//     setError(null);
//     setRoomCode(roomId);
    
//     console.log("Attempting to join specific room:", roomId);
    
//     // Attempt to join the room
//     joinRoom(roomId);
    
//     // Set a timeout to handle cases where no event is received
//     const timeout = setTimeout(() => {
//       if (joining) {
//         setJoining(false);
//         setError("Timed out waiting for server response. Please try again.");
//       }
//     }, 10000);
    
//     return () => clearTimeout(timeout);
//   };

//   const handleBack = () => {
//     playSound("button-click.mp3");
//     onBack();
//   };

//   const toggleViewRooms = () => {
//     playSound("button-click.mp3");
//     setViewingRooms(!viewingRooms);
//     if (!viewingRooms) {
//       handleRefreshRooms();
//     }
//   };

//   return (
//     <div
//       className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
//       style={{
//         backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Apr%2025%2C%202025%2C%2005_52_37%20PM-6IHp4UAeAu7379o8WR2JRyiAuYRvjo.png)`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundAttachment: "fixed",
//       }}
//     >
//       <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="relative z-10 mb-8"
//       >
//         <h1 className="text-4xl font-bold text-center text-yellow-400">Join Room</h1>
//         <p className="text-center text-gray-300 mt-2">Enter a room code to join a battle</p>
//       </motion.div>

//       <motion.div
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.5, delay: 0.2 }}
//         className="relative z-10 bg-black/80 p-8 rounded-lg w-full max-w-md mb-8"
//       >
//         {!joining ? (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-200">Your Display Name</label>
//               <Input 
//                 type="text" 
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="bg-gray-800 border-gray-700 text-white"
//                 placeholder="Enter your name"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-200">Room Code</label>
//               <Input 
//                 type="text" 
//                 value={roomCode}
//                 onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
//                 className="bg-gray-800 border-gray-700 text-white uppercase tracking-widest font-mono"
//                 placeholder="Enter room code"
//                 maxLength={6}
//               />
//               {error && (
//                 <Alert variant="destructive" className="mt-2">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertTitle>Error</AlertTitle>
//                   <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//               )}
//             </div>
            
//             <Button
//               onClick={handleJoinRoom}
//               disabled={!name.trim() || !roomCode.trim()}
//               className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3"
//             >
//               <LogIn className="mr-2 h-5 w-5" />
//               Join Battle Room
//             </Button>

//             <div className="relative py-4">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-700"></div>
//               </div>
//               <div className="relative flex justify-center">
//                 <span className="bg-black px-4 text-sm text-gray-400">or</span>
//               </div>
//             </div>

//             <Button
//               onClick={toggleViewRooms}
//               className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white"
//             >
//               <Search className="mr-2 h-5 w-5" />
//               {viewingRooms ? "Hide Available Rooms" : "Browse Available Rooms"}
//             </Button>

//             {viewingRooms && (
//               <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
//                 <div className="flex justify-between items-center mb-2">
//                   <h3 className="text-sm font-medium text-gray-200">Available Rooms</h3>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={handleRefreshRooms}
//                     disabled={refreshingRooms}
//                     className="text-xs"
//                   >
//                     <RefreshCw className={`h-3 w-3 mr-1 ${refreshingRooms ? 'animate-spin' : ''}`} />
//                     Refresh
//                   </Button>
//                 </div>
                
//                 {availableRooms.length > 0 ? (
//                   availableRooms
//                     .filter(room => room.status === "waiting" && room.players.length < (room.maxPlayers || 2))
//                     .map(room => (
//                       <Card key={room.id} className="bg-gray-800 border-gray-700">
//                         <CardContent className="p-4">
//                           <div className="flex justify-between items-center">
//                             <div>
//                               <h3 className="font-bold text-yellow-400">{room.name || (room.hostName ? `${room.hostName}'s Room` : `Room ${room.id}`)}</h3>
//                               <p className="text-xs text-gray-400">Room Code: {room.id}</p>
//                             </div>
//                             <Button 
//                               onClick={() => handleJoinSpecificRoom(room.id)}
//                               className="bg-purple-600 hover:bg-purple-700"
//                               size="sm"
//                             >
//                               Join
//                             </Button>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))
//                 ) : (
//                   <div className="text-center py-4 text-gray-400">
//                     <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-500" />
//                     <p>No available rooms found</p>
//                     <p className="text-sm mt-1">Create your own room or try again later</p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="text-center py-6">
//             <RefreshCw className="h-12 w-12 mx-auto mb-4 text-yellow-400 animate-spin" />
//             <h2 className="text-xl font-bold text-yellow-400 mb-2">Joining Room...</h2>
//             <p className="text-gray-300">Connecting to {roomCode}</p>
//           </div>
//         )}
//       </motion.div>

//       {!joining && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.4 }}
//         >
//           <Button
//             onClick={handleBack}
//             className="bg-gray-800/90 hover:bg-gray-700/90 text-white px-6 py-2 rounded-full"
//           >
//             <ArrowLeft className="mr-2 h-5 w-5" />
//             Back
//           </Button>
//         </motion.div>
//       )}
//     </div>
//   )
// }


