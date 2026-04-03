import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Pencil,
  Plus,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorProduct = {
  id: string;
  vendorStoreId: string;
  commodityId: string;
  unitId: string;
  currentPrice: string;
  updatedBy: string | null;
  lastUpdated: Date | null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Modal to update the price of an existing product */
function UpdatePriceModal({
  product,
  commodityName,
  unitName,
  open,
  onClose,
}: {
  product: VendorProduct;
  commodityName: string;
  unitName: string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [price, setPrice] = useState(product.currentPrice);
  const [error, setError] = useState("");

  const updateMutation = trpc.vendorProducts.updatePrice.useMutation({
    onSuccess: () => {
      utils.vendorProducts.listByStore.invalidate(product.vendorStoreId);
      toast.success("Price updated successfully");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update price");
    },
  });

  const handleSubmit = () => {
    const trimmed = price.trim();
    if (!trimmed || !/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      setError("Enter a valid price (e.g. 500 or 500.00)");
      return;
    }
    setError("");
    updateMutation.mutate({ vendorProductId: product.id, currentPrice: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{commodityName}</span>
            {unitName && <span className="text-slate-400"> / {unitName}</span>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="update-price">New Price (₦)</Label>
            <Input
              id="update-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1500"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Row for a single vendor product inside the store's product list */
function ProductRow({
  product,
  commodities,
  units,
}: {
  product: VendorProduct;
  commodities: { id: string; name: string }[];
  units: { id: string; name: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const commodity = commodities.find((c) => c.id === product.commodityId);
  const unit = units.find((u) => u.id === product.unitId);

  return (
    <>
      <div className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-slate-800">
            {commodity?.name ?? "Unknown commodity"}
          </p>
          <p className="text-xs text-slate-500">
            per {unit?.name ?? "unit"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-slate-900">
            ₦{Number(product.currentPrice).toLocaleString()}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-blue-600"
            onClick={() => setEditOpen(true)}
            title="Update price"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {editOpen && commodity && (
        <UpdatePriceModal
          product={product}
          commodityName={commodity.name}
          unitName={unit?.name ?? ""}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

/** Add-product form shown inside each store's expanded section */
function AddProductForm({
  storeId,
  commodities,
  units,
  onDone,
}: {
  storeId: string;
  commodities: { id: string; name: string }[];
  units: { id: string; name: string }[];
  onDone: () => void;
}) {
  const utils = trpc.useUtils();
  const [commodityId, setCommodityId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.vendorProducts.create.useMutation({
    onSuccess: () => {
      utils.vendorProducts.listByStore.invalidate(storeId);
      toast.success("Product added successfully");
      setCommodityId("");
      setUnitId("");
      setPrice("");
      onDone();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add product");
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!commodityId) e.commodity = "Select a commodity";
    if (!unitId) e.unit = "Select a unit";
    if (!price.trim() || !/^\d+(\.\d{1,2})?$/.test(price.trim()))
      e.price = "Enter a valid price (e.g. 500 or 500.00)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate({
      vendorStoreId: storeId,
      commodityId,
      unitId,
      currentPrice: price.trim(),
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 mt-3">
      <p className="text-sm font-medium text-slate-700">Add New Product</p>

      {/* Commodity */}
      <div className="space-y-1">
        <Label className="text-xs">Commodity</Label>
        <Select value={commodityId} onValueChange={(v) => { setCommodityId(v); setErrors((e) => ({ ...e, commodity: "" })); }}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select commodity" />
          </SelectTrigger>
          <SelectContent>
            {commodities.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.commodity && <p className="text-xs text-red-500">{errors.commodity}</p>}
      </div>

      {/* Unit */}
      <div className="space-y-1">
        <Label className="text-xs">Unit</Label>
        <Select value={unitId} onValueChange={(v) => { setUnitId(v); setErrors((e) => ({ ...e, unit: "" })); }}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.unit && <p className="text-xs text-red-500">{errors.unit}</p>}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label className="text-xs">Current Price (₦)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 1500"
          value={price}
          onChange={(e) => { setPrice(e.target.value); setErrors((er) => ({ ...er, price: "" })); }}
          className="bg-white"
        />
        {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {createMutation.isPending ? "Adding..." : "Add Product"}
        </Button>
      </div>
    </div>
  );
}

/** Expandable store card with product list and add-product form */
function StoreCard({
  store,
  markets,
  commodities,
  units,
}: {
  store: { id: string; storeName: string; marketId: string; description?: string | null };
  markets: { id: string; name: string; city: string }[];
  commodities: { id: string; name: string }[];
  units: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const { data: products = [], isLoading: productsLoading } =
    trpc.vendorProducts.listByStore.useQuery(store.id, { enabled: expanded });

  // Resolve market name from the markets list passed down from parent
  const market = markets.find((m) => m.id === store.marketId);
  const marketLabel = market ? `${market.name} — ${market.city}` : "Unknown market";

  return (
    <Card className="border border-slate-200">
      {/* Store header — click to expand/collapse */}
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <CardTitle className="text-base">{store.storeName}</CardTitle>
              <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {marketLabel}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded content */}
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          {/* Product list */}
          {productsLoading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Loading products...</p>
          ) : products.length === 0 && !showAddProduct ? (
            <div className="text-center py-6 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No products yet</p>
            </div>
          ) : (
            <div>
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p as VendorProduct}
                  commodities={commodities}
                  units={units}
                />
              ))}
            </div>
          )}

          {/* Add product form or button */}
          {showAddProduct ? (
            <AddProductForm
              storeId={store.id}
              commodities={commodities}
              units={units}
              onDone={() => setShowAddProduct(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 border-dashed"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddProduct(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const { user, isAuthenticated } = useAuth();

  // Global data — markets already fetched here, passed down to StoreCard
  const { data: commodities = [] } = trpc.commodities.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();
  const { data: markets = [] } = trpc.markets.list.useQuery({});

  // Vendor profile
  const utils = trpc.useUtils();
  const { data: vendor, isLoading: vendorLoading } = trpc.vendors.me.useQuery();

  // Vendor stores
  const { data: stores = [], isLoading: storesLoading } =
    trpc.vendorStores.listByVendor.useQuery();

  // ── Vendor profile creation form ──
  const [ownerName, setOwnerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const createVendorMutation = trpc.vendors.create.useMutation({
    onSuccess: () => {
      utils.vendors.me.invalidate();
      toast.success("Vendor profile created!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create vendor profile");
    },
  });

  const handleCreateProfile = () => {
    const e: Record<string, string> = {};
    if (!ownerName.trim()) e.ownerName = "Owner name is required";
    if (!phoneNumber.trim()) e.phoneNumber = "Phone number is required";
    setProfileErrors(e);
    if (Object.keys(e).length > 0) return;
    createVendorMutation.mutate({ ownerName: ownerName.trim(), phoneNumber: phoneNumber.trim() });
  };

  // ── Create store form state ──
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [marketId, setMarketId] = useState("");
  const [storeErrors, setStoreErrors] = useState<Record<string, string>>({});

  const createStoreMutation = trpc.vendorStores.create.useMutation({
    onSuccess: () => {
      utils.vendorStores.listByVendor.invalidate();
      setShowCreateStore(false);
      setStoreName("");
      setMarketId("");
      toast.success("Store created successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create store");
    },
  });

  const handleCreateStore = () => {
    const e: Record<string, string> = {};
    if (!storeName.trim()) e.storeName = "Store name is required";
    if (!marketId) e.marketId = "Select a market";
    setStoreErrors(e);
    if (Object.keys(e).length > 0) return;
    createStoreMutation.mutate({ storeName: storeName.trim(), marketId });
  };

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Please sign in to access the vendor dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Loading vendor ──
  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading your vendor profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Store className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">
                Vendor Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {user?.name || user?.email || user?.id || "Vendor"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* ── No vendor profile yet ── */}
        {!vendor ? (
          <div className="max-w-md mx-auto">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">
                  Create Your Vendor Profile
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Set up your vendor account to start listing products and managing your stores.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="owner-name">Owner / Business Name</Label>
                  <Input
                    id="owner-name"
                    placeholder="e.g. Adunola Stores"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      setProfileErrors((er) => ({ ...er, ownerName: "" }));
                    }}
                    className="bg-white"
                  />
                  {profileErrors.ownerName && (
                    <p className="text-xs text-red-500">{profileErrors.ownerName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    placeholder="e.g. 08012345678"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setProfileErrors((er) => ({ ...er, phoneNumber: "" }));
                    }}
                    className="bg-white"
                  />
                  {profileErrors.phoneNumber && (
                    <p className="text-xs text-red-500">{profileErrors.phoneNumber}</p>
                  )}
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreateProfile}
                  disabled={createVendorMutation.isPending}
                >
                  {createVendorMutation.isPending ? "Creating..." : "Create Vendor Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ── Has vendor profile ── */
          <Tabs defaultValue="stores" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 max-w-xs">
              <TabsTrigger value="stores">My Stores</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* ── Stores Tab ── */}
            <TabsContent value="stores" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  My Stores
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({stores.length})
                  </span>
                </h2>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  onClick={() => setShowCreateStore((v) => !v)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Store
                </Button>
              </div>

              {/* Create store form */}
              {showCreateStore && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-blue-900">New Store</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-sm">Store Name</Label>
                      <Input
                        placeholder="e.g. Adunola Rice Stall"
                        value={storeName}
                        onChange={(e) => {
                          setStoreName(e.target.value);
                          setStoreErrors((er) => ({ ...er, storeName: "" }));
                        }}
                        className="bg-white"
                        autoFocus
                      />
                      {storeErrors.storeName && (
                        <p className="text-xs text-red-500">{storeErrors.storeName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Market</Label>
                      <Select
                        value={marketId}
                        onValueChange={(v) => {
                          setMarketId(v);
                          setStoreErrors((er) => ({ ...er, marketId: "" }));
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select a market" />
                        </SelectTrigger>
                        <SelectContent>
                          {markets.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} — {m.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {storeErrors.marketId && (
                        <p className="text-xs text-red-500">{storeErrors.marketId}</p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateStore(false);
                          setStoreName("");
                          setMarketId("");
                          setStoreErrors({});
                        }}
                        disabled={createStoreMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleCreateStore}
                        disabled={createStoreMutation.isPending}
                      >
                        {createStoreMutation.isPending ? "Creating..." : "Create Store"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Store list */}
              {storesLoading ? (
                <p className="text-center py-12 text-slate-500">Loading stores...</p>
              ) : stores.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      No stores yet. Add your first store to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      markets={markets}
                      commodities={commodities}
                      units={units}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Profile Tab ── */}
            <TabsContent value="profile">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="text-base">Vendor Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner Name</span>
                    <span className="font-medium text-slate-800">{vendor.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-800">{vendor.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span
                      className={`font-medium ${
                        vendor.verificationStatus === "verified"
                          ? "text-green-600"
                          : "text-orange-500"
                      }`}
                    >
                      {vendor.verificationStatus ?? "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stores</span>
                    <span className="font-medium text-slate-800">{stores.length}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}