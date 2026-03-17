import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Plus, AlertCircle, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function VendorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [marketId, setMarketId] = useState("");

  // Fetch vendor info
  const { data: vendor, isLoading: vendorLoading } = trpc.vendors.me.useQuery();

  // Fetch vendor stores
  const { data: stores = [], isLoading: storesLoading } = trpc.vendorStores.listByVendor.useQuery();

  // Create store mutation
  const createStoreMutation = trpc.vendorStores.create.useMutation({
    onSuccess: () => {
      setShowCreateStore(false);
      setStoreName("");
      setMarketId("");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Please sign in to access the vendor dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            Vendor Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Manage your stores and product listings</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {!vendor ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                No Vendor Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="text-orange-800">
              <p className="mb-4">You need to create a vendor profile to manage stores and products.</p>
              <Button className="bg-orange-600 hover:bg-orange-700">Create Vendor Profile</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="stores" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="stores">My Stores</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            {/* Stores Tab */}
            <TabsContent value="stores" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">My Stores</h2>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowCreateStore(!showCreateStore)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </Button>
              </div>

              {showCreateStore && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>Create New Store</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Store Name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                    <Input
                      placeholder="Market ID"
                      value={marketId}
                      onChange={(e) => setMarketId(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          if (storeName && marketId) {
                            createStoreMutation.mutate({
                              storeName,
                              marketId,
                            });
                          }
                        }}
                        disabled={createStoreMutation.isPending}
                      >
                        {createStoreMutation.isPending ? "Creating..." : "Create Store"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateStore(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {storesLoading ? (
                <div className="text-center py-12 text-slate-500">Loading stores...</div>
              ) : stores.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No stores yet. Create your first store to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stores.map((store) => (
                    <Card key={store.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle>{store.storeName}</CardTitle>
                        <CardDescription>Market ID: {store.marketId}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 p-3 rounded">
                            <p className="text-slate-600 text-xs">Products</p>
                            <p className="font-semibold text-slate-900">0</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded">
                            <p className="text-slate-600 text-xs">Status</p>
                            <p className="font-semibold text-green-600">Active</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          Manage Products
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">My Products</h2>
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Create a store first to add products</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
