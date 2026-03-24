import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Markets() {
  const { isAuthenticated } = useAuth();
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  
  // Fetch all markets
  const { data: markets = [], isLoading } = trpc.markets.list.useQuery({
    city: cityFilter || undefined,
    state: stateFilter || undefined,
  });
  
  // Calculate next market day for rotational markets
  const calculateNextMarketDay = (market: typeof markets[0]) => {
  if (
    market.marketType !== "rotational" ||
    !market.referenceDate ||
    !market.cycleLength
  ) {
    return null;
  }

  // referenceDate is a YYYY-MM-DD string
  const refDate = new Date(`${market.referenceDate}T00:00:00Z`);
  if (isNaN(refDate.getTime())) return null;
  const today = new Date();

  const daysDiff = Math.floor(
    (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysUntilNext =
    market.cycleLength - (daysDiff % market.cycleLength);

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);

  return nextDate;
};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-slate-900">Markets Directory</h1>
          <p className="text-slate-600 mt-1">Browse all traditional markets in Nigeria</p>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Button className="bg-blue-600 hover:bg-blue-700">Apply Filters</Button>
          </div>
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
              {markets.map((market) => {
                const nextMarketDay = calculateNextMarketDay(market);
                return (
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
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          market.marketType === "rotational" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {market.marketType === "rotational" ? "Rotational" : "Daily"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {market.latitude && market.longitude && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-700">Location:</span>
                            <p className="text-slate-600">{market.latitude}, {market.longitude}</p>
                          </div>
                        )}
                        {market.marketType === "rotational" && market.cycleLength && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-700">Cycle:</span>
                            <p className="text-slate-600">{market.cycleLength}-day rotation</p>
                          </div>
                        )}
                        {nextMarketDay && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-700 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Next Market Day:
                            </span>
                            <p className="text-slate-600">{nextMarketDay.toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" className="w-full">
                        View Commodities & Prices
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
