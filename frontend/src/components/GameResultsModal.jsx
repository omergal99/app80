import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function GameResultsModal({ round, nickname, onClose }) {
  if (!round) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy size={24} className="text-yellow-500" />
              תוצאות סיבוב {round.round_number}
            </CardTitle>
            <Button 
              onClick={onClose}
              variant="outline"
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">המספר היעד</div>
            <div 
              className="text-5xl font-bold text-blue-600" 
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {round.target_number}
            </div>
            <div className="text-sm text-gray-500 mt-4 space-y-2">
              <div>
                סכום: <span className="font-semibold text-gray-700">{round.total_sum}</span>
              </div>
              <div>
                ממוצע: <span className="font-semibold text-gray-700">{round.average}</span>
              </div>
              <div>
                ממוצע × 0.8: <span className="font-semibold text-gray-700">{round.target_number}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {Object.entries(round.players_data)
              .sort(([, a], [, b]) => 
                Math.abs(a - round.target_number) - Math.abs(b - round.target_number)
              )
              .map(([playerName, number]) => {
                const isWinner = playerName === round.winner;
                const isCurrentPlayer = playerName === nickname;
                const distance = Math.abs(number - round.target_number);
                
                return (
                  <div
                    key={playerName}
                    className={`flex flex-col p-4 rounded-lg transition-all ${
                      isWinner 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400 shadow-lg' 
                        : isCurrentPlayer
                        ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isWinner && <Trophy size={20} className="text-yellow-600" />}
                        <span className={`font-medium text-lg ${isWinner ? 'text-yellow-700' : isCurrentPlayer ? 'text-blue-700' : ''}`}>
                          {playerName}
                        </span>
                        {isCurrentPlayer && !isWinner && (
                          <Badge variant="secondary" className="bg-blue-200 text-blue-800">אתה</Badge>
                        )}
                        {isWinner && (
                          <Badge className="bg-yellow-500 text-white font-bold">🎉 מנצח!</Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold">{number}</div>
                        <div className="text-xs text-gray-500">
                          מרחק: {distance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
