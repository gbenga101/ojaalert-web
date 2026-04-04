import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { subDays, format } from "date-fns";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  LineChart,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Given price history entries for one commodity, compute:
 * - latestAvg: average price across all vendors in the last 7 days
 * - olderAvg:  average price across all vendors older than 7 days
 * - trendPct:  % change (positive = price went up, negative = went down)
 */
function computeTrend(history: {
  price: number | null;
  recordedAt: Date | null;
}[]): {
  latestAvg: number | null;
  trendPct: number | null;
} {
  const cutoff = subDays(new Date(), 7);

  const recent = history
    .filter((h) => h.recordedAt != null && new Date(h.recordedAt) >= cutoff && h.price != null)
    .map((h) => h.price!);

  const older = history
    .filter((h) => h.recordedAt != null && new Date(h.recordedAt) < cutoff && h.price != null)
    .map((h) => h.price!);

  const latestAvg =
    recent.length > 0
      ? recent.reduce((a, b) => a + b, 0) / recent.length
      : null;

  const olderAvg =
    older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : null;

  const trendPct =
    latestAvg != null && olderAvg != null && olderAvg > 0
      ? ((latestAvg - olderAvg) / olderAvg) * 100
      : null;

  return { latestAvg, trendPct };
}

// ─── Single commodity trend card ──────────────────────────────────────────────

function TrendCard({
  commodity,
}: {
  commodity: { id: string; name: string; category: string | null };
}) {
  const [, navigate] = useLocation();

  const { data: history = [], isLoading } = trpc.priceHistory.getByCommodity.useQuery(
    commodity.id
  );

  const mapped = history.map((h) => ({
    price: h.price,
    recordedAt: h.recordedAt ? new Date(h.recordedAt) : null,
  }));

  const { latestAvg, trendPct } = computeTrend(mapped);

  // Most recent date in the dataset
  const latestDate =
    history.length > 0
      ? history
          .map((h) => (h.recordedAt ? new Date(h.recordedAt) : null))
          .filter(Boolean)
          .sort((a, b) => b!.getTime() - a!.getTime())[0]
      : null;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/commodities/${commodity.id}/history`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{commodity.name}</CardTitle>
            {commodity.category && (
              <Badge variant="secondary" className="text-xs font-normal mt-1">
                {commodity.category}
              </Badge>
            )}
          </div>

          {/* Trend badge */}
          {!isLoading && trendPct != null && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                Math.abs(trendPct) < 0.5
                  ? "bg-slate-100 text-slate-500"
                  : trendPct > 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {Math.abs(trendPct) < 0.5 ? (
                <><Minus className="w-3 h-3" /> Stable</>
              ) : trendPct > 0 ? (
                <><TrendingUp className="w-3 h-3" />+{trendPct.toFixed(1)}%</>
              ) : (
                <><TrendingDown className="w-3 h-3" />{trendPct.toFixed(1)}%</>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading trend data...</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400">No price history yet</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Avg price (7d)</span>
              <span className="font-semibold text-slate-800">
                {latestAvg != null ? formatPrice(latestAvg) : "—"}
              </span>
            </div>
            {latestDate && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Last updated</span>
                <span>{format(latestDate, "dd MMM yyyy")}</span>
              </div>
            )}
            <div className="pt-1">
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                <LineChart className="w-3 h-3" />
                View full history & analysis →
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Trends() {
  const [, navigate] = useLocation();

  const { data: commodities = [], isLoading } = trpc.commodities.list.useQuery({});

  // Group by category
  const categories = Array.from(
    new Set(commodities.map((c) => c.category ?? "Other"))
  ).sort();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">
                Price Trends
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Track how commodity prices are moving across all markets
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            Loading commodities...
          </div>
        ) : commodities.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No commodities available yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const group = commodities.filter(
                (c) => (c.category ?? "Other") === category
              );
              return (
                <div key={category}>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((commodity) => (
                      <TrendCard key={commodity.id} commodity={commodity} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}