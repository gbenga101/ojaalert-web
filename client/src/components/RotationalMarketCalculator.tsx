import { useMemo } from "react";
import { Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  cycleLength: number;
  cyclePosition: number;
  referenceDate: string; // YYYY-MM-DD string from DB
};

type CalculationResult = {
  isActiveToday: boolean;
  nextMarketDate: Date;
  daysUntilNext: number;
};

/**
 * Core calculation — pure function, no side effects.
 *
 * How rotational markets work:
 * - referenceDate is a known past date when the market was at cyclePosition 1
 * - cycleLength is how many days the full rotation takes (e.g. 4)
 * - cyclePosition is which day in the cycle THIS market falls on (1, 2, 3, or 4)
 *
 * Example: cycleLength=4, cyclePosition=2, referenceDate="2026-03-01"
 * - On 2026-03-01 the cycle was at position 1
 * - This market opens when the cycle reaches position 2
 * - That means it opens on 2026-03-02, 2026-03-06, 2026-03-10...
 */
function calculateRotationalMarket(
  cycleLength: number,
  cyclePosition: number,
  referenceDate: string
): CalculationResult | null {
  // Parse referenceDate as UTC midnight to avoid timezone shifts
  const refDate = new Date(`${referenceDate}T00:00:00Z`);
  if (isNaN(refDate.getTime())) return null;

  // Today at UTC midnight for fair day comparison
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  // How many days since the reference date
  const daysSinceRef = Math.floor(
    (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // What position in the cycle is today?
  // referenceDate is position 1, so position = (daysSinceRef % cycleLength) + 1
  const todayPosition = (((daysSinceRef % cycleLength) + cycleLength) % cycleLength) + 1;

  const isActiveToday = todayPosition === cyclePosition;

  // How many days until the next occurrence of cyclePosition?
  let daysUntilNext: number;
  if (isActiveToday) {
    daysUntilNext = 0;
  } else {
    // Steps forward until we hit cyclePosition again
    const stepsForward =
      ((cyclePosition - todayPosition + cycleLength) % cycleLength);
    daysUntilNext = stepsForward === 0 ? cycleLength : stepsForward;
  }

  const nextMarketDate = new Date(today);
  nextMarketDate.setUTCDate(today.getUTCDate() + daysUntilNext);

  return { isActiveToday, nextMarketDate, daysUntilNext };
}

export default function RotationalMarketCalculator({
  cycleLength,
  cyclePosition,
  referenceDate,
}: Props) {
  const result = useMemo(
    () => calculateRotationalMarket(cycleLength, cyclePosition, referenceDate),
    [cycleLength, cyclePosition, referenceDate]
  );

  if (!result) {
    return (
      <div className="text-sm text-slate-500 italic">
        Unable to calculate market schedule — invalid reference date.
      </div>
    );
  }

  const { isActiveToday, nextMarketDate, daysUntilNext } = result;

  const formattedDate = nextMarketDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const countdownText =
    daysUntilNext === 0
      ? "Open today"
      : daysUntilNext === 1
      ? "Opens tomorrow"
      : `Opens in ${daysUntilNext} days`;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          Market Schedule
        </h4>
        {isActiveToday ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active Today
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
            <XCircle className="w-3 h-3 mr-1" />
            Closed Today
          </Badge>
        )}
      </div>

      {/* Next market date */}
      <div className="flex items-start gap-2">
        <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-slate-500">
            {isActiveToday ? "Today's market day" : "Next market day"}
          </p>
          <p className="text-sm font-medium text-slate-800">{formattedDate}</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-start gap-2">
        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-slate-500">Countdown</p>
          <p
            className={`text-sm font-semibold ${
              daysUntilNext === 0
                ? "text-green-700"
                : daysUntilNext === 1
                ? "text-orange-600"
                : "text-slate-700"
            }`}
          >
            {countdownText}
          </p>
        </div>
      </div>

      {/* Cycle info */}
      <div className="pt-1 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          {cycleLength}-day rotation cycle · position {cyclePosition} of {cycleLength}
        </p>
      </div>
    </div>
  );
}