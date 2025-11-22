import { useState, useEffect } from "react";
import "@/App.css";
import RoomSelection from "@/components/RoomSelection";
import GameRoom from "@/components/GameRoom";

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    // Check if user was in a room before refresh
    const lastRoomId = localStorage.getItem("lastRoomId");
    const savedNickname = localStorage.getItem("playerNickname");
    const savedRoomDetails = localStorage.getItem("lastRoomDetails");
    
    if (lastRoomId && savedNickname) {
      setSelectedRoomId(parseInt(lastRoomId, 10));
      setNickname(savedNickname);
      
      // Try to restore room details if available
      if (savedRoomDetails) {
        try {
          setRoomDetails(JSON.parse(savedRoomDetails));
        } catch (e) {
          console.error("Failed to parse saved room details:", e);
        }
      }
    }
  }, []);

  const handleJoinRoom = (roomId, playerNickname, roomName) => {
    setSelectedRoomId(roomId);
    const details = { room_id: roomId, room_name: roomName };
    setRoomDetails(details);
    setNickname(playerNickname);
    
    // Save to localStorage so we can restore after refresh
    localStorage.setItem("lastRoomId", roomId.toString());
    localStorage.setItem("playerNickname", playerNickname);
    localStorage.setItem("lastRoomDetails", JSON.stringify(details));
  };

  const handleLeaveRoom = () => {
    // Clear all room-related data from localStorage
    localStorage.removeItem("lastRoomId");
    localStorage.removeItem("lastRoomDetails");
    setSelectedRoomId(null);
    setRoomDetails(null);
  };

  return (
    <div className="App">
      {!selectedRoomId ? (
        <RoomSelection onJoinRoom={handleJoinRoom} />
      ) : (
        <GameRoom 
          roomId={selectedRoomId}
          roomName={roomDetails?.room_name}
          nickname={nickname} 
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;