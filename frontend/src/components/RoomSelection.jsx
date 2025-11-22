import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/services/backendService";

export default function RoomSelection({ onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidNickname, setInvalidNickname] = useState(false);

  useEffect(() => {
    // Load nickname from localStorage
    const savedNickname = localStorage.getItem("playerNickname");
    if (savedNickname) {
      setNickname(savedNickname);
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleJoin = (roomId, roomName) => {
    if (!nickname.trim()) {
      setInvalidNickname(true);
      toast.error("אנא הזן כינוי");
      return;
    }

    if (nickname.length > 30) {
      toast.error("הכינוי ארוך מדי (מקסימום 30 תווים)");
      return;
    }

    setInvalidNickname(false);
    // Save nickname and room to localStorage for persistence
    localStorage.setItem("playerNickname", nickname.trim());
    localStorage.setItem("lastRoomId", String(roomId));

    setLoading(true);
    onJoinRoom(roomId, nickname.trim(), roomName);
  };

  const handleClearNickname = () => {
    setNickname("");
    setInvalidNickname(false);
    localStorage.removeItem("playerNickname");
    localStorage.removeItem("lastRoomId");
    toast.success("נתוני השחקן נמחקו");
  };

  const getRoomStatus = (room) => {
    if (room.game_status === "waiting") {
      return "ממתין לשחקנים";
    } else if (room.game_status === "choosing") {
      return "משחק פעיל - בוחרים מספרים";
    } else {
      return "משחק פעיל - תוצאות";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1
            className="text-5xl lg:text-6xl font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            משחק התנחש 80%
          </h1>
          <p className="text-3xl text-gray-600 max-w-4xl mx-auto">
            בחר מספר בין 0 ל-100.
          </p>
          <p className="text-3xl text-gray-600 max-w-4xl mx-auto">
            המנצח הוא מי שהכי קרוב לממוצע של סכום המספרים כפול 0.8
          </p>
        </div>

        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl">בחר כינוי להצגה במשחק</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                data-testid="nickname-input"
                type="text"
                placeholder="הכינוי שלך..."
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (invalidNickname && e.target.value.trim()) {
                    setInvalidNickname(false);
                  }
                }}
                maxLength={20}
                className={`text-lg h-12 text-right ${invalidNickname ? 'border-2 border-red-500' : ''}`}
                dir="rtl"
              />
              <Button
                onClick={handleClearNickname}
                variant="outline"
                disabled={!nickname}
                className="h-12 px-4 whitespace-nowrap"
                data-testid="clear-nickname-btn"
              >
                מחק נתוני שחקן
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room, index) => (
            <Card
              key={room.room_id}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300"
              data-testid={`room-card-${room.room_id}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{room.room_name}</span>
                  <div className="flex items-center gap-2 text-base font-normal text-gray-600">
                    <Users size={20} />
                    <span>{room.player_count}</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-right">
                  {getRoomStatus(room)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  data-testid={`join-room-${room.room_id}-btn`}
                  onClick={() => handleJoin(room.room_id, room.room_name)}
                  disabled={loading || room.game_status !== "waiting"}
                  className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {room.game_status !== "waiting" ? "משחק פעיל" : "הצטרף לחדר"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}