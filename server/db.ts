import { eq, sql } from "drizzle-orm";
import { drizzle as createDrizzle } from "drizzle-orm/node-postgres";
import { profiles } from "../drizzle/schema";
import { ENV } from './_core/env';
import { Pool } from "pg";

let _db: ReturnType<typeof createDrizzle> | null = null;
let _pool: Pool | null = null;

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

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(profiles).where(eq(profiles.id, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.id, user.openId)).limit(1);
    if (existing.length === 0) {
      console.log("[Database] Profile for user", user.openId, "not found. It should be created by auth trigger.");
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// ─── Market queries ───────────────────────────────────────────────────────────

export async function getMarkets() {
  const db = await getDb();
  if (!db) return [];
  const { markets } = await import("../drizzle/schema");
  const rows = await db.select().from(markets);
  return rows.map(row => ({
    ...row,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    referenceDate: row.referenceDate ?? null,
  }));
}

// ─── Commodity queries ────────────────────────────────────────────────────────

export async function getCommodities() {
  const db = await getDb();
  if (!db) return [];
  const { commodities } = await import("../drizzle/schema");
  return db.select().from(commodities);
}

export async function getCommodityById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const { commodities } = await import("../drizzle/schema");
  const result = await db.select().from(commodities).where(eq(commodities.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Returns a commodity with all vendor prices, joining:
 *   vendor_products → vendor_stores → vendors (owner_name)
 *   vendor_products → vendor_stores → markets (name, city, state)
 *   vendor_products → units (name)
 *
 * NOTE: commodities table has no description column — intentionally omitted.
 */
export async function getCommodityWithVendorPrices(commodityId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT
      c.id              AS commodity_id,
      c.name            AS commodity_name,
      c.category        AS commodity_category,
      vp.id             AS vendor_product_id,
      vp.current_price  AS price,
      u.name            AS unit_name,
      u.id              AS unit_id,
      vs.id             AS vendor_store_id,
      vs.store_name     AS store_name,
      v.id              AS vendor_id,
      v.owner_name      AS vendor_name,
      v.phone_number    AS vendor_phone,
      v.verification_status AS vendor_verification_status,
      m.id              AS market_id,
      m.name            AS market_name,
      m.city            AS market_city,
      m.state           AS market_state,
      m.market_type     AS market_type,
      vp.last_updated   AS last_updated
    FROM commodities c
    LEFT JOIN vendor_products vp  ON vp.commodity_id  = c.id
    LEFT JOIN units u             ON u.id             = vp.unit_id
    LEFT JOIN vendor_stores vs    ON vs.id            = vp.vendor_store_id
    LEFT JOIN vendors v           ON v.id             = vs.vendor_id
    LEFT JOIN markets m           ON m.id             = vs.market_id
    WHERE c.id = ${commodityId}
    ORDER BY vp.current_price ASC NULLS LAST
  `);

  if (!result.rows || result.rows.length === 0) return null;

  const firstRow = result.rows[0] as Record<string, unknown>;

  const commodity = {
    id: firstRow.commodity_id as string,
    name: firstRow.commodity_name as string,
    category: firstRow.commodity_category as string | null,
  };

  const vendorPrices = result.rows
    .filter((row) => (row as Record<string, unknown>).vendor_product_id != null)
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        vendorProductId: r.vendor_product_id as string,
        price: r.price != null ? Number(r.price) : null,
        unitName: r.unit_name as string | null,
        unitId: r.unit_id as string | null,
        storeName: r.store_name as string | null,
        vendorId: r.vendor_id as string | null,
        vendorName: r.vendor_name as string | null,
        vendorPhone: r.vendor_phone as string | null,
        vendorVerificationStatus: r.vendor_verification_status as string | null,
        marketId: r.market_id as string | null,
        marketName: r.market_name as string | null,
        marketCity: r.market_city as string | null,
        marketState: r.market_state as string | null,
        marketType: r.market_type as string | null,
        lastUpdated: r.last_updated ? new Date(r.last_updated as string) : null,
      };
    });

  return { commodity, vendorPrices };
}

/**
 * Returns price history for all vendor products of a given commodity.
 *
 * Averages multiple entries per (vendor, day) into a single data point
 * so the chart gets one clean value per vendor per day.
 *
 * Returns rows ordered by date ASC — ready for Recharts.
 */
export async function getPriceHistoryForCommodity(commodityId: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT
      DATE(ph.recorded_at)        AS day,
      ROUND(AVG(ph.price), 2)     AS avg_price,
      vp.id                       AS vendor_product_id,
      v.id                        AS vendor_id,
      v.owner_name                AS vendor_name,
      vs.store_name               AS store_name,
      m.name                      AS market_name,
      m.city                      AS market_city
    FROM price_history ph
    JOIN vendor_products vp ON vp.id  = ph.vendor_product_id
    JOIN vendor_stores vs   ON vs.id  = vp.vendor_store_id
    JOIN vendors v          ON v.id   = vs.vendor_id
    JOIN markets m          ON m.id   = vs.market_id
    WHERE vp.commodity_id = ${commodityId}
    GROUP BY
      DATE(ph.recorded_at),
      vp.id,
      v.id,
      v.owner_name,
      vs.store_name,
      m.name,
      m.city
    ORDER BY day ASC
  `);

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      // historyId not meaningful after GROUP BY — use a composite key on frontend
      historyId:       `${r.vendor_id}-${r.day}`,
      price:           r.avg_price != null ? Number(r.avg_price) : null,
      recordedAt:      r.day ? new Date(r.day as string) : null,
      source:          null, // averaged — source no longer meaningful
      vendorProductId: r.vendor_product_id as string,
      vendorId:        r.vendor_id as string,
      vendorName:      r.vendor_name as string,
      storeName:       r.store_name as string,
      marketName:      r.market_name as string,
      marketCity:      r.market_city as string | null,
    };
  });
}

// ─── Vendor queries ───────────────────────────────────────────────────────────

export async function getVendorByProfileId(profileId: string) {
  const db = await getDb();
  if (!db) return null;
  const { vendors } = await import("../drizzle/schema");
  const result = await db.select().from(vendors).where(eq(vendors.profileId, profileId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createVendor(data: {
  profileId: string;
  ownerName: string;
  phoneNumber: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendors } = await import("../drizzle/schema");
  const result = await db.insert(vendors).values(data).returning();
  return result[0];
}

// ─── Vendor Stores queries ────────────────────────────────────────────────────

export async function getVendorStores(vendorId: string) {
  const db = await getDb();
  if (!db) return [];
  const { vendorStores } = await import("../drizzle/schema");
  return db.select().from(vendorStores).where(eq(vendorStores.vendorId, vendorId));
}

export async function createVendorStore(data: {
  vendorId: string;
  marketId: string;
  storeName: string;
  description?: string;
  imageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { vendorStores } = await import("../drizzle/schema");
  const result = await db.insert(vendorStores).values(data).returning();
  return result[0];
}

// ─── Vendor Products queries ──────────────────────────────────────────────────

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

export async function createVendorProduct(data: {
  vendorStoreId: string;
  commodityId: string;
  unitId: string;
  currentPrice: string;
  updatedBy: string;
}) {
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
  const result = await db
    .update(vendorProducts)
    .set({ currentPrice, lastUpdated: new Date() })
    .where(eq(vendorProducts.id, vendorProductId))
    .returning();
  return result[0];
}

// ─── Price History queries ────────────────────────────────────────────────────

export async function getPriceHistory(vendorProductId: string) {
  const db = await getDb();
  if (!db) return [];
  const { priceHistory } = await import("../drizzle/schema");
  return db.select().from(priceHistory).where(eq(priceHistory.vendorProductId, vendorProductId));
}

// ─── Price Reports queries ────────────────────────────────────────────────────

export async function createPriceReport(data: {
  vendorProductId: string;
  reportMessage: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { priceReports } = await import("../drizzle/schema");
  const result = await db.insert(priceReports).values(data).returning();
  return result[0];
}