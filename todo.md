# OjaAlert Project TODO

## Phase 1: Setup & Authentication
- [x] Configure Supabase connection and environment variables
- [x] Verify auth.users → profiles relationship in Supabase
- [x] Set up authentication context and hooks
- [x] Create login/logout UI components

## Phase 2: Market Discovery
- [x] Create markets table schema and queries
- [x] Build market search and filtering by city/state/type
- [x] Implement market list view with pagination
- [ ] Integrate Google Maps for market location display
- [x] Create market detail page

## Phase 3: Commodity Price Listings
- [x] Create commodities and units tables schema
- [x] Build commodity listing page with search
- [ ] Implement vendor products view with vendor/market info
- [ ] Create commodity detail page with all vendor prices
- [ ] Build price comparison view across vendors

## Phase 4: Price History & Trends
- [ ] Create price history table schema and queries
- [ ] Build price history chart visualization using Recharts
- [ ] Implement trend analysis (price changes over time)
- [ ] Create price history detail page
- [ ] Add date range filtering for historical data

## Phase 5: Vendor Management
- [x] Vendor dashboard page exists (basic shell)
- [x] Vendor store creation form (basic)
- [ ] Vendor product listing management UI
      — form to add a product (commodity + unit + price)
      — list of vendor's current products with prices
- [ ] Price update form — vendor can update current_price on a product
- [ ] Vendor verification status display
- [ ] Vendor profile creation flow (currently shows "No Vendor Profile" card)

## Phase 6: Price Reporting
- [ ] Create price reports table schema
- [ ] Build price report submission form
- [ ] Implement price report list for admins
- [ ] Create report status tracking UI
- [ ] Add report resolution workflow

## Phase 7: Rotational Market Calculator
- [ ] Implement rotational market day calculation logic
- [ ] Create next market day display component
- [ ] Build market calendar view showing market days
- [ ] Add cycle information display

## Phase 8: Testing & Quality
- [x] Write unit tests for market queries
- [ ] Write tests for price comparison logic
- [ ] Write tests for vendor product management
- [ ] Write tests for rotational market calculator
- [ ] Write integration tests for key flows

## Phase 9: Deployment & Polish
- [ ] Optimize database queries with indexes
- [ ] Implement caching strategy
- [ ] Set up error logging and monitoring
- [ ] Create deployment configuration
- [ ] Deploy to production
- [ ] Verify all features work in production

## Bugs & Issues
(None reported yet)
