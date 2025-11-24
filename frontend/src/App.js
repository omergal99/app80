import { useState, useEffect } from "react";
import "@/App.css";
import RoomSelection from "@/components/RoomSelection";
import GameRoom from "@/components/GameRoom";

function App() {
  // Initialize from localStorage immediately to prevent showing RoomSelection on refresh
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    const lastRoomId = localStorage.getItem("lastRoomId");
    return lastRoomId ? parseInt(lastRoomId, 10) : null;
  });
  
  const [roomDetails, setRoomDetails] = useState(() => {
    const savedRoomDetails = localStorage.getItem("lastRoomDetails");
    if (savedRoomDetails) {
      try {
        return JSON.parse(savedRoomDetails);
      } catch (e) {
        console.error("Failed to parse saved room details:", e);
        return null;
      }
    }
    return null;
  });

  // Load complete player object from localStorage (contains playerId and nickname)
  const [playerData, setPlayerData] = useState(() => {
    const savedPlayer = localStorage.getItem("playerData");
    if (savedPlayer) {
      try {
        return JSON.parse(savedPlayer);
      } catch (e) {
        console.error("Failed to parse saved player data:", e);
        return null;
      }
    }
    return null;
  });

  const handleJoinRoom = (roomId, playerNickname, roomName) => {
    setSelectedRoomId(roomId);
    const details = { room_id: roomId, room_name: roomName };
    setRoomDetails(details);
    
    // Save player data (nickname, will be paired with playerId from WebSocket)
    const player = { nickname: playerNickname, playerId: null };
    setPlayerData(player);
    
    // Save to localStorage so we can restore after refresh
    localStorage.setItem("lastRoomId", roomId.toString());
    localStorage.setItem("playerData", JSON.stringify(player));
    localStorage.setItem("lastRoomDetails", JSON.stringify(details));
  };

  const handleLeaveRoom = () => {
    // Clear all room-related data from localStorage
    localStorage.removeItem("lastRoomId");
    localStorage.removeItem("lastRoomDetails");
    localStorage.removeItem("playerData");
    localStorage.removeItem("playerId");
    setSelectedRoomId(null);
    setRoomDetails(null);
    setPlayerData(null);
  };

  const updatePlayerData = (updatedPlayer) => {
    setPlayerData(updatedPlayer);
    localStorage.setItem("playerData", JSON.stringify(updatedPlayer));
  };

  return (
    <div className="App">
      {!selectedRoomId || !playerData ? (
        <RoomSelection onJoinRoom={handleJoinRoom} />
      ) : (
        <GameRoom 
          roomId={selectedRoomId}
          roomName={roomDetails?.room_name}
          playerData={playerData}
          onUpdatePlayerData={updatePlayerData}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;