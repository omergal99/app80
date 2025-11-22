import { Button } from "@/components/ui/button";

export default function RemovePlayersPanel({
  connectedPlayers,
  showAllPlayers,
  setShowAllPlayers,
  currentPlayerId,
  onRemovePlayer,
}) {
  const sortedPlayers = [
    ...connectedPlayers.filter(p => !p.has_chosen),
    ...connectedPlayers.filter(p => p.has_chosen)
  ];
  const displayedPlayers = showAllPlayers ? sortedPlayers : sortedPlayers.slice(0, 3);

  return (
    <div className="text-xs text-orange-700 space-y-2">
      {/* Show players who didn't choose first, then all other connected players */}
      {displayedPlayers.map(player => (
        <div
          key={player.player_id}
          className={`flex items-center justify-between p-2 rounded ${
            !player.has_chosen
              ? "bg-red-100 border border-red-200"
              : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{player.nickname}</span>
            {!player.has_chosen && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                לא בחר
              </span>
            )}
          </div>
          <Button
            onClick={() => onRemovePlayer(player.nickname)}
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
    </div>
  );
}
