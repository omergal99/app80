import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import ResultsDisplay from "./ResultsDisplay";

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
              data-testid="close-modal-btn"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResultsDisplay round={round} nickname={nickname} multiplier={round.multiplier || 0.8} />
        </CardContent>
      </Card>
    </div>
  );
}
