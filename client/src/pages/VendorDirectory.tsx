import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreEntry = {
  vendorId: string;
  ownerName: string;
  verificationStatus: string | null;
  phoneNumber: string | null; // null when vendor is not approved — enforced at DB level
  storeId: string;
  storeName: string;
  storeDescription: string | null;
  marketId: string;
  marketName: string;
  marketCity: string | null;
  marketState: string | null;
  marketType: string | null;
  productCount: number;
};

// ─── Contact reveal section ───────────────────────────────────────────────────

/**
 * Only rendered for approved vendors (phoneNumber is not null).
 * Hides phone by default. On click: reveals number + Call button.
 */
function ContactSection({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 border-blue-200 text-blue-700 hover:bg-blue-50 active:bg-blue-100"
        onClick={() => setRevealed(true)}
      >
        <Phone className="w-3.5 h-3.5 mr-1.5" />
        Contact Vendor
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-2">
      <p className="text-xs text-blue-700 font-medium">Contact details</p>
      <p className="text-sm font-semibold text-slate-800 tracking-wide">{phone}</p>
      <a href={`tel:${phone}`} className="block">
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
        >
          <Phone className="w-3.5 h-3.5 mr-1.5" />
          Call Now
        </Button>
      </a>
    </div>
  );
}

// ─── Store card ───────────────────────────────────────────────────────────────

function StoreCard({ store }: { store: StoreEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isApproved = store.verificationStatus === "approved";

  // Products — only fetched when card is expanded
  const { data: products = [], isLoading: productsLoading } =
    trpc.vendorProducts.listByStore.useQuery(store.storeId, {
      enabled: expanded,
    });

  // Commodity and unit names — needed to label products
  const { data: commodities = [] } = trpc.commodities.list.useQuery(
    {},
    { enabled: expanded && products.length > 0 }
  );
  const { data: units = [] } = trpc.units.list.useQuery(undefined, {
    enabled: expanded && products.length > 0,
  });

  const locationParts = [
    store.marketName,
    store.marketCity,
    store.marketState,
  ].filter(Boolean);

  return (
    <Card className="border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-4 px-4">
        {/* Store name + owner + verified badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Store className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-base leading-snug">
                {store.storeName}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{store.ownerName}</p>
            </div>
          </div>
          {isApproved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* Market location */}
        <div className="flex items-start gap-1 text-xs text-slate-500 mt-2">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
          <span className="leading-relaxed">{locationParts.join(", ")}</span>
          {store.marketType && (
            <Badge
              variant="secondary"
              className="text-xs h-4 px-1.5 font-normal ml-1 shrink-0"
            >
              {store.marketType === "rotational" ? "Rotational" : "Daily"}
            </Badge>
          )}
        </div>

        {/* Description */}
        {store.storeDescription && (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {store.storeDescription}
          </p>
        )}

        {/* Product count + expand toggle */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Package className="w-3 h-3" />
            {store.productCount} product{store.productCount !== 1 ? "s" : ""}
          </span>
          {store.productCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {expanded ? (
                <>
                  Hide products <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View products <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Contact — only shown for approved vendors with a phone number */}
        {isApproved && store.phoneNumber ? (
          <ContactSection phone={store.phoneNumber} />
        ) : !isApproved ? (
          <p className="text-xs text-slate-400 mt-3 italic">
            Contact details available after vendor verification
          </p>
        ) : null}
      </CardHeader>

      {/* Expanded product list */}
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4 border-t border-slate-100">
          {productsLoading ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No products listed yet.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {products.map((p) => {
                const commodity = commodities.find(
                  (c) => c.id === p.commodityId
                );
                const unit = units.find((u) => u.id === p.unitId);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {commodity?.name ?? "Unknown commodity"}
                      </p>
                      <p className="text-xs text-slate-400">
                        per {unit?.name ?? "unit"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {p.currentPrice != null
                        ? `₦${Number(p.currentPrice).toLocaleString("en-NG")}`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorDirectory() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stores = [], isLoading } = trpc.vendors.directory.useQuery();

  // Client-side search — vendor name, store name, market name, city
  const filtered = stores.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.storeName.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q) ||
      s.marketName.toLowerCase().includes(q) ||
      (s.marketCity ?? "").toLowerCase().includes(q) ||
      (s.marketState ?? "").toLowerCase().includes(q)
    );
  });

  // Deduplicate markets from filtered results, preserving display order
  const markets = Array.from(
    new Map(
      filtered.map((s) => [
        s.marketId,
        {
          id: s.marketId,
          name: s.marketName,
          city: s.marketCity,
          state: s.marketState,
        },
      ])
    ).values()
  );

  const totalVendors = new Set(filtered.map((s) => s.vendorId)).size;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            <Users className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">
                Vendor Network
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Browse vendors, see their stores, products and contact them directly
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="container max-w-6xl mx-auto px-4">
          <Input
            placeholder="Search by store name, vendor, market or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-slate-50"
          />
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            Loading vendors...
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No vendors yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Vendors who register on OjaAlert will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              No vendors found matching "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Summary line */}
            <p className="text-sm text-slate-400">
              {totalVendors} vendor{totalVendors !== 1 ? "s" : ""} ·{" "}
              {filtered.length} store{filtered.length !== 1 ? "s" : ""} across{" "}
              {markets.length} market{markets.length !== 1 ? "s" : ""}
            </p>

            {/* Grouped by market */}
            {markets.map((market) => {
              const marketStores = filtered.filter(
                (s) => s.marketId === market.id
              );
              const locationLabel = [market.name, market.city, market.state]
                .filter(Boolean)
                .join(", ");

              return (
                <div key={market.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <h2 className="text-base font-semibold text-slate-800">
                      {locationLabel}
                    </h2>
                    <span className="text-xs text-slate-400">
                      · {marketStores.length} store
                      {marketStores.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketStores.map((store) => (
                      <StoreCard key={store.storeId} store={store} />
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