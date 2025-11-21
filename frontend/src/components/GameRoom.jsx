import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Users, CheckCircle2, Circle, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export default function GameRoom({ roomId, nickname, onLeave }) {
  const [roomState, setRoomState] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState([50]);
  const [hasChosen, setHasChosen] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, nickname]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/${roomId}/${encodeURIComponent(nickname)}`);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "error") {
          toast.error(data.message);
          onLeave();
        } else if (data.type === "room_state") {
          setRoomState(data);
          
          // Check if current player has chosen
          const currentPlayer = data.players.find(p => p.nickname === nickname);
          if (currentPlayer) {
            setHasChosen(currentPlayer.has_chosen);
          }
          
          // Reset selection for new round
          if (data.game_status === "choosing" && !currentPlayer?.has_chosen) {
            setSelectedNumber([50]);
            setHasChosen(false);
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("WebSocket disconnected");
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      toast.error("שגיאה בהתחברות לשרת");
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleStartGame = () => {
    sendMessage({ action: "start_game" });
  };

  const handleChooseNumber = () => {
    sendMessage({ action: "choose_number", number: selectedNumber[0] });
    setHasChosen(true);
  };

  const handleNewRound = () => {
    sendMessage({ action: "new_round" });
  };

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">מתחבר...</div>
      </div>
    );
  }

  const currentPlayer = roomState.players.find(p => p.nickname === nickname);
  const isAdmin = currentPlayer?.is_admin;
  const connectedPlayers = roomState.players.filter(p => p.connected);
  const allChosen = connectedPlayers.every(p => p.has_chosen);
  const latestRound = roomState.game_history[roomState.game_history.length - 1];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-4xl font-bold mb-2" 
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              data-testid="room-title"
            >
              חדר {roomId}
            </h1>
            <p className="text-gray-600">סיבוב {roomState.current_round}</p>
          </div>
          <Button 
            data-testid="leave-room-btn"
            onClick={onLeave} 
            variant="outline"
            className="h-11 px-6"
          >
            עזוב חדר
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Players */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  שחקנים ({connectedPlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectedPlayers.map((player) => (
                  <div 
                    key={player.nickname}
                    data-testid={`player-${player.nickname}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {player.is_admin && <Crown size={16} className="text-yellow-500" />}
                      <span className="font-medium">{player.nickname}</span>
                      {player.nickname === nickname && (
                        <Badge variant="secondary" className="text-xs">אתה</Badge>
                      )}
                    </div>
                    {roomState.game_status === "choosing" && (
                      player.has_chosen ? 
                        <CheckCircle2 size={18} className="text-green-500" /> :
                        <Circle size={18} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Panel - Game Area */}
          <div className="lg:col-span-2">
            {roomState.game_status === "waiting" && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>ממתין לתחילת המשחק</CardTitle>
                  <CardDescription>
                    {connectedPlayers.length < 2 
                      ? "נדרשים לפחות 2 שחקנים להתחלת המשחק"
                      : "מוכן להתחיל!"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAdmin && (
                    <Button
                      data-testid="start-game-btn"
                      onClick={handleStartGame}
                      disabled={connectedPlayers.length < 2}
                      className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
                    >
                      התחל משחק
                    </Button>
                  )}
                  {!isAdmin && (
                    <div className="text-center text-gray-600 py-8">
                      ממתין למנהל החדר להתחיל את המשחק...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {roomState.game_status === "choosing" && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>בחר את המספר שלך</CardTitle>
                  <CardDescription>
                    בחר מספר בין 0 ל-100. המנצח הוא מי שהכי קרוב לסכום כפול 0.8
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="text-center">
                    <div 
                      className="text-6xl font-bold mb-6" 
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      data-testid="selected-number-display"
                    >
                      {selectedNumber[0]}
                    </div>
                    <Slider
                      data-testid="number-slider"
                      value={selectedNumber}
                      onValueChange={setSelectedNumber}
                      max={100}
                      step={1}
                      disabled={hasChosen}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                  
                  <Button
                    data-testid="submit-number-btn"
                    onClick={handleChooseNumber}
                    disabled={hasChosen}
                    className="w-full h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700"
                  >
                    {hasChosen ? "נבחר - ממתין לשחקנים אחרים" : "אשר בחירה"}
                  </Button>
                  
                  {!allChosen && (
                    <div className="text-center text-gray-600">
                      {connectedPlayers.filter(p => p.has_chosen).length} / {connectedPlayers.length} שחקנים בחרו
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {roomState.game_status === "results" && latestRound && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy size={24} className="text-yellow-500" />
                    תוצאות סיבוב {latestRound.round_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">המספר היעד</div>
                    <div 
                      className="text-5xl font-bold text-blue-600" 
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      data-testid="target-number"
                    >
                      {latestRound.target_number}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      (סכום: {Object.values(latestRound.players_data).reduce((a, b) => a + b, 0)} × 0.8)
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {Object.entries(latestRound.players_data)
                      .sort(([, a], [, b]) => 
                        Math.abs(a - latestRound.target_number) - Math.abs(b - latestRound.target_number)
                      )
                      .map(([playerName, number]) => {
                        const isWinner = playerName === latestRound.winner;
                        const distance = Math.abs(number - latestRound.target_number);
                        
                        return (
                          <div
                            key={playerName}
                            data-testid={`result-${playerName}`}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                              isWinner 
                                ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isWinner && <Trophy size={20} className="text-yellow-600" />}
                              <span className="font-medium text-lg">{playerName}</span>
                              {isWinner && (
                                <Badge className="bg-yellow-500">מנצח!</Badge>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-2xl font-bold">{number}</div>
                              <div className="text-xs text-gray-500">
                                מרחק: {distance.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {isAdmin && (
                    <Button
                      data-testid="new-round-btn"
                      onClick={handleNewRound}
                      className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
                    >
                      סיבוב חדש
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game History */}
            {roomState.game_history.length > 0 && (
              <Card className="mt-6 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>היסטוריית משחקים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roomState.game_history.slice().reverse().map((round, idx) => (
                      <div 
                        key={roomState.game_history.length - idx}
                        data-testid={`history-round-${round.round_number}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">סיבוב {round.round_number}</span>
                          <ArrowRight size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            יעד: {round.target_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy size={16} className="text-yellow-500" />
                          <span className="font-medium">{round.winner}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}