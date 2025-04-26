"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Copy, Users, RefreshCw, LogIn } from "lucide-react"
import { motion } from "framer-motion"
import { useMultiplayer } from "./multiplayer-context-provider"
import { playSound } from "@/lib/sound-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CreateRoomProps {
  onBack: () => void
  onRoomCreated: (roomId: string) => void
}

export default function CreateRoom({ onBack, onRoomCreated }: CreateRoomProps) {
  const { playerName, setPlayerName, createRoom, isConnected, connect, currentRoom } = useMultiplayer()
  const [name, setName] = useState(playerName)
  const [roomName, setRoomName] = useState("")
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  
  // Function to ensure connection is established
  const ensureConnection = useCallback(async () => {
    if (!isConnected) {
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
    return true;
  }, [isConnected, connect]);

  // Make sure the connection is established on component mount
  useEffect(() => {
    ensureConnection();
  }, [ensureConnection]);

  // Handle room creation success
  const handleRoomCreated = useCallback((event: Event) => {
    try {
      const e = event as CustomEvent;
      console.log("Room created successfully:", e.detail);
      
      if (!e.detail?.room?.id) {
        console.error("No room ID received in room_created event");
        setError("Failed to create room. No room ID received.");
        setCreating(false);
        return;
      }
      
      const roomId = e.detail.room.id;
      console.log(`Room created with ID: ${roomId}`);
      
      setCreating(false);
      setWaiting(true);
      
      // Proceed to the room with a short delay
      setTimeout(() => {
        onRoomCreated(roomId);
      }, 500);
    } catch (err) {
      console.error("Error handling room creation success:", err);
      setCreating(false);
      setError("An error occurred while processing the room creation response.");
    }
  }, [onRoomCreated]);

  // Handle room creation error
  const handleCreateError = useCallback((event: Event) => {
    try {
      const e = event as CustomEvent;
      console.error("Failed to create room:", e.detail);
      setCreating(false);
      setError(e.detail?.error || "Failed to create room. Please try again.");
    } catch (err) {
      console.error("Error handling room creation error:", err);
      setCreating(false);
      setError("An error occurred while processing the room creation error.");
    }
  }, []);

  // Listen for room creation success/failure events
  useEffect(() => {
    window.addEventListener("room_created", handleRoomCreated);
    window.addEventListener("create_room_error", handleCreateError as EventListener);

    // Set a timeout for error handling in case no event is received
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (creating) {
      timeoutId = setTimeout(() => {
        console.warn("Room creation timeout reached");
        setCreating(false);
        
        // Increment attempt count
        setAttemptCount(prev => prev + 1);
        
        // After multiple attempts, suggest a different approach
        if (attemptCount >= 2) {
          setError(
            "Still having trouble creating a room. This might be due to server issues or network problems. " +
            "Try refreshing the page and ensuring your backend server is running properly."
          );
        } else {
          setError("Timed out while creating room. Please try again.");
        }
      }, 10000);
    }

    // Cleanup
    return () => {
      window.removeEventListener("room_created", handleRoomCreated);
      window.removeEventListener("create_room_error", handleCreateError as EventListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [creating, handleRoomCreated, handleCreateError, attemptCount]);

  // Monitor currentRoom changes to detect when a room is created
  useEffect(() => {
    if (currentRoom && creating) {
      console.log("Room created detected via currentRoom update:", currentRoom);
      
      // Validate room has ID
      if (!currentRoom.id) {
        console.error("Current room has no ID");
        setError("Room created but no valid ID received.");
        setCreating(false);
        return;
      }
      
      setCreating(false);
      setWaiting(true);
      
      // Proceed to the room
      onRoomCreated(currentRoom.id);
    }
  }, [currentRoom, creating, onRoomCreated]);

  const handleCreateRoom = async () => {
    playSound("button-click.mp3");
    
    // Validate input
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Ensure we're connected
    const connected = await ensureConnection();
    if (!connected) return;
    
    setCreating(true);
    setError(null);
    
    // Update player name if changed
    if (name !== playerName) {
      setPlayerName(name);
    }
    
    try {
      console.log("Creating room with name:", roomName.trim() || `${name}'s Room`);
      createRoom(roomName.trim() || `${name}'s Room`);
    } catch (error: any) {
      console.error("Error in createRoom:", error);
      setError(error.message || "Failed to create room. Please try again.");
      setCreating(false);
    }
  };

  const handleCopyRoomId = () => {
    if (!currentRoom || !currentRoom.id) return;
    
    playSound("button-click.mp3");
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    if (!currentRoom || !currentRoom.id) return;
    
    playSound("button-click.mp3");
    onRoomCreated(currentRoom.id);
  };

  const handleBack = () => {
    playSound("button-click.mp3");
    onBack();
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
        <h1 className="text-4xl font-bold text-center text-yellow-400">Create Room</h1>
        <p className="text-center text-gray-300 mt-2">Set up a multiplayer battle room</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 bg-black/80 p-8 rounded-lg w-full max-w-md mb-8"
      >
        {(!currentRoom || !currentRoom.id) ? (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Your Display Name</label>
              <Input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter your name"
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Room Name (Optional)</label>
              <Input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter room name or leave blank for default"
                disabled={creating}
              />
            </div>
            
            <Button
              onClick={handleCreateRoom}
              disabled={!name.trim() || creating}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-bold py-3"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-t-black border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Battle Room"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-1">Room Created!</h2>
              <p className="text-gray-300">Share this code with your opponent:</p>
            </div>
            
            <div className="relative">
              <div className="flex items-center bg-gray-800 rounded-lg p-4 border border-yellow-600">
                <div className="text-2xl font-mono font-bold text-yellow-400 tracking-widest mx-auto">
                  {currentRoom.id}
                </div>
              </div>
              <Button
                onClick={handleCopyRoomId}
                className="absolute right-1 top-1 h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600"
                title="Copy room code"
              >
                {copied ? (
                  <span className="text-green-400 text-xs">Copied!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Button
              onClick={handleEnterRoom}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Enter Room
            </Button>
            
            {waiting && (
              <div className="bg-gray-800/80 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <RefreshCw className="h-5 w-5 text-yellow-400 animate-spin mr-2" />
                  <span className="text-yellow-400">Waiting for opponent...</span>
                </div>
                <p className="text-sm text-gray-400">The battle will start automatically when someone joins</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {!waiting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={handleBack}
            className="bg-gray-800/90 hover:bg-gray-700/90 text-white px-6 py-2 rounded-full"
            disabled={creating}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </motion.div>
      )}
    </div>
  )
}



