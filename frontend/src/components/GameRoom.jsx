import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Users, CheckCircle2, Circle, Trophy, ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import GameResultsModal from "./GameResultsModal";
import ResultsDisplay from "./ResultsDisplay";
import { WS_URL } from "@/services/backendService";

export default function GameRoom({ roomId, roomName, nickname, onLeave }) {
  const [roomState, setRoomState] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState([50]);
  const [inputNumber, setInputNumber] = useState("50");
  const [hasChosen, setHasChosen] = useState(false);
  const [hideNumber, setHideNumber] = useState(false);
  const [hideNumberAfterChoosing, setHideNumberAfterChoosing] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [multiplierInput, setMultiplierInput] = useState("0.8");
  const [previousRound, setPreviousRound] = useState(null);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);
  const [previousGameStatus, setPreviousGameStatus] = useState(null);
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
          const currentPlayer = data.players.find(p => p.nickname === nickname);
          if (currentPlayer) {
            setHasChosen(currentPlayer.has_chosen);
          }

          // Only reset selection when transitioning from waiting to choosing status
          // This happens at the START of the game, not on subsequent rounds
          if (previousGameStatus === "waiting" && data.game_status === "choosing") {
            setSelectedNumber([50]);
            setInputNumber("50");
            setHasChosen(false);
            setHideNumber(false);
            setHideNumberAfterChoosing(false);
          }

          // Apply hideNumberAfterChoosing effect when player chooses
          if (!previousGameStatus || previousGameStatus === "choosing") {
            if (currentPlayer?.has_chosen && hideNumberAfterChoosing) {
              setHideNumber(true);
            }
          }

          setPreviousGameStatus(data.game_status);
          setPreviousRound(data.current_round);
          setRoomState(data);

          // Sync multiplier input with room state
          if (data.multiplier) {
            setMultiplierInput(data.multiplier.toString());
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

  const handleSliderChange = (value) => {
    setSelectedNumber(value);
    setInputNumber(String(value[0]));
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputNumber(value);

    // Update slider if valid number
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setSelectedNumber([num]);
    }
  };

  const handleStartGame = () => {
    setHideNumber(false);
    sendMessage({ action: "start_game" });
  };

  const handleChooseNumber = () => {
    sendMessage({ action: "choose_number", number: selectedNumber[0] });
    setHasChosen(true);
  };

  const handleNewRound = () => {
    setHideNumber(false);
    sendMessage({ action: "new_round" });
  };

  const handleStopGame = () => {
    setHideNumber(false);
    sendMessage({ action: "stop_game" });
  };

  const handleClearHistory = () => {
    if (window.confirm("האם אתה בטוח שתרצה למחוק את ההיסטוריה?")) {
      sendMessage({ action: "clear_history" });
    }
  };

  const handleSetMultiplier = () => {
    const multiplier = parseFloat(multiplierInput);
    if (!isNaN(multiplier) && multiplier >= 0.1 && multiplier <= 1.9) {
      sendMessage({ action: "set_multiplier", multiplier });
      toast.success(`מכפיל עדכן ל-${multiplier}`);
    } else {
      toast.error("מכפיל חייב להיות בין 0.1 ל-1.9");
    }
  };

  const handleRemovePlayer = (playerNickname) => {
    if (playerNickname === nickname) {
      toast.error("לא ניתן להסיר את עצמך מהסיבוק");
      return;
    }
    if (window.confirm(`האם אתה בטוח שתרצה להסיר את ${playerNickname} מהסיבוב?`)) {
      sendMessage({ action: "remove_player", target_nickname: playerNickname });
      toast.info(`${playerNickname} הוסר מהסיבוב`);
    }
  };

  const handleForceFinish = () => {
    if (window.confirm("האם אתה בטוח שתרצה לסיים את הסיבוב? שחקנים שלא בחרו לא ישתתפו.")) {
      sendMessage({ action: "force_finish_round" });
    }
  };

  const handleExportHistory = () => {
    if (!roomState || !roomState.game_history || roomState.game_history.length === 0) {
      toast.error("אין היסטוריה לייצא");
      return;
    }

    const historyData = {
      roomId: roomState.room_id,
      exportDate: new Date().toISOString(),
      totalRounds: roomState.game_history.length,
      history: roomState.game_history
    };

    const dataStr = JSON.stringify(historyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `game_history_room_${roomState.room_id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("ההיסטוריה ייוצאה בהצלחה");
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
        {/* History Round Modal */}
        <GameResultsModal
          round={selectedHistoryRound}
          nickname={nickname}
          onClose={() => setSelectedHistoryRound(null)}
        />

        {/* Header */}
        <div className="flex items-center justify-between items-baseline mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              data-testid="room-title"
            >
              {roomName}
            </h1>
            <p className="text-2xl text-gray-700 flex gap-8">
              <span>סיבוב {roomState.current_round}</span>
              <span>שם הילד/ה: {nickname}</span>
            </p>
          </div>
          <Button
            data-testid="leave-room-btn"
            onClick={() => {
              if (wsRef.current) {
                wsRef.current.close();
              }
              onLeave();
            }}
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
              <CardHeader
                className="cursor-pointer"
                onClick={() => setPlayersExpanded(!playersExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    שחקנים ({connectedPlayers.length})
                  </CardTitle>
                  {playersExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </CardHeader>
              {playersExpanded && (
                <CardContent className="space-y-3">
                  {connectedPlayers.map((player) => (
                    <div
                      key={player.nickname}
                      data-testid={`player-${player.nickname}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${player.nickname === nickname
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {player.is_admin && <Crown size={16} className="text-yellow-500" />}
                        <span className={`font-medium ${player.nickname === nickname ? 'text-blue-700' : ''}`}>{player.nickname}</span>
                        {player.nickname === nickname && (
                          <Badge className="bg-blue-600 text-white text-xs">אתה</Badge>
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
              )}
            </Card>
          </div>

          {/* Main Panel - Game Area */}
          <div className="lg:col-span-2">
            {roomState.game_status === "waiting" && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>ממתין לתחילת המשחק</CardTitle>
                  <CardDescription>
                    {connectedPlayers.length < 1
                      ? "נדרשים לפחות שחקן 1 להתחלת המשחק"
                      : "מוכן להתחיל!"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAdmin && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="block text-sm font-medium mb-3 text-right"
                        data-testid="multiplier-label">
                          הגדר מכפיל למשחק (0.1 - 1.9)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0.1"
                            max="1.9"
                            step="0.1"
                            value={multiplierInput}
                            onChange={(e) => setMultiplierInput(e.target.value)}
                            className="text-center h-10"
                            placeholder="0.8"
                            data-testid="multiplier-input"
                          />
                          <Button
                            onClick={handleSetMultiplier}
                            variant="outline"
                            className="px-4"
                          >
                            עדכן
                          </Button>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          היעד יחושב כ: (ממוצע סכום המספרים) × {roomState.multiplier}
                        </div>
                      </div>
                      <Button
                        data-testid="start-game-btn"
                        onClick={handleStartGame}
                        disabled={connectedPlayers.length < 1}
                        className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
                      >
                        התחל משחק
                      </Button>
                    </>
                  )}
                  {!isAdmin && (
                    <div className="text-center text-gray-600 py-8">
                      ממתין למנהל החדר להתחיל את המשחק...
                      <div className="text-sm mt-2">מכפיל: {roomState.multiplier}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {roomState.game_status === "choosing" && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>בחר את המספר שלך</CardTitle>
                    <CardDescription>
                      בחר מספר בין 0 ל-100. המנצח הוא מי שהכי קרוב לממוצע של סכום המספרים כפול {roomState.multiplier}
                    </CardDescription>
                  </div>
                  {/* Always Show Hide Controls */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setHideNumber(!hideNumber)}
                      variant={hideNumber ? "default" : "outline"}
                      style={{width: '105px'}}
                      size="sm"
                      className="gap-2 whitespace-nowrap"
                      data-testid="toggle-hide-number-btn"
                    >
                      {hideNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                      {hideNumber ? "ללא חשיפה" : "חשיפה גדולה"}
                    </Button>
                    <Button
                      onClick={() => setHideNumberAfterChoosing(!hideNumberAfterChoosing)}
                      variant={hideNumberAfterChoosing ? "default" : "outline"}
                      size="sm"
                      style={{width: '125px'}}
                      className="whitespace-nowrap"
                      data-testid="toggle-hide-after-choosing-btn"
                    >
                      {hideNumberAfterChoosing ? "✓ " : "○ "} הסתר לאחר בחירה
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Large Number Display with fixed width container */}
                  <div className="flex items-center justify-center">
                    <div className="w-48 text-center">
                      <div
                        className="text-7xl font-black h-24 flex items-center justify-center"
                        style={{ fontFamily: "'Courier New', monospace" }}
                        data-testid="selected-number-display"
                      >
                        {hideNumber || (hideNumberAfterChoosing && hasChosen) ? "****" : selectedNumber[0]}
                      </div>
                    </div>
                  </div>

                  {/* Slider and Input */}
                  <div className="text-center">
                    <Slider
                      data-testid="number-slider"
                      value={selectedNumber}
                      onValueChange={handleSliderChange}
                      max={100}
                      step={1}
                      disabled={hasChosen}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mb-6">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                  </div>

                  {/* Input with inline label */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex gap-3 items-center">
                      <label className="text-sm font-medium text-right whitespace-nowrap">
                        או הזן ישירות:
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={hideNumber || (hideNumberAfterChoosing && hasChosen) ? "" : inputNumber}
                        onChange={handleInputChange}
                        disabled={hasChosen}
                        className="text-lg text-center h-10 flex-1"
                        placeholder="0-100"
                      />
                    </div>
                  </div>

                  {/* Submit Button and Player Count on Same Line */}
                  <div className="space-y-2">
                    <Button
                      data-testid="submit-number-btn"
                      onClick={handleChooseNumber}
                      disabled={hasChosen}
                      className="w-full h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700"
                    >
                      {hasChosen ? `אישרת: ${hideNumberAfterChoosing ? "****" : selectedNumber[0]} - ממתין לשחקנים אחרים` : `אשר בחירה: ${selectedNumber[0]}`}
                    </Button>
                    {!allChosen && (
                      <div className="text-center text-sm text-gray-600">
                        {connectedPlayers.filter(p => p.has_chosen).length} / {connectedPlayers.length} שחקנים בחרו
                      </div>
                    )}
                  </div>

                  {!allChosen && (
                    <div>
                      {isAdmin && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-3">
                          <div className="text-sm font-medium text-orange-900">אפשרויות מנהל</div>
                          <Button
                            data-testid="force-finish-btn"
                            onClick={handleForceFinish}
                            variant="outline"
                            className="w-full h-10 text-sm border-orange-300 hover:bg-orange-100"
                          >
                            סיים סיבוב (שחקנים שלא בחרו לא ישתתפו)
                          </Button>
                          <div className="text-xs text-orange-700 space-y-2">
                            {connectedPlayers.filter(p => !p.has_chosen).map(player => (
                              <div
                                key={player.nickname}
                                className="flex items-center justify-between bg-white p-2 rounded"
                              >
                                <span>{player.nickname}</span>
                                <Button
                                  onClick={() => handleRemovePlayer(player.nickname)}
                                  disabled={player.nickname === nickname}
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 text-xs px-2"
                                >
                                  הסר
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                    <div className="text-sm text-gray-500 mt-4 space-y-2">
                      <div>
                        סכום: <span className="font-semibold text-gray-700">{latestRound.total_sum}</span>
                      </div>
                      <div>
                        ממוצע: <span className="font-semibold text-gray-700">{latestRound.average}</span>
                      </div>
                      <div>
                        ממוצע × {roomState.multiplier}: <span className="font-semibold text-gray-700">{latestRound.target_number}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <ResultsDisplay round={latestRound} nickname={nickname} multiplier={roomState.multiplier} />

                  {isAdmin && (
                    <div className="space-y-3">
                      <Button
                        data-testid="new-round-btn"
                        onClick={handleNewRound}
                        className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
                      >
                        סיבוב חדש
                      </Button>
                      <Button
                        data-testid="stop-game-btn"
                        onClick={handleStopGame}
                        variant="outline"
                        className="w-full h-14 text-lg font-medium"
                      >
                        עצור משחק ופתח חדר לשחקנים נוספים
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game History */}
            {roomState.game_history.length > 0 && (
              <Card className="mt-6 bg-white/80 backdrop-blur-sm">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle>היסטוריית משחקים</CardTitle>
                    {historyExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </CardHeader>
                {historyExpanded && (
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {roomState.game_history.slice().reverse().map((round, idx) => (
                        <div
                          key={roomState.game_history.length - idx}
                          data-testid={`history-round-${round.round_number}`}
                          onClick={() => setSelectedHistoryRound(round)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-md cursor-pointer transition-all"
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
                    {isAdmin && (
                      <div className="space-y-2">
                        <Button
                          data-testid="export-history-btn"
                          onClick={handleExportHistory}
                          variant="outline"
                          className="w-full h-10"
                        >
                          ⬇️ ייצא היסטוריה
                        </Button>
                        <Button
                          data-testid="clear-history-btn"
                          onClick={handleClearHistory}
                          variant="destructive"
                          className="w-full h-10"
                        >
                          מחק היסטוריה
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}