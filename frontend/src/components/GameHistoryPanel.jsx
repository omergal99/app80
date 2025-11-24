import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

export default function GameHistoryPanel({
  gameHistory,
  historyExpanded,
  setHistoryExpanded,
  showAllHistory,
  setShowAllHistory,
  onSelectRound,
  isAdmin,
  onExport,
  onClear,
}) {
  if (gameHistory.length === 0) {
    return null;
  }

  const reversedHistory = gameHistory.slice().reverse();
  const displayedHistory = showAllHistory ? reversedHistory : reversedHistory.slice(0, 3);

  return (
    <Card className="mt-6 bg-white/80 backdrop-blur-sm">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setHistoryExpanded(!historyExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            היסטוריית משחקים ({gameHistory.length})
          </CardTitle>
          {historyExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </CardHeader>
      {historyExpanded && (
        <CardContent>
          <div className="space-y-2 mb-4">
            {displayedHistory.map((round, idx) => (
              <div
                key={gameHistory.length - idx}
                data-testid={`history-round-${round.round_number}`}
                onClick={() => onSelectRound(round)}
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
          </div>
          {isAdmin && (
            <div className="space-y-2">
              <Button
                data-testid="export-history-btn"
                onClick={onExport}
                variant="outline"
                className="w-full h-10"
              >
                ⬇️ ייצא היסטוריה
              </Button>
              <Button
                data-testid="clear-history-btn"
                onClick={onClear}
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
  );
}
