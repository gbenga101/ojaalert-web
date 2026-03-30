import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PriceHistoryChart, {
  type PriceHistoryEntry,
  VENDOR_COLORS,
} from "@/components/PriceHistoryChart";
import { ArrowLeft, Package, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { format, subDays } from "date-fns";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calculate % change between two prices.
 * Returns null if either value is missing.
 */
function calcChange(current: number, previous: number): number {
  return ((current - previous) / previous) * 100;
}

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct == null)
    return <span className="text-xs text-stone-400">—</span>;

  if (Math.abs(pct) < 0.5)
    return (
      <span className="flex items-center gap-0.5 text-xs text-stone-500">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );

  const up = pct > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-rose-600" : "text-emerald-600"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 px-4 py-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PriceHistoryDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const commodityId = params.id;

  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [rangeDays, setRangeDays] = useState(30);

  // Fetch commodity basic info
  const { data: commodity, isLoading: commodityLoading } =
    trpc.commodities.getById.useQuery(commodityId, { enabled: !!commodityId });

  // Fetch full price history
  const { data: rawHistory = [], isLoading: historyLoading } =
    trpc.priceHistory.getByCommodity.useQuery(commodityId, {
      enabled: !!commodityId,
    });

  const isLoading = commodityLoading || historyLoading;

  if (isLoading) return <PageSkeleton />;

  if (!commodity) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-700 mb-4">
            Commodity not found
          </h2>
          <Button variant="outline" onClick={() => navigate("/commodities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Commodities
          </Button>
        </div>
      </div>
    );
  }

  // Cast dates
  const history: PriceHistoryEntry[] = rawHistory.map((h) => ({
    ...h,
    recordedAt: h.recordedAt ? new Date(h.recordedAt) : null,
  }));

  // Build unique vendor list
  const vendorMap = new Map<string, string>();
  for (const entry of history) {
    if (!vendorMap.has(entry.vendorId)) vendorMap.set(entry.vendorId, entry.vendorName);
  }
  const vendors = Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }));

  // Filter chart data by vendor selection
  const chartData =
    selectedVendorId === "all"
      ? history
      : history.filter((h) => h.vendorId === selectedVendorId);

  // Filter table data by range + vendor
  const cutoff = subDays(new Date(), rangeDays);
  const tableData = chartData
    .filter((h) => h.recordedAt != null && new Date(h.recordedAt) >= cutoff && h.price != null)
    .sort((a, b) => {
      // Sort by date DESC, then vendor name
      const dateA = a.recordedAt?.getTime() ?? 0;
      const dateB = b.recordedAt?.getTime() ?? 0;
      if (dateB !== dateA) return dateB - dateA;
      return a.vendorName.localeCompare(b.vendorName);
    });

  // ── Trend analysis: compare latest price vs 7 days ago per vendor ──────────
  const trendByVendor = new Map<
    string,
    { latest: number; sevenDaysAgo: number | null; pct: number | null }
  >();

  for (const vendor of vendors) {
    const vendorHistory = history
      .filter((h) => h.vendorId === vendor.id && h.price != null && h.recordedAt != null)
      .sort((a, b) => (b.recordedAt?.getTime() ?? 0) - (a.recordedAt?.getTime() ?? 0));

    if (vendorHistory.length === 0) continue;

    const latest = vendorHistory[0].price!;
    const sevenDaysAgoCutoff = subDays(new Date(), 7);

    // Find the closest entry at or before 7 days ago
    const oldEntry = vendorHistory.find(
      (h) => new Date(h.recordedAt!) <= sevenDaysAgoCutoff
    );
    const sevenDaysAgo = oldEntry?.price ?? null;
    const pct = sevenDaysAgo != null ? calcChange(latest, sevenDaysAgo) : null;

    trendByVendor.set(vendor.id, { latest, sevenDaysAgo, pct });
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/commodities/${commodityId}`)}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {commodity.name}
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {commodity.name} — Price History
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {commodity.category && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {commodity.category}
                  </Badge>
                )}
                <span className="text-sm text-stone-500">
                  {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} ·{" "}
                  {history.length} data points
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Trend cards per vendor ── */}
        {vendors.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">
              7-Day Trend per Vendor
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {vendors.map(({ id, name }, idx) => {
                const trend = trendByVendor.get(id);
                const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
                return (
                  <div
                    key={id}
                    className="bg-white rounded-xl border border-stone-200 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() =>
                      setSelectedVendorId((prev) => (prev === id ? "all" : id))
                    }
                    style={
                      selectedVendorId === id
                        ? { borderColor: color, boxShadow: `0 0 0 2px ${color}20` }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {name}
                      </span>
                    </div>
                    <div className="text-base font-bold text-stone-900 tabular-nums">
                      {trend ? formatPrice(trend.latest) : "—"}
                    </div>
                    <div className="mt-1">
                      <TrendBadge pct={trend?.pct ?? null} />
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">vs 7 days ago</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Chart with vendor filter ── */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
              Price Chart
            </h2>
            <Select
              value={selectedVendorId}
              onValueChange={setSelectedVendorId}
            >
              <SelectTrigger className="w-52 h-8 text-xs">
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vendors</SelectItem>
                {vendors.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PriceHistoryChart
            data={chartData}
            unitName={null}
          />
        </div>

        {/* ── Raw data table ── */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
              Daily Averages
            </h2>
            {/* Range filter for table */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
              {[
                { label: "7D", days: 7 },
                { label: "14D", days: 14 },
                { label: "30D", days: 30 },
              ].map(({ label, days }) => (
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
          </div>

          {tableData.length === 0 ? (
            <div className="px-5 py-10 text-center text-stone-400 text-sm">
              No data for selected range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Vendor
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Market
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Avg Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((entry, idx) => {
                    const vendorIdx = vendors.findIndex((v) => v.id === entry.vendorId);
                    const color = VENDOR_COLORS[vendorIdx % VENDOR_COLORS.length];
                    return (
                      <tr
                        key={entry.historyId}
                        className={`border-b border-stone-50 ${
                          idx % 2 === 0 ? "bg-white" : "bg-stone-50/50"
                        }`}
                      >
                        <td className="px-5 py-2.5 text-stone-600 tabular-nums whitespace-nowrap">
                          {entry.recordedAt
                            ? format(new Date(entry.recordedAt), "MMM dd, yyyy")
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-stone-800 font-medium truncate max-w-[140px]">
                              {entry.vendorName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 whitespace-nowrap">
                          {entry.marketName}
                          {entry.marketCity ? `, ${entry.marketCity}` : ""}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-stone-900">
                          {formatPrice(entry.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}