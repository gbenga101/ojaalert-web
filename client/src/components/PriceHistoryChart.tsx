import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriceHistoryEntry = {
  historyId: string;
  price: number | null;
  recordedAt: Date | null;
  source: string | null;
  vendorProductId: string;
  vendorId: string;
  vendorName: string;
  storeName: string;
  marketName: string;
  marketCity: string | null;
};

export const VENDOR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#475569",
];

const RANGE_OPTIONS = [
  { label: "7D",  days: 7  },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-stone-700 mb-2 border-b border-stone-100 pb-1.5">
        {label}
      </p>
      {payload.map((entry) => {
        const market = entry.payload[`${entry.name}__market`] as string | undefined;
        return (
          <div key={entry.name} className="flex flex-col gap-0.5 mb-2 last:mb-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-stone-800 truncate max-w-[140px]">
                {entry.name}
              </span>
            </div>
            <div className="pl-4 text-stone-600">
              ₦{Number(entry.value).toLocaleString("en-NG")}
              {market && (
                <span className="text-stone-400 text-xs ml-1">· {market}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  data: PriceHistoryEntry[];
  unitName?: string | null;
  onViewFullHistory?: () => void;
};

export default function PriceHistoryChart({ data, unitName, onViewFullHistory }: Props) {
  const [rangeDays, setRangeDays] = useState(30);
  const [hiddenVendors, setHiddenVendors] = useState<Set<string>>(new Set());

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
        No price history available yet.
      </div>
    );
  }

  // ── Filter by selected date range ─────────────────────────────────────────
  const cutoff = subDays(new Date(), rangeDays);
  const filteredData = data.filter(
    (e) => e.recordedAt != null && new Date(e.recordedAt) >= cutoff
  );

  // ── Unique vendors (stable order) ─────────────────────────────────────────
  const vendorMap = new Map<string, { vendorId: string; vendorName: string; marketName: string }>();
  for (const entry of filteredData) {
    if (!vendorMap.has(entry.vendorId)) {
      vendorMap.set(entry.vendorId, {
        vendorId: entry.vendorId,
        vendorName: entry.vendorName,
        marketName: entry.marketName,
      });
    }
  }
  const vendors = Array.from(vendorMap.values());

  // ── Build chart rows keyed by date ────────────────────────────────────────
  const rowMap = new Map<string, Record<string, unknown>>();
  for (const entry of filteredData) {
    if (!entry.recordedAt || entry.price == null) continue;
    const dateKey = format(new Date(entry.recordedAt), "MMM dd");
    if (!rowMap.has(dateKey)) rowMap.set(dateKey, { date: dateKey });
    const row = rowMap.get(dateKey)!;
    row[entry.vendorName] = entry.price;
    row[`${entry.vendorName}__market`] = entry.marketName;
  }
  const chartData = Array.from(rowMap.values());

  const formatY = (value: number) => `₦${(value / 1000).toFixed(1)}k`;

  const handleLegendClick = (vendorName: string) => {
    setHiddenVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorName)) next.delete(vendorName);
      else next.add(vendorName);
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* ── Top bar: range toggle + view full history ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        {/* Range toggle */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setRangeDays(days)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                rangeDays === days
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View full history link */}
        {onViewFullHistory && (
          <button
            onClick={onViewFullHistory}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            Full history & analysis
          </button>
        )}
      </div>

      {/* ── Vendor legend (click to toggle) ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {vendors.map(({ vendorId, vendorName, marketName }, idx) => {
          const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
          const isHidden = hiddenVendors.has(vendorName);
          return (
            <button
              key={vendorId}
              onClick={() => handleLegendClick(vendorName)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isHidden
                  ? "border-stone-200 text-stone-400 bg-stone-50"
                  : "border-transparent text-white"
              }`}
              style={isHidden ? {} : { backgroundColor: color }}
              title={`${vendorName} · ${marketName}`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isHidden ? "#cbd5e1" : "rgba(255,255,255,0.7)" }}
              />
              <span className="truncate max-w-[120px]">{vendorName}</span>
            </button>
          );
        })}
      </div>

      {/* ── Chart ── */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-stone-400 text-sm">
          No data for this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatY}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
            />
            {vendors.map(({ vendorName }, idx) => (
              <Line
                key={vendorName}
                type="monotone"
                dataKey={vendorName}
                stroke={VENDOR_COLORS[idx % VENDOR_COLORS.length]}
                strokeWidth={hiddenVendors.has(vendorName) ? 0 : 2}
                dot={false}
                activeDot={hiddenVendors.has(vendorName) ? false : { r: 4, strokeWidth: 0 }}
                connectNulls
                hide={hiddenVendors.has(vendorName)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {unitName && (
        <p className="text-xs text-stone-400 text-right mt-1">Price per {unitName}</p>
      )}
    </div>
  );
}