import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getMarkets: vi.fn(() => Promise.resolve([
    {
      id: "market-1",
      name: "Lekki Market",
      city: "Lagos",
      state: "Lagos",
      latitude: "6.4969",
      longitude: "3.5833",
      marketType: "daily",
      cycleLength: null,
      cyclePosition: null,
      referenceDate: null,
      imageUrl: null,
      createdAt: new Date(),
    },
    {
      id: "market-2",
      name: "Ibadan Central Market",
      city: "Ibadan",
      state: "Oyo",
      latitude: "7.3775",
      longitude: "3.9470",
      marketType: "rotational",
      cycleLength: 4,
      cyclePosition: 1,
      referenceDate: new Date("2026-03-01"),
      imageUrl: null,
      createdAt: new Date(),
    },
  ])),
  getCommodities: vi.fn(() => Promise.resolve([
    {
      id: "commodity-1",
      name: "Rice",
      category: "Grains",
      description: "Local rice",
      createdAt: new Date(),
    },
    {
      id: "commodity-2",
      name: "Tomato",
      category: "Vegetables",
      description: "Fresh tomatoes",
      createdAt: new Date(),
    },
  ])),
  getVendorByProfileId: vi.fn(() => Promise.resolve(null)),
  createVendor: vi.fn(),
  getVendorStores: vi.fn(() => Promise.resolve([])),
  createVendorStore: vi.fn(),
  getVendorProducts: vi.fn(() => Promise.resolve([])),
  getVendorProductsByCommodity: vi.fn(() => Promise.resolve([])),
  createVendorProduct: vi.fn(),
  updateVendorProductPrice: vi.fn(),
  getPriceHistory: vi.fn(() => Promise.resolve([])),
  createPriceReport: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

describe("Markets Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createPublicContext());
  });

  it("should list all markets", async () => {
    const markets = await caller.markets.list({});
    expect(markets).toHaveLength(2);
    expect(markets[0]?.name).toBe("Lekki Market");
    expect(markets[1]?.name).toBe("Ibadan Central Market");
  });

  it("should filter markets by city", async () => {
    const markets = await caller.markets.list({ city: "Lagos" });
    expect(markets).toHaveLength(1);
    expect(markets[0]?.city).toBe("Lagos");
  });

  it("should filter markets by market type", async () => {
    const markets = await caller.markets.list({ marketType: "rotational" });
    expect(markets).toHaveLength(1);
    expect(markets[0]?.marketType).toBe("rotational");
  });

  it("should get market by ID", async () => {
    const market = await caller.markets.getById("market-1");
    expect(market).not.toBeNull();
    expect(market?.name).toBe("Lekki Market");
  });

  it("should return null for non-existent market", async () => {
    const market = await caller.markets.getById("non-existent");
    expect(market).toBeNull();
  });
});

describe("Commodities Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createPublicContext());
  });

  it("should list all commodities", async () => {
    const commodities = await caller.commodities.list({});
    expect(commodities).toHaveLength(2);
    expect(commodities[0]?.name).toBe("Rice");
    expect(commodities[1]?.name).toBe("Tomato");
  });

  it("should filter commodities by category", async () => {
    const commodities = await caller.commodities.list({ category: "Grains" });
    expect(commodities).toHaveLength(1);
    expect(commodities[0]?.category).toBe("Grains");
  });

  it("should get commodity by ID", async () => {
    const commodity = await caller.commodities.getById("commodity-1");
    expect(commodity).not.toBeNull();
    expect(commodity?.name).toBe("Rice");
  });

  it("should return null for non-existent commodity", async () => {
    const commodity = await caller.commodities.getById("non-existent");
    expect(commodity).toBeNull();
  });
});
