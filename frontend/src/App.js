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
    
    if (lastRoomId && savedNickname) {
      setSelectedRoomId(parseInt(lastRoomId, 10));
      setNickname(savedNickname);
    }
  }, []);

  const handleJoinRoom = (roomId, playerNickname, roomName) => {
    setSelectedRoomId(roomId);
    setRoomDetails({ room_id: roomId, room_name: roomName });
    setNickname(playerNickname);
  };

  const handleLeaveRoom = () => {
    // Clear room ID but keep nickname in localStorage
    localStorage.removeItem("lastRoomId");
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