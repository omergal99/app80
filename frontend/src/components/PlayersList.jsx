import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";

export default function PlayersList({
  connectedPlayers,
  playersExpanded,
  setPlayersExpanded,
  roomGameStatus,
  nickname,
  currentPlayerId,
}) {
  return (
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
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                player.nickname === nickname
                  ? "bg-blue-100 border-2 border-blue-300"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {player.is_admin && (
                  <Crown size={16} className="text-yellow-500" />
                )}
                <span
                  className={`font-medium ${
                    player.nickname === nickname ? "text-blue-700" : ""
                  }`}
                >
                  {player.nickname}
                </span>
                {player.is_admin && player.player_id === currentPlayerId && (
                  <Badge className="bg-blue-600 text-white text-xs">אתה</Badge>
                )}
              </div>
              {roomGameStatus === "choosing" && (
                player.has_chosen ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Circle size={18} className="text-gray-300" />
                )
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
