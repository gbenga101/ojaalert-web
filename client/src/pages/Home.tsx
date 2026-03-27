import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Users, ShoppingCart, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [cityFilter, setCityFilter] = useState("");
  const [marketTypeFilter, setMarketTypeFilter] = useState<"rotational" | "daily" | "">("" as any);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: markets = [], isLoading: marketsLoading } = trpc.markets.list.useQuery({
    city: cityFilter || undefined,
    marketType: marketTypeFilter || undefined,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">OjaAlert</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">
                  {user?.email || "User"}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Discover Nigerian Markets & Compare Prices</h2>
          <p className="text-lg text-blue-100">
            Find traditional markets, compare commodity prices, and track price trends in real-time
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50"
            />
            <Select
              value={marketTypeFilter || "all"}
              onValueChange={(v) => setMarketTypeFilter(v === "all" ? "" : (v as any))}
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
            <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Featured Markets</h3>

          {marketsLoading ? (
            <div className="text-center py-12 text-slate-500">Loading markets...</div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No markets found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <Card key={market.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      {market.name}
                    </CardTitle>
                    <CardDescription>
                      {market.city}, {market.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Type:</span> {market.marketType || "Daily"}
                    </div>
                    {market.marketType === "rotational" && market.cycleLength && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Cycle:</span> {market.cycleLength}-day rotation
                      </div>
                    )}
                    <Button variant="outline" className="w-full mt-4">View Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="container max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 text-slate-900">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <MapPin className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Market Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Find traditional markets by location and type</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Price Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Track commodity price changes over time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ShoppingCart className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle>Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Compare prices across vendors and markets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Vendor Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Connect with local vendors directly</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}