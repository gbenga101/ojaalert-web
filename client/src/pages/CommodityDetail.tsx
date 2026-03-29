import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PriceHistoryChart, { type PriceHistoryEntry } from "@/components/PriceHistoryChart";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LineChart,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useParams, useLocation } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price == null) return "Price unavailable";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 px-4 py-5">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoPricesState({ commodityName }: { commodityName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-700 mb-2">No prices listed yet</h3>
      <p className="text-stone-500 text-sm max-w-xs">
        No vendors are currently listing prices for{" "}
        <span className="font-medium text-stone-700">{commodityName}</span>. Check back soon.
      </p>
    </div>
  );
}

// ─── Price card ───────────────────────────────────────────────────────────────

type VendorPrice = {
  vendorProductId: string;
  price: number | null;
  unitName: string | null;
  unitId: string | null;
  storeName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  vendorPhone: string | null;
  vendorVerificationStatus: string | null;
  marketId: string | null;
  marketName: string | null;
  marketCity: string | null;
  marketState: string | null;
  marketType: string | null;
  lastUpdated: Date | null;
};

function PriceCard({
  entry,
  rank,
  lowestPrice,
}: {
  entry: VendorPrice;
  rank: number;
  lowestPrice: number | null;
}) {
  const isLowest = entry.price != null && entry.price === lowestPrice;
  const isVerified = entry.vendorVerificationStatus === "approved";

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        isLowest ? "border-emerald-300 bg-emerald-50/40" : "border-stone-200 bg-white"
      }`}
    >
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                rank === 1
                  ? "bg-emerald-500 text-white"
                  : rank === 2
                  ? "bg-stone-300 text-stone-700"
                  : rank === 3
                  ? "bg-amber-400 text-white"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-stone-900 truncate">
                  {entry.storeName ?? entry.vendorName ?? "Unknown Vendor"}
                </span>
                {isVerified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                <Store className="w-3 h-3 flex-shrink-0" />
                <span>{entry.vendorName ?? "Vendor"}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`text-xl font-bold tabular-nums ${isLowest ? "text-emerald-700" : "text-stone-900"}`}>
              {formatPrice(entry.price)}
            </div>
            {entry.unitName && (
              <div className="text-xs text-stone-500 mt-0.5">per {entry.unitName}</div>
            )}
            {isLowest && (
              <div className="flex items-center justify-end gap-1 text-xs text-emerald-600 font-medium mt-1">
                <TrendingDown className="w-3 h-3" />
                Best price
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500 pt-1 border-t border-stone-100">
          {entry.marketName && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-400" />
              {entry.marketName}
              {entry.marketCity ? `, ${entry.marketCity}` : ""}
            </span>
          )}
          {entry.marketType && (
            <Badge variant="secondary" className="text-xs h-4 px-1.5 font-normal">
              {entry.marketType === "rotational" ? "Rotational" : "Daily"}
            </Badge>
          )}
          {entry.lastUpdated && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3 text-stone-400" />
              Updated {formatLastUpdated(entry.lastUpdated)}
            </span>
          )}
        </div>

        {entry.vendorPhone && (
          <div className="mt-2 pt-2 border-t border-stone-100">
            <a
              href={`tel:${entry.vendorPhone}`}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Phone className="w-3 h-3" />
              {entry.vendorPhone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function PriceStats({ vendorPrices }: { vendorPrices: VendorPrice[] }) {
  const validPrices = vendorPrices
    .map((v) => v.price)
    .filter((p): p is number => p != null);

  if (validPrices.length === 0) return null;

  const lowest = Math.min(...validPrices);
  const highest = Math.max(...validPrices);
  const avg = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Lowest",  value: formatPrice(lowest),           color: "text-emerald-700", bg: "bg-emerald-50",  icon: TrendingDown },
        { label: "Average", value: formatPrice(Math.round(avg)),  color: "text-stone-700",   bg: "bg-stone-50",    icon: ShoppingCart },
        { label: "Highest", value: formatPrice(highest),          color: "text-rose-700",    bg: "bg-rose-50",     icon: TrendingUp },
      ].map(({ label, value, color, bg, icon: Icon }) => (
        <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
          <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
          <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
          <div className="text-xs text-stone-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CommodityDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const commodityId = params.id;

  const { data, isLoading, error } = trpc.commodities.getByIdWithPrices.useQuery(
    commodityId,
    { enabled: !!commodityId }
  );

  const { data: historyData = [] } = trpc.priceHistory.getByCommodity.useQuery(
    commodityId,
    { enabled: !!commodityId }
  );

  if (isLoading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-700 mb-2">Commodity not found</h2>
          <p className="text-stone-500 text-sm mb-6">
            This commodity may have been removed or the link is incorrect.
          </p>
          <Button variant="outline" onClick={() => navigate("/commodities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Commodities
          </Button>
        </div>
      </div>
    );
  }

  const { commodity, vendorPrices } = data;

  const validPrices = vendorPrices
    .map((v) => v.price)
    .filter((p): p is number => p != null);
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

  const byMarket = vendorPrices.reduce<Record<string, VendorPrice[]>>((acc, entry) => {
    const key = entry.marketName ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedPrices = [...vendorPrices].sort((a, b) => {
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });

  // Get unit name from first vendor price that has one
  const unitName = vendorPrices.find((v) => v.unitName)?.unitName ?? null;

  // Cast history data — recordedAt may come back as string from tRPC serialization
  const chartHistory: PriceHistoryEntry[] = historyData.map((h) => ({
    ...h,
    recordedAt: h.recordedAt ? new Date(h.recordedAt) : null,
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/commodities")}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Commodities
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                {commodity.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {commodity.category && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {commodity.category}
                  </Badge>
                )}
                <span className="text-sm text-stone-500">
                  {vendorPrices.length > 0
                    ? `${vendorPrices.length} listing${vendorPrices.length !== 1 ? "s" : ""} across ${Object.keys(byMarket).length} market${Object.keys(byMarket).length !== 1 ? "s" : ""}`
                    : "No listings yet"}
                </span>
              </div>
            </div>

            {lowestPrice != null && (
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-stone-500 mb-0.5">From</div>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {formatPrice(lowestPrice)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {vendorPrices.length === 0 ? (
          <NoPricesState commodityName={commodity.name} />
        ) : (
          <>
            {/* Stats */}
            <PriceStats vendorPrices={vendorPrices} />

            {/* ── Price History Chart ── */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-4 h-4 text-stone-400" />
                <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                  Price History — Last 30 Days
                </h2>
              </div>
              <PriceHistoryChart data={chartHistory} unitName={unitName} />
            </div>

            {/* Vendor price list label */}
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                All Vendors — sorted by lowest price
              </h2>
            </div>

            {/* Price cards */}
            <div className="space-y-3">
              {sortedPrices.map((entry, idx) => (
                <PriceCard
                  key={entry.vendorProductId}
                  entry={entry}
                  rank={idx + 1}
                  lowestPrice={lowestPrice}
                />
              ))}
            </div>

            {/* By Market breakdown */}
            {Object.keys(byMarket).length > 1 && (
              <div className="mt-10">
                <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  By Market
                </h2>
                {Object.entries(byMarket).map(([marketName, entries]) => {
                  const marketLowest = Math.min(
                    ...entries
                      .map((e) => e.price)
                      .filter((p): p is number => p != null)
                  );
                  return (
                    <div key={marketName} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800">{marketName}</span>
                          {entries[0]?.marketCity && (
                            <span className="text-xs text-stone-500">
                              {entries[0].marketCity}, {entries[0].marketState}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone-500">
                          {entries.length} seller{entries.length !== 1 ? "s" : ""}
                          {" · "}from {formatPrice(marketLowest)}
                        </span>
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-stone-200">
                        {entries
                          .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
                          .map((entry, idx) => (
                            <PriceCard
                              key={entry.vendorProductId}
                              entry={entry}
                              rank={idx + 1}
                              lowestPrice={lowestPrice}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}