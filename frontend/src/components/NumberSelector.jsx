import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff } from "lucide-react";

export default function NumberSelector({
  selectedNumber,
  onSliderChange,
  inputNumber,
  onInputChange,
  hasChosen,
  hideNumber,
  onToggleHideNumber,
  hideNumberAfterChoosing,
  onToggleHideAfterChoosing,
  onSubmit,
  connectedPlayers,
}) {
  const displayValue =
    hideNumber || (hideNumberAfterChoosing && hasChosen)
      ? "****"
      : inputNumber && !isNaN(parseFloat(inputNumber))
        ? inputNumber
        : selectedNumber[0];

  const chosenCount = connectedPlayers.filter(p => p.has_chosen).length;
  const allChosen = chosenCount === connectedPlayers.length;

  return (
    <>
      {/* Hide Controls - Separate Row */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={onToggleHideNumber}
          variant={hideNumber ? "default" : "outline"}
          size="sm"
          className="gap-2"
          data-testid="toggle-hide-number-btn"
        >
          {hideNumber ? <EyeOff size={16} /> : <Eye size={16} />}
          {hideNumber ? "ללא חשיפה" : "חשיפה גדולה"}
        </Button>
        <Button
          onClick={onToggleHideAfterChoosing}
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
            {displayValue}
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
              onValueChange={onSliderChange}
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
          <label
            className="text-sm font-medium text-right whitespace-nowrap"
            data-testid="number-input-label"
          >
            או הזן ישירות:
          </label>
          <Input
            data-testid="number-input"
            type="text"
            inputMode="decimal"
            min="0"
            max="100"
            value={hideNumberAfterChoosing && hasChosen ? "" : inputNumber}
            onChange={onInputChange}
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
          onClick={onSubmit}
          disabled={hasChosen}
          className="w-full h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700"
        >
          {hasChosen
            ? `אישרת: ${hideNumberAfterChoosing ? "****" : displayValue} - ממתין לשחקנים אחרים`
            : `אשר בחירה: ${displayValue}`}
        </Button>
        {!allChosen && (
          <div className="text-center text-sm text-gray-600">
            {chosenCount} / {connectedPlayers.length} שחקנים בחרו
          </div>
        )}
      </div>
    </>
  );
}
