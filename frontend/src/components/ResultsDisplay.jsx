import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ResultsDisplay({ round, nickname, multiplier }) {
  return (
    <>
      <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
        <div
          className="text-5xl font-bold text-blue-600"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          data-testid="target-number"
        >
          {round.target_number}
        </div>
        <div
          className="text-base text-gray-500 mt-4 flex flex-wrap justify-center items-center gap-6"
          data-testid="calculation-details"
        >
          <div>
            סכום: <span className="font-semibold text-gray-700">{round.total_sum}</span>
          </div>
          <div>
            ממוצע: <span className="font-semibold text-gray-700">{round.average}</span>
          </div>
          <div>
            ממוצע × {multiplier}: <span className="font-semibold text-gray-700">{round.target_number}</span>
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
                data-testid={`result-${playerName}`}
                className={`flex flex-col p-2 rounded-lg transition-all ${isWinner
                  ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400 shadow-lg'
                  : isCurrentPlayer
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300'
                    : 'bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isWinner && <Trophy size={20} className="text-yellow-600" />}
                    <span
                      className={`font-medium text-lg ${isWinner ? 'text-yellow-700' : isCurrentPlayer ? 'text-blue-700' : ''
                        }`}
                      data-testid={`result-player-name-${playerName}`}
                    >
                      {playerName}
                    </span>
                    {isCurrentPlayer && !isWinner && (
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        אתה
                      </Badge>
                    )}
                    {isWinner && <Badge className="bg-yellow-500 text-white font-bold">🎉 מנצח!</Badge>}
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold" data-testid={`result-number-${playerName}`}>
                      {typeof number === 'number' && number % 1 !== 0 ? number.toFixed(2) : number}
                    </div>
                    <div className="text-base text-gray-500" data-testid={`result-distance-${playerName}`}>
                      מרחק: {distance.toFixed(2)}
                      {distance <= 1 && <span className="text-yellow-600 font-bold ml-2">⭐ דיוק מצוין!</span>}
                    </div>
                  </div>
                </div>
                {isWinner && isCurrentPlayer && (
                  <div className="mt-2 text-center text-yellow-700 font-bold text-sm">
                    🏆 אתה המנצח בסיבוק זה! 🏆
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
