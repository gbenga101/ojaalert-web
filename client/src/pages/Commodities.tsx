import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Commodities() {
  const { isAuthenticated } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all commodities
  const { data: commodities = [], isLoading } = trpc.commodities.list.useQuery({
    category: categoryFilter || undefined,
  });

  // Filter by search query
  const filteredCommodities = commodities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

  // Get unique categories
  const categories = Array.from(new Set(commodities.map(c => c.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-slate-900">Commodities & Prices</h1>
          <p className="text-slate-600 mt-1">Browse and compare commodity prices across markets</p>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search commodities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50"
            />
            <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-slate-50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat || "unknown"} value={cat || ""}>{cat || "Unknown"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-blue-600 hover:bg-blue-700">Apply Filters</Button>
          </div>
        </div>
      </section>

      {/* Commodities Grid */}
      <section className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading commodities...</div>
          ) : filteredCommodities.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No commodities found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommodities.map((commodity) => (
                <Card key={commodity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{commodity.name}</CardTitle>
                    <CardDescription>{commodity.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {commodity.category && (
                      <p className="text-sm text-slate-600">Category: {commodity.category}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-slate-600 text-xs">Avg Price</p>
                        <p className="font-semibold text-slate-900">₦2,500</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-slate-600 text-xs">Trend</p>
                        <p className="font-semibold text-green-600 flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          -2.5%
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      View Prices & History
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
