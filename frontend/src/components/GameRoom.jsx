import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, CheckCircle2, Circle, Trophy, ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import GameResultsModal from "./GameResultsModal";
import ResultsDisplay from "./ResultsDisplay";
import { WS_URL } from "@/services/backendService";

export default function GameRoom({ roomId, roomName, playerData, onUpdatePlayerData, onLeave }) {
  // Destructure player info from playerData
  const nickname = playerData?.nickname;
  const initialPlayerId = playerData?.playerId;

  const [roomState, setRoomState] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(initialPlayerId || null);
  const [selectedNumber, setSelectedNumber] = useState([50]);
  const [inputNumber, setInputNumber] = useState("50");
  const [hasChosen, setHasChosen] = useState(false);
  const [hideNumber, setHideNumber] = useState(false);
  const [hideNumberAfterChoosing, setHideNumberAfterChoosing] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(true);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [multiplierInput, setMultiplierInput] = useState("0.8");
  const [previousRound, setPreviousRound] = useState(null);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);
  const [previousGameStatus, setPreviousGameStatus] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Load hide settings from localStorage on mount
  useEffect(() => {
    const storedHideNumber = localStorage.getItem(`hideNumber_${nickname}`);
    const storedHideAfter = localStorage.getItem(`hideNumberAfterChoosing_${nickname}`);

    if (storedHideNumber !== null) {
      setHideNumber(JSON.parse(storedHideNumber));
    }
    if (storedHideAfter !== null) {
      setHideNumberAfterChoosing(JSON.parse(storedHideAfter));
    }
  }, [nickname]);

  // Save hide settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`hideNumber_${nickname}`, JSON.stringify(hideNumber));
  }, [hideNumber, nickname]);

  useEffect(() => {
    localStorage.setItem(`hideNumberAfterChoosing_${nickname}`, JSON.stringify(hideNumberAfterChoosing));
  }, [hideNumberAfterChoosing, nickname]);

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

          // Capture current player's ID on first message
          if (currentPlayer && !currentPlayerId) {
            setCurrentPlayerId(currentPlayer.player_id);
            // Update player data with playerId and save to localStorage
            if (onUpdatePlayerData) {
              onUpdatePlayerData({
                nickname: nickname,
                playerId: currentPlayer.player_id
              });
            }
          }

          // Check if current player was removed (was in room state before, not now)
          if (roomState && roomState.players.find(p => p.nickname === nickname) && !currentPlayer) {
            toast.error(`${nickname} הוסר מהסיבוב`);
          }

          if (currentPlayer) {
            setHasChosen(currentPlayer.has_chosen);
          }

          // Only reset selection when transitioning from waiting to choosing status
          // This happens at the START of the game, not on subsequent rounds
          if (previousGameStatus === "waiting" && data.game_status === "choosing") {
            setSelectedNumber([50]);
            setInputNumber("50");
            setHasChosen(false);
            // Don't reset hideNumber and hideNumberAfterChoosing - they're saved in localStorage
          }

          // Apply hideNumberAfterChoosing effect when player chooses
          if (!previousGameStatus || previousGameStatus === "choosing") {
            if (currentPlayer?.has_chosen && hideNumberAfterChoosing) {
              setHideNumber(true);
            }
          }

          setPreviousGameStatus(data.game_status);
          setPreviousRound(data.current_round);

          // Ensure current player is always in the room state for consistent UI display
          // This prevents situations where a player disappears from the UI
          if (data.game_status === "results" && currentPlayer && !data.players.find(p => p.nickname === nickname)) {
            data.players.push(currentPlayer);
          }

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
    let value = e.target.value;

    // Only allow digits and one decimal point
    if (!/^[\d.]*$/.test(value)) {
      return; // Reject non-numeric input
    }

    // Validate input - only allow 0-100 with up to 2 decimal places
    if (value === '') {
      setInputNumber('');
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      return; // Reject invalid input
    }

    // Limit to 2 decimal places
    const parts = value.split('.');
    if (parts.length > 2) {
      return; // Reject multiple dots
    }
    if (parts[1] && parts[1].length > 2) {
      return; // Reject if more than 2 decimal places
    }

    setInputNumber(value);
    // Store the full decimal value for display, but keep slider as integer
    setSelectedNumber([Math.round(num)]);
  };

  const handleStartGame = () => {
    setHideNumber(false);
    sendMessage({ action: "start_game" });
  };

  const handleChooseNumber = () => {
    // Parse decimal if provided, otherwise use slider value
    const numberToSend = inputNumber && !isNaN(parseFloat(inputNumber))
      ? Math.min(100, Math.max(0, parseFloat(inputNumber)))
      : selectedNumber[0];

    sendMessage({ action: "choose_number", number: numberToSend });
    setHasChosen(true);
  };

  const handleNewRound = () => {
    // Don't reset hideNumber - keep user's preferences
    sendMessage({ action: "new_round" });
  };

  const handleStopGame = () => {
    sendMessage({ action: "stop_game" });
  };

  const handleClearHistory = () => {
    if (window.confirm("האם אתה בטוח שתרצה למחוק את ההיסטוריה?")) {
      sendMessage({ action: "clear_history" });
    }
  };

  const handleSetMultiplier = () => {
    const multiplier = parseFloat(multiplierInput);
    if (!isNaN(multiplier) && multiplier >= 0.1 && multiplier <= 0.9) {
      sendMessage({ action: "set_multiplier", multiplier });
      toast.success(`מכפיל עדכן ל-${multiplier}`);
    } else {
      toast.error("מכפיל חייב להיות בין 0.1 ל-0.9");
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
  const playersChosen = connectedPlayers.filter(p => p.has_chosen);
  const anyPlayerChosen = playersChosen.length > 0;
  const latestRound = roomState.game_history[roomState.game_history.length - 1];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* History Round Modal */}
        <GameResultsModal
          round={selectedHistoryRound}
          nickname={nickname}
          onClose={() => setSelectedHistoryRound(null)}
        />

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between items-baseline">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              data-testid="room-title"
            >
              {roomName}
            </h1>
            <Button
              data-testid="leave-room-btn"
              onClick={() => {
                // Clear localStorage when leaving
                localStorage.removeItem(`hideNumber_${nickname}`);
                localStorage.removeItem(`hideNumberAfterChoosing_${nickname}`);
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
          <p className="text-xl text-gray-700 flex gap-10">
            <span>סיבוב {roomState.current_round}</span>
            <span>כינוי: {nickname}</span>
          </p>
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
                      key={player.player_id}
                      data-testid={`player-${player.nickname}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${player.nickname === nickname
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {player.is_admin && <Crown size={16} className="text-yellow-500" />}
                        <span className={`font-medium ${player.nickname === nickname ? 'text-blue-700' : ''}`}>{player.nickname}</span>
                        {player.is_admin && player.player_id === currentPlayerId && (
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
                          הגדר מכפיל למשחק (0.1 - 0.9)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0.1"
                            max="0.9"
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
                <CardHeader>
                  <CardTitle>בחר את המספר שלך - סיבוב ){roomState.current_round})</CardTitle>
                  <CardDescription>
                    בחר מספר בין 0 ל-100. המנצח הוא מי שהכי קרוב לממוצע של סכום המספרים כפול {roomState.multiplier}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hide Controls - Separate Row */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setHideNumber(!hideNumber)}
                      variant={hideNumber ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      data-testid="toggle-hide-number-btn"
                    >
                      {hideNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                      {hideNumber ? "ללא חשיפה" : "חשיפה גדולה"}
                    </Button>
                    <Button
                      onClick={() => setHideNumberAfterChoosing(!hideNumberAfterChoosing)}
                      variant={hideNumberAfterChoosing ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      data-testid="toggle-hide-after-choosing-btn"
                    >
                      {hideNumberAfterChoosing ? "✓ " : "○ "} הסתר לאחר בחירה
                    </Button>
                  </div>

                  {/* Large Number Display with fixed width container */}
                  <div className="flex items-center justify-center">
                    <div className="w-48 text-center">
                      <div
                        className="text-5xl font-black h-24 flex items-center justify-center"
                        style={{ fontFamily: "'Courier New', monospace" }}
                        data-testid="selected-number-display"
                      >
                        {hideNumber || (hideNumberAfterChoosing && hasChosen) ? "****" : (inputNumber && !isNaN(parseFloat(inputNumber)) ? inputNumber : selectedNumber[0])}
                      </div>
                    </div>
                  </div>

                  {/* Slider and Input */}
                  <div className="text-center">
                    {!(hideNumberAfterChoosing && hasChosen) && (
                      <>
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
                      </>
                    )}
                    {hideNumberAfterChoosing && hasChosen && (
                      <div className="text-center text-gray-500 mb-6 py-4">
                        סליידר מוסתר עד סיום הבחירה
                      </div>
                    )}
                  </div>

                  {/* Input with inline label */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex gap-3 items-center">
                      <label className="text-sm font-medium text-right whitespace-nowrap"
                        data-testid="number-input-label">
                        או הזן ישירות:
                      </label>
                      <Input
                        data-testid="number-input"
                        type="text"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        value={hideNumberAfterChoosing && hasChosen ? "" : inputNumber}
                        onChange={handleInputChange}
                        disabled={hasChosen}
                        className="text-lg text-center h-10 flex-1"
                        placeholder="0-100 (עד 2 ספרות אחרי הנקודה)"
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
                      {hasChosen ? `אישרת: ${hideNumberAfterChoosing ? "****" : (inputNumber && !isNaN(parseFloat(inputNumber)) ? inputNumber : selectedNumber[0])} - ממתין לשחקנים אחרים` : `אשר בחירה: ${inputNumber && !isNaN(parseFloat(inputNumber)) ? inputNumber : selectedNumber[0]}`}
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
                            disabled={!anyPlayerChosen}
                            variant="outline"
                            className="w-full h-10 text-sm border-orange-300 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            סיים סיבוב (שחקנים שלא בחרו לא ישתתפו)
                          </Button>
                          <div className="text-xs text-orange-700 space-y-2" data-testid="force-finish-warning">
                            {/* Show players who didn't choose first, then all other connected players */}
                            {(() => {
                              const sortedPlayers = [
                                ...connectedPlayers.filter(p => !p.has_chosen),
                                ...connectedPlayers.filter(p => p.has_chosen)
                              ].filter(p => p.player_id !== currentPlayerId); // Exclude current admin
                              const displayedPlayers = showAllPlayers ? sortedPlayers : sortedPlayers.slice(0, 3);
                              return (
                                <>
                                  {displayedPlayers.map(player => (
                                    <div
                                      key={player.player_id}
                                      className={`flex items-center justify-between p-2 rounded ${!player.has_chosen ? 'bg-red-100 border border-red-200' : 'bg-white'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{player.nickname}</span>
                                        {!player.has_chosen ? (
                                          <span className="text-xs bg-orange-200 text-black px-2 py-0.5 rounded">
                                            עדיין לא בחר
                                          </span>
                                        ) : <span className="text-xs bg-green-300 text-black px-2 py-0.5 rounded">
                                          בחר
                                        </span>}
                                      </div>
                                      <Button
                                        onClick={() => handleRemovePlayer(player.nickname)}
                                        disabled={player.player_id === currentPlayerId}
                                        size="sm"
                                        variant="destructive"
                                        className="h-6 text-xs px-2"
                                      >
                                        הסר
                                      </Button>
                                    </div>
                                  ))}
                                  {sortedPlayers.length > 3 && !showAllPlayers && (
                                    <Button
                                      onClick={() => setShowAllPlayers(true)}
                                      variant="outline"
                                      size="sm"
                                      className="w-full mt-2 text-xs"
                                    >
                                      הצג הכל ({sortedPlayers.length})
                                    </Button>
                                  )}
                                </>
                              );
                            })()}
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
                    <CardTitle className="flex items-center gap-2">
                      היסטוריית משחקים ({roomState.game_history.length})
                    </CardTitle>
                    {historyExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </CardHeader>
                {historyExpanded && (
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {(() => {
                        const reversedHistory = roomState.game_history.slice().reverse();
                        const displayedHistory = showAllHistory ? reversedHistory : reversedHistory.slice(0, 3);
                        return (
                          <>
                            {displayedHistory.map((round, idx) => (
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
                            {reversedHistory.length > 3 && !showAllHistory && (
                              <Button
                                onClick={() => setShowAllHistory(true)}
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 text-xs"
                              >
                                הצג עוד משחקים ({reversedHistory.length - 3})
                              </Button>
                            )}
                          </>
                        );
                      })()}
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