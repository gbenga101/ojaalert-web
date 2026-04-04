import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const [cityFilter, setCityFilter] = useState("");
  const [marketTypeFilter, setMarketTypeFilter] = useState<"rotational" | "daily" | "">("");

  // Markets re-fetch automatically when filters change
  const { data: markets = [], isLoading: marketsLoading } = trpc.markets.list.useQuery({
    city: cityFilter.trim() || undefined,
    marketType: marketTypeFilter || undefined,
  });

  const FEATURES = [
    {
      icon: <MapPin className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Market Discovery",
      description: "Find traditional markets by location and type",
      href: "/markets",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600 mb-2" />,
      title: "Price Trends",
      description: "Track commodity price changes over time",
      href: "/trends",
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-orange-600 mb-2" />,
      title: "Price Comparison",
      description: "Compare prices across vendors and markets",
      href: "/compare",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600 mb-2" />,
      title: "Vendor Network",
      description: "Connect with local vendors directly",
      href: "/vendor",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* Hero */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">
            Discover Nigerian Markets & Compare Prices
          </h2>
          <p className="text-lg text-blue-100">
            Find traditional markets, compare commodity prices, and track price trends in real-time
          </p>
        </div>
      </section>

      {/* Search & Filter — reactive, no button press needed */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50"
            />
            <Select
              value={marketTypeFilter || "all"}
              onValueChange={(v) =>
                setMarketTypeFilter(v === "all" ? "" : (v as "rotational" | "daily"))
              }
            >
              <SelectTrigger className="bg-slate-50">
                <SelectValue placeholder="Market type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily Market</SelectItem>
                <SelectItem value="rotational">Rotational Market</SelectItem>
              </SelectContent>
            </Select>
            {/* Clear filters */}
            {(cityFilter || marketTypeFilter) && (
              <Button
                variant="outline"
                onClick={() => { setCityFilter(""); setMarketTypeFilter(""); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Featured Markets</h3>
            <button
              onClick={() => navigate("/markets")}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              View all markets →
            </button>
          </div>

          {marketsLoading ? (
            <div className="text-center py-12 text-slate-500">Loading markets...</div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No markets found{cityFilter ? ` in "${cityFilter}"` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <Card
                  key={market.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate("/markets")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      {market.name}
                    </CardTitle>
                    <CardDescription>
                      {market.city}, {market.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Type:</span>{" "}
                      {market.marketType === "rotational" ? "Rotational" : "Daily"}
                    </div>
                    {market.marketType === "rotational" && market.cycleLength && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Cycle:</span>{" "}
                        {market.cycleLength}-day rotation
                      </div>
                    )}
                    {market.isActiveToday && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Active Today
                      </span>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={(e) => { e.stopPropagation(); navigate("/markets"); }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Platform Features — each card links to its page */}
      <section className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 text-slate-900">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon, title, description, href }) => (
              <Card
                key={title}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(href)}
              >
                <CardHeader>
                  {icon}
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}