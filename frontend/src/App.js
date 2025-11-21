import { useState, useEffect } from "react";
import "@/App.css";
import RoomSelection from "@/components/RoomSelection";
import GameRoom from "@/components/GameRoom";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    // Check if user was in a room before refresh
    const lastRoomId = localStorage.getItem("lastRoomId");
    const savedNickname = localStorage.getItem("playerNickname");
    
    if (lastRoomId && savedNickname) {
      setSelectedRoom(parseInt(lastRoomId, 10));
      setNickname(savedNickname);
    }
  }, []);

  const handleJoinRoom = (roomId, playerNickname) => {
    setSelectedRoom(roomId);
    setNickname(playerNickname);
  };

  const handleLeaveRoom = () => {
    // Clear room ID but keep nickname in localStorage
    localStorage.removeItem("lastRoomId");
    setSelectedRoom(null);
  };

  return (
    <div className="App">
      {!selectedRoom ? (
        <RoomSelection onJoinRoom={handleJoinRoom} />
      ) : (
        <GameRoom 
          roomId={selectedRoom} 
          nickname={nickname} 
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;