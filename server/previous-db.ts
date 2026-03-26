import { eq } from "drizzle-orm";
import { drizzle as createDrizzle } from "drizzle-orm/node-postgres";
import { profiles } from "../drizzle/schema";
import { ENV } from './_core/env';
import { Pool } from "pg";

let _db: ReturnType<typeof createDrizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_pool) {
        _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      }
      _db = createDrizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getProfileById(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profile: database not available");
    return undefined;
  }

  const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Auth functions for Supabase
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(profiles).where(eq(profiles.id, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(user: { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: Date }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // For Supabase, profiles are created when auth.users are created
    // This function ensures the profile exists and updates it if needed
    const existing = await db.select().from(profiles).where(eq(profiles.id, user.openId)).limit(1);
    
    if (existing.length === 0) {
      // Profile doesn't exist yet, it should be created by Supabase auth trigger
      console.log("[Database] Profile for user", user.openId, "not found. It should be created by auth trigger.");
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// Market queries
export async function getMarkets() {
  const db = await getDb();
  if (!db) return [];
  const { markets } = await import("../drizzle/schema");
  const rows = await db.select().from(markets);
  return rows.map(row => ({
    ...row,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    // Keep DATE as plain YYYY-MM-DD string (no time)
    referenceDate: row.referenceDate ?? null,
  }));
}

// Commodity queries
export async function getCommodities() {
  const db = await getDb();
  if (!db) return [];
  const { commodities } = await import("../drizzle/schema");
  return db.select().from(commodities);
}

// TODO: add more feature queries here as your schema grows.

// Vendor queries
export async function getVendorByProfileId(profileId: string) {
  const db = await getDb();
  if (!db) return null;
  const { vendors } = await import("../drizzle/schema");
  const result = await db.select().from(vendors).where(eq(vendors.profileId, profileId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createVendor(data: { profileId: string; ownerName: string; phoneNumber: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendors } = await import("../drizzle/schema");
  const result = await db.insert(vendors).values(data).returning();
  return result[0];
}

// Vendor Stores queries
export async function getVendorStores(vendorId: string) {
  const db = await getDb();
  if (!db) return [];
  const { vendorStores } = await import("../drizzle/schema");
  return db.select().from(vendorStores).where(eq(vendorStores.vendorId, vendorId));
}

export async function createVendorStore(data: { vendorId: string; marketId: string; storeName: string; description?: string; imageUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendorStores } = await import("../drizzle/schema");
  const result = await db.insert(vendorStores).values(data).returning();
  return result[0];
}

// Vendor Products queries
export async function getVendorProducts(vendorStoreId: string) {
  const db = await getDb();
  if (!db) return [];
  const { vendorProducts } = await import("../drizzle/schema");
  return db.select().from(vendorProducts).where(eq(vendorProducts.vendorStoreId, vendorStoreId));
}

export async function getVendorProductsByCommodity(commodityId: string) {
  const db = await getDb();
  if (!db) return [];
  const { vendorProducts } = await import("../drizzle/schema");
  return db.select().from(vendorProducts).where(eq(vendorProducts.commodityId, commodityId));
}

export async function createVendorProduct(data: { vendorStoreId: string; commodityId: string; unitId: string; currentPrice: string; updatedBy: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendorProducts } = await import("../drizzle/schema");
  const result = await db.insert(vendorProducts).values({
    ...data,
    currentPrice: data.currentPrice,
  }).returning();
  return result[0];
}

export async function updateVendorProductPrice(vendorProductId: string, currentPrice: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendorProducts } = await import("../drizzle/schema");
  const result = await db.update(vendorProducts)
    .set({ currentPrice, lastUpdated: new Date() })
    .where(eq(vendorProducts.id, vendorProductId))
    .returning();
  return result[0];
}

// Price History queries
export async function getPriceHistory(vendorProductId: string) {
  const db = await getDb();
  if (!db) return [];
  const { priceHistory } = await import("../drizzle/schema");
  return db.select().from(priceHistory).where(eq(priceHistory.vendorProductId, vendorProductId));
}

// Price Reports queries
export async function createPriceReport(data: { vendorProductId: string; reportMessage: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { priceReports } = await import("../drizzle/schema");
  const result = await db.insert(priceReports).values(data).returning();
  return result[0];
}
