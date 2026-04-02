import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import RotationalMarketCalculator from "@/components/RotationalMarketCalculator";

export default function Markets() {
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [, navigate] = useLocation();

  const { data: markets = [], isLoading } = trpc.markets.list.useQuery({
    city: cityFilter || undefined,
    state: stateFilter || undefined,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-slate-900">Markets Directory</h1>
          <p className="text-slate-600 mt-1">Browse all traditional markets in Nigeria</p>
        </div>
      </header>

      {/* Filters - Live filtering (no Apply button needed) */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50"
            />
            <Input
              placeholder="Search by state..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-slate-50"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Filters update automatically as you type
          </p>
        </div>
      </section>

      {/* Markets List */}
      <section className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading markets...</div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No markets found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {markets.map((market) => (
                <Card key={market.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {market.name}
                        </CardTitle>
                        <CardDescription>
                          {market.city}, {market.state}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          market.marketType === "rotational"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {market.marketType === "rotational" ? "Rotational" : "Daily"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {market.latitude && market.longitude && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Location: </span>
                        {market.latitude}, {market.longitude}
                      </div>
                    )}

                    {market.marketType === "rotational" &&
                      market.cycleLength &&
                      market.cyclePosition &&
                      market.referenceDate ? (
                      <RotationalMarketCalculator
                        cycleLength={market.cycleLength}
                        cyclePosition={market.cyclePosition}
                        referenceDate={market.referenceDate}
                      />
                    ) : market.marketType === "daily" ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-sm font-medium text-green-800">
                          ✓ Open every day
                        </p>
                      </div>
                    ) : null}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/commodities?marketId=${market.id}`)}
                    >
                      View Commodities & Prices
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}