import { pgTable, text, timestamp, uuid, numeric, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * OjaAlert Database Schema for Supabase PostgreSQL
 * All tables use UUID primary keys and timestamp fields
 */

// ========== MARKETS ==========
export const markets = pgTable(
  "markets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    marketType: text("market_type"),
    cycleLength: integer("cycle_length"),
    cyclePosition: integer("cycle_position"),
    referenceDate: timestamp("reference_date"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_markets_name").on(table.name),
    cityStateIdx: index("idx_markets_city_state").on(table.city, table.state),
  })
);

// ========== COMMODITIES ==========
export const commodities = pgTable(
  "commodities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_commodities_name").on(table.name),
    categoryIdx: index("idx_commodities_category").on(table.category),
  })
);

// ========== UNITS ==========
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
  },
  (table) => ({
    nameIdx: uniqueIndex("idx_units_name").on(table.name),
  })
);

// ========== PROFILES (linked to auth.users) ==========
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    name: text("name"),
    role: text("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    roleIdx: index("idx_profiles_role").on(table.role),
  })
);

// ========== VENDORS ==========
export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
    ownerName: text("owner_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    verificationStatus: text("verification_status").default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: index("idx_vendors_phone_number").on(table.phoneNumber),
  })
);

// ========== VENDOR STORES ==========
export const vendorStores = pgTable(
  "vendor_stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    storeName: text("store_name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index("idx_vendor_stores_vendor_id").on(table.vendorId),
    marketIdx: index("idx_vendor_stores_market_id").on(table.marketId),
  })
);

// ========== VENDOR PRODUCTS ==========
export const vendorProducts = pgTable(
  "vendor_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorStoreId: uuid("vendor_store_id").notNull().references(() => vendorStores.id, { onDelete: "cascade" }),
    commodityId: uuid("commodity_id").notNull().references(() => commodities.id),
    unitId: uuid("unit_id").notNull().references(() => units.id),
    currentPrice: numeric("current_price", { precision: 10, scale: 2 }),
    updatedBy: text("updated_by"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    storeIdx: index("idx_vendor_products_store").on(table.vendorStoreId),
    commodityIdx: index("idx_vendor_products_commodity").on(table.commodityId),
    unitIdx: index("idx_vendor_products_unit").on(table.unitId),
    uniqueProduct: uniqueIndex("unique_vendor_product_listing").on(table.vendorStoreId, table.commodityId, table.unitId),
  })
);

// ========== PRICE HISTORY ==========
export const priceHistory = pgTable(
  "price_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorProductId: uuid("vendor_product_id").notNull().references(() => vendorProducts.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    source: text("source"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("idx_price_history_product").on(table.vendorProductId),
    dateIdx: index("idx_price_history_date").on(table.recordedAt),
  })
);

// ========== PRICE REPORTS ==========
export const priceReports = pgTable(
  "price_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorProductId: uuid("vendor_product_id").references(() => vendorProducts.id, { onDelete: "cascade" }),
    reportMessage: text("report_message"),
    status: text("status").default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("idx_price_reports_product").on(table.vendorProductId),
    statusIdx: index("idx_price_reports_status").on(table.status),
  })
);

// ========== RELATIONS ==========
export const marketsRelations = relations(markets, ({ many }) => ({
  vendorStores: many(vendorStores),
}));

export const commoditiesRelations = relations(commodities, ({ many }) => ({
  vendorProducts: many(vendorProducts),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  vendorProducts: many(vendorProducts),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  vendors: many(vendors),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  profile: one(profiles, { fields: [vendors.profileId], references: [profiles.id] }),
  vendorStores: many(vendorStores),
}));

export const vendorStoresRelations = relations(vendorStores, ({ one, many }) => ({
  vendor: one(vendors, { fields: [vendorStores.vendorId], references: [vendors.id] }),
  market: one(markets, { fields: [vendorStores.marketId], references: [markets.id] }),
  vendorProducts: many(vendorProducts),
}));

export const vendorProductsRelations = relations(vendorProducts, ({ one, many }) => ({
  vendorStore: one(vendorStores, { fields: [vendorProducts.vendorStoreId], references: [vendorStores.id] }),
  commodity: one(commodities, { fields: [vendorProducts.commodityId], references: [commodities.id] }),
  unit: one(units, { fields: [vendorProducts.unitId], references: [units.id] }),
  priceHistory: many(priceHistory),
  priceReports: many(priceReports),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  vendorProduct: one(vendorProducts, { fields: [priceHistory.vendorProductId], references: [vendorProducts.id] }),
}));

export const priceReportsRelations = relations(priceReports, ({ one }) => ({
  vendorProduct: one(vendorProducts, { fields: [priceReports.vendorProductId], references: [vendorProducts.id] }),
}));

// ========== TYPES ==========
export type Market = typeof markets.$inferSelect;
export type Commodity = typeof commodities.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type VendorStore = typeof vendorStores.$inferSelect;
export type VendorProduct = typeof vendorProducts.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type PriceReport = typeof priceReports.$inferSelect;
