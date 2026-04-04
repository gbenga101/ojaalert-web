import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  TrendingDown,
  Clock,
  Phone,
  AlertCircle,
  Store,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";

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

function formatLastUpdated(date: Date | null): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Comparison table ─────────────────────────────────────────────────────────

type VendorPrice = {
  vendorProductId: string;
  price: number | null;
  unitName: string | null;
  storeName: string | null;
  vendorName: string | null;
  vendorPhone: string | null;
  vendorVerificationStatus: string | null;
  marketName: string | null;
  marketCity: string | null;
  marketState: string | null;
  marketType: string | null;
  lastUpdated: Date | null;
};

function ComparisonTable({
  vendorPrices,
  commodityId,
}: {
  vendorPrices: VendorPrice[];
  commodityId: string;
}) {
  const [, navigate] = useLocation();

  if (vendorPrices.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">
          No vendors are currently listing prices for this commodity.
        </p>
      </div>
    );
  }

  const sorted = [...vendorPrices].sort((a, b) => {
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });

  const lowestPrice = sorted.find((v) => v.price != null)?.price ?? null;
  const validPrices = sorted
    .map((v) => v.price)
    .filter((p): p is number => p != null);
  const avgPrice =
    validPrices.length > 0
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      : null;
  const highestPrice =
    validPrices.length > 0 ? Math.max(...validPrices) : null;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <TrendingDown className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
          <div className="text-base font-bold tabular-nums text-emerald-700">
            {formatPrice(lowestPrice)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Lowest</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <ShoppingCart className="w-4 h-4 text-slate-600 mx-auto mb-1" />
          <div className="text-base font-bold tabular-nums text-slate-700">
            {avgPrice != null ? formatPrice(Math.round(avgPrice)) : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Average</div>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 text-center">
          <ShoppingCart className="w-4 h-4 text-rose-600 mx-auto mb-1" />
          <div className="text-base font-bold tabular-nums text-rose-700">
            {formatPrice(highestPrice)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Highest</div>
        </div>
      </div>

      {/* Vendor rows */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
        {sorted.length} vendor{sorted.length !== 1 ? "s" : ""} — sorted by lowest price
      </div>

      {sorted.map((entry, idx) => {
        const isLowest = entry.price != null && entry.price === lowestPrice;
        const isVerified = entry.vendorVerificationStatus === "approved";

        return (
          <Card
            key={entry.vendorProductId}
            className={`transition-shadow hover:shadow-md ${
              isLowest
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-200 bg-white"
            }`}
          >
            <CardContent className="pt-4 pb-4 px-5">
              <div className="flex items-start justify-between gap-3">
                {/* Rank + vendor info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0
                        ? "bg-emerald-500 text-white"
                        : idx === 1
                        ? "bg-slate-300 text-slate-700"
                        : idx === 2
                        ? "bg-amber-400 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {entry.storeName ?? entry.vendorName ?? "Unknown Vendor"}
                      </span>
                      {isVerified && (
                        <span className="text-xs text-emerald-600 font-medium">
                          ✓ Verified
                        </span>
                      )}
                      {isLowest && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs h-4 px-1.5 font-normal hover:bg-emerald-100">
                          Best price
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Store className="w-3 h-3 flex-shrink-0" />
                      {entry.vendorName ?? "Vendor"}
                    </div>
                    {entry.marketName && (
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {entry.marketName}
                        {entry.marketCity ? `, ${entry.marketCity}` : ""}
                        {entry.marketType && (
                          <span className="ml-1 text-slate-300">·</span>
                        )}
                        {entry.marketType && (
                          <span>
                            {entry.marketType === "rotational"
                              ? "Rotational"
                              : "Daily"}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      {entry.vendorPhone && (
                        <a
                          href={`tel:${entry.vendorPhone}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {entry.vendorPhone}
                        </a>
                      )}
                      {entry.lastUpdated && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          Updated {formatLastUpdated(entry.lastUpdated)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-xl font-bold tabular-nums ${
                      isLowest ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {formatPrice(entry.price)}
                  </div>
                  {entry.unitName && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      per {entry.unitName}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Link to full commodity detail */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/commodities/${commodityId}`)}
        >
          View full detail & price history →
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Compare() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedId = params.get("commodityId") || "";

  const [selectedCommodityId, setSelectedCommodityId] = useState(preselectedId);

  // Keep selectedCommodityId in sync if URL param changes
  useEffect(() => {
    if (preselectedId) setSelectedCommodityId(preselectedId);
  }, [preselectedId]);

  const { data: commodities = [], isLoading: commoditiesLoading } =
    trpc.commodities.list.useQuery({});

  const { data: commodityData, isLoading: pricesLoading } =
    trpc.commodities.getByIdWithPrices.useQuery(selectedCommodityId, {
      enabled: !!selectedCommodityId,
    });

  const selectedCommodity = commodities.find((c) => c.id === selectedCommodityId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">
                Price Comparison
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Compare vendor prices for any commodity across all markets
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Commodity selector */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="max-w-sm">
            <Select
              value={selectedCommodityId || "none"}
              onValueChange={(v) =>
                setSelectedCommodityId(v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="bg-slate-50">
                <SelectValue placeholder="Select a commodity to compare..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Select a commodity...
                </SelectItem>
                {commodities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.category ? ` — ${c.category}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {!selectedCommodityId ? (
          /* Empty state — nothing selected yet */
          <div className="text-center py-20">
            <ShoppingCart className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-600 mb-2">
              Select a commodity above
            </h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Choose any commodity from the dropdown to instantly compare prices
              across all vendors and markets.
            </p>
            {/* Quick pick from commodities */}
            {!commoditiesLoading && commodities.length > 0 && (
              <div className="mt-8">
                <p className="text-xs text-slate-400 mb-3">Quick pick:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {commodities.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCommodityId(c.id)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : pricesLoading ? (
          <div className="text-center py-12 text-slate-500">
            Loading prices...
          </div>
        ) : !commodityData ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Could not load prices for this commodity.</p>
          </div>
        ) : (
          <>
            {/* Commodity header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {commodityData.commodity.name}
              </h2>
              {commodityData.commodity.category && (
                <Badge variant="secondary" className="text-xs font-normal mt-1">
                  {commodityData.commodity.category}
                </Badge>
              )}
            </div>

            <ComparisonTable
              vendorPrices={commodityData.vendorPrices.map((v) => ({
                ...v,
                lastUpdated: v.lastUpdated ? new Date(v.lastUpdated) : null,
              }))}
              commodityId={selectedCommodityId}
            />
          </>
        )}
      </main>
    </div>
  );
}