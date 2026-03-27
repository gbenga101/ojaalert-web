import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowRight, Package, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

function CommoditySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

export default function Commodities() {
  const [, navigate] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: commodities = [], isLoading } = trpc.commodities.list.useQuery({
    category: categoryFilter || undefined,
  });

  const filteredCommodities = commodities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(
    new Set(commodities.map((c) => c.category).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Package className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-stone-900">Commodities</h1>
          </div>
          <p className="text-stone-500 text-sm">
            Browse commodities and compare prices across vendors and markets
          </p>
        </div>
      </header>

      {/* ── Filters ── */}
      <section className="bg-white border-b border-stone-100 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search commodities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 flex-1"
            />
            <Select
              value={categoryFilter || "all"}
              onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="bg-stone-50 w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat ?? "unknown"} value={cat ?? ""}>
                    {cat ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {isLoading ? (
            <CommoditySkeleton />
          ) : filteredCommodities.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-medium">No commodities found</p>
              <p className="text-stone-400 text-sm mt-1">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-500 mb-4">
                {filteredCommodities.length} commodit{filteredCommodities.length !== 1 ? "ies" : "y"} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCommodities.map((commodity) => (
                  <Card
                    key={commodity.id}
                    className="hover:shadow-md transition-all duration-200 cursor-pointer border-stone-200 bg-white group"
                    onClick={() => navigate(`/commodities/${commodity.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                          {commodity.name}
                        </CardTitle>
                        {commodity.category && (
                          <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 flex-shrink-0 font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {commodity.category}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-stone-600 hover:text-amber-700 hover:bg-amber-50 text-sm h-9 px-3 group-hover:bg-amber-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/commodities/${commodity.id}`);
                        }}
                      >
                        View prices & vendors
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}