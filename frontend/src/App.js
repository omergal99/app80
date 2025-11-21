import { useState } from "react";
import "@/App.css";
import RoomSelection from "@/components/RoomSelection";
import GameRoom from "@/components/GameRoom";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [nickname, setNickname] = useState("");

  const handleJoinRoom = (roomId, playerNickname) => {
    setSelectedRoom(roomId);
    setNickname(playerNickname);
  };

  const handleLeaveRoom = () => {
    setSelectedRoom(null);
    setNickname("");
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