# OjaAlert Project TODO

## Phase 1: Setup & Authentication ✅
- [x] Configure Supabase connection and environment variables
- [x] Migrate from Manus SDK to Supabase Auth (JWT via Bearer header)
- [x] Set up authentication context and hooks (useAuth.ts)
- [x] AuthModal — email+password + Google OAuth sign in/sign up
- [x] Sign out via supabase.auth.signOut()
- [x] Supabase profiles trigger (supabase_profiles_trigger.sql)
- [x] server/db.ts upsertUser safety net with onConflictDoNothing

## Phase 2: Market Discovery ✅
- [x] Markets table schema and queries
- [x] Market list view with city/state/type filters (reactive search)
- [x] RotationalMarketCalculator component — active today badge, next market date, countdown
- [x] Markets page uses RotationalMarketCalculator
- [x] Daily markets show "Open every day" banner
- [x] 8 markets seeded (6 rotational, 2 daily — all Abeokuta, Ogun)
- [ ] Google Maps integration for market location display (deferred)

## Phase 3: Commodity Detail + Vendor Prices ✅
- [x] Commodities table schema and queries
- [x] Commodity list page with search and category filter
- [x] Commodity cards link to /commodities/:id
- [x] CommodityDetail page — full detail route at /commodities/:id
- [x] getCommodityWithVendorPrices — JOIN query across vendor_products,
      vendor_stores, vendors, markets, units
- [x] Vendor price cards — ranked by price, verified badge, market name,
      store name, phone link, last updated
- [x] Stats bar — lowest / average / highest price
- [x] "By Market" breakdown section on detail page
- [x] Demo seed — 8 vendors, stores per market, prices for 3 commodities
- [ ] Vendor products view with full vendor/market info (Phase 5)
- [ ] Price comparison view across vendors (partially done via detail page)

## Phase 4: Price History & Trends ✅
- [x] Price history table confirmed (id, vendor_product_id, price, source, recorded_at)
- [x] getPriceHistoryForCommodity — JOIN query, averages prices per vendor per day
- [x] priceHistory.getByCommodity tRPC procedure
- [x] PriceHistoryChart component — multi-line Recharts LineChart
      - One colored line per vendor
      - Clickable legend to toggle vendors on/off
      - Custom tooltip (vendor name, price, market)
      - Responsive via ResponsiveContainer
      - Y axis formatted as ₦1.2k
- [x] Price history chart embedded in CommodityDetail page
- [x] 2976 price history rows seeded (32 products × ~93 entries, averaged to 31 days per vendor)
- [ ] Date range filtering for historical data (not yet built)
- [ ] Trend analysis indicators (not yet built)

## Phase 5: Vendor Management 🔲
- [x] Vendor dashboard page exists (basic shell)
- [x] Vendor store creation form (basic)
- [ ] Vendor product listing management UI
      — form to add a product (commodity + unit + price)
      — list of vendor's current products with prices
- [ ] Price update form — vendor can update current_price on a product
- [ ] Vendor verification status display
- [ ] Vendor profile creation flow (currently shows "No Vendor Profile" card)

## Phase 6: Price Reporting 🔲
- [ ] Price report submission form on commodity detail page
      — user flags a vendor price as incorrect
- [ ] priceReports.create tRPC mutation already exists in routers.ts
- [ ] Price report list for admins
- [ ] Report status tracking UI (open → reviewed → resolved)
- [ ] Report resolution workflow

## Phase 7: Rotational Market Calculator 🔲
- [x] Core calculation logic done in RotationalMarketCalculator component
- [x] Next market day display working on /markets page
- [ ] Standalone market calendar view showing all upcoming market days
- [ ] Cycle information display page

## Phase 8: Testing & Quality 🔲
- [x] Unit tests for market queries (markets.test.ts)
- [x] Unit tests for auth logout (auth.logout.test.ts)
- [ ] Tests for price comparison logic
- [ ] Tests for vendor product management
- [ ] Tests for rotational market calculator
- [ ] Integration tests for key flows

## Phase 9: Deployment & Polish 🔲
- [ ] Remove Manus leftovers:
      - server/_core/cookies.ts (unused)
      - server/_core/types/manusTypes.ts (unused)
      - server/routers.ts auth.logout still clears old Manus cookie (harmless)
- [ ] Optimize database queries with indexes
- [ ] Implement caching strategy
- [ ] Set up error logging and monitoring
- [ ] Create deployment configuration
- [ ] Deploy to production
- [ ] Verify all features work in production

## Known Issues / Tech Debt
- [ ] Markets.tsx and VendorDashboard.tsx still have their own page-level
      sub-headers (page title bars) — these sit below the shared Navbar.
      Intentional for now but can be cleaned up.
- [ ] Home.tsx "View Details" on market cards navigates to /markets list,
      not a specific market detail page (market detail page not built yet)
- [ ] No market detail page (/markets/:id) exists yet
- [ ] commodities table has no description column — removed from all queries

## Bugs Fixed
- [x] App route was path="" instead of path="/" — all routes rendered Home
- [x] getCommodityWithVendorPrices was selecting c.description which doesn't exist
- [x] seed_phase3.sql used updated_by='seed' which violated check constraint
      — fixed by setting to NULL
- [x] Price history seed generated 3 entries per day per vendor
      — fixed by averaging in getPriceHistoryForCommodity GROUP BY query