# AATOS — Frontend Architecture

## 1. Executive Summary

The AATOS frontend is a multi-tenant, role-aware, internationalized web application built on modern React architecture. It serves:
- **Suppliers** managing profiles, products, and responding to RFQs
- **Buyers** discovering products, publishing RFQs, and managing procurement
- **Service Providers** (inspectors, freight, labs) managing bookings and reports
- **Platform Admins** monitoring verification, compliance, disputes, and platform health
- **Enterprise Clients** with private supplier networks and procurement portals

The frontend is designed to reduce trade friction — every screen should move a transaction forward.

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Framework** | React 19 + TypeScript 5.5 | Type safety, ecosystem, performance |
| **Build Tool** | Vite 5 | Fast HMR, optimized builds, ESM-native |
| **State Management** | Zustand (global) + React Query (server state) | Lightweight, atomic updates, caching, background refetch |
| **Routing** | React Router v6 | Nested routes, lazy loading, route guards |
| **Styling** | Tailwind CSS 3.4 + CSS Modules | Utility-first, design system consistency, tree-shaking |
| **Component Library** | Radix UI primitives + custom AATOS Design System | Accessible, composable, themeable |
| **Forms** | React Hook Form + Zod | Performance, validation, type-safe schemas |
| **Charts** | Recharts + D3 (custom) | Trade analytics, pricing intelligence |
| **Maps** | MapLibre GL (open-source Mapbox) | Supplier locations, logistics tracking, corridor visualization |
| **Real-time** | Socket.IO client | WebSocket events for deal rooms, notifications |
| **i18n** | react-i18next | 50+ languages, RTL support, trade terminology |
| **PWA** | Vite PWA plugin | Offline document viewing, mobile app-like experience |
| **Testing** | Vitest + React Testing Library + Playwright | Unit, integration, E2E |

## 3. Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AATOS WEB APPLICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Shell Layer                                                                 │
│  ├── AuthProvider (OAuth 2.0, token refresh, session management)            │
│  ├── OrganizationProvider (active org, permissions, context switching)      │
│  ├── I18nProvider (locale, translations, RTL)                               │
│  ├── ThemeProvider (light/dark, density, accessibility)                     │
│  ├── NotificationProvider (toast, in-app, push)                             │
│  ├── RealtimeProvider (WebSocket, event routing)                            │
│  └── ErrorBoundary (global error handling, reporting)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Feature Modules (Lazy-loaded)                                               │
│  ├── Dashboard         │  Marketplace      │  Deal Room                      │
│  ├── Organization      │  Products         │  RFQ Manager                    │
│  ├── Document Vault    │  Compliance       │  Messaging                      │
│  ├── Inspections       │  Payments         │  Logistics                      │
│  ├── Analytics         │  Admin            │  Settings                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Shared Components                                                           │
│  ├── Layout (AppShell, Sidebar, TopBar, Breadcrumbs)                        │
│  ├── Data Display (Tables, Cards, Lists, Grids, Kanban)                     │
│  ├── Forms (Inputs, Selects, File Upload, Rich Text, Date/Time)             │
│  ├── Feedback (Alerts, Modals, Drawers, Skeletons, Progress)                │
│  ├── Navigation (Tabs, Steps, Pagination, Filters, Sort)                    │
│  ├── Maps (Supplier Map, Route Map, Tracking Map)                           │
│  └── Charts (Price Trends, Volume Charts, Scorecards)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                                        │
│  ├── API Client (Axios, interceptors, retry, cancellation)                  │
│  ├── Query Client (React Query, caching, background sync)                   │
│  ├── Store (Zustand, slices: auth, org, ui, notifications)                  │
│  ├── Socket Client (Event handlers, reconnection, channel management)       │
│  └── Analytics (Segment/Amplitude, custom events)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Module Breakdown

### 4.1 Dashboard
**Primary User:** All roles
**Business Objective:** Provide at-a-glance trade activity, pending actions, and platform health

**Screens:**

#### Dashboard Home
```
┌────────────────────────────────────────────────────────────┐
│  AATOS Dashboard                              [Org Switch] │
├────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Active  │ │ Pending │ │  New    │ │  Trust  │        │
│  │  Deals  │ │ Actions │ │  RFQs   │ │  Score  │        │
│  │   12    │ │    5    │ │    3    │ │   87    │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                            │
│  ┌─────────────────────┐  ┌─────────────────────────┐    │
│  │  Deal Pipeline      │  │  Recent Activity        │    │
│  │  [Kanban Board]     │  │  • Quote accepted (2h)  │    │
│  │  RFQ → Quote →      │  │  • Inspection due (1d)  │    │
│  │  Contract → Ship    │  │  • Payment released     │    │
│  └─────────────────────┘  └─────────────────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Compliance Alerts                                  │ │
│  │  ⚠️ Export license expires in 15 days               │ │
│  │  ⚠️ 2 products missing destination compliance       │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `StatCard` — Metric display with trend indicator
- `DealPipeline` — Kanban board with drag-to-progress (for permitted roles)
- `ActivityFeed` — Real-time event stream
- `ComplianceAlertBanner` — Actionable compliance warnings
- `QuickActions` — One-click common tasks

**States:**
- Loading: Skeleton cards, shimmer pipeline
- Empty: "No active deals. Publish your first product or respond to an RFQ."
- Error: "Unable to load dashboard. Retry or contact support."

---

### 4.2 Organization Profile
**Primary User:** Organization admins, compliance officers
**Business Objective:** Establish and maintain verified trade identity

#### Profile Overview Screen
```
┌────────────────────────────────────────────────────────────┐
│  Nairobi Coffee Exporters Ltd                  [Edit] [Share]│
│  ★ Fully Verified  │  Kenya  │  Exporter  │  Trust: 87    │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │  VERIFICATION BADGES                                │  │
│  │  [✓] Business Registration  [✓] Physical Site      │  │
│  │  [✓] Banking Verified       [✓] Trade References   │  │
│  │  [○] Organic Certification (pending review)        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │  Business Details   │  │  Capacity & Capabilities    │ │
│  │  Registration: ...  │  │  Annual: 5,000 MT           │ │
│  │  Tax ID: ...        │  │  Processing: ✓              │ │
│  │  Address: ...       │  │  Cold Chain: ✓              │ │
│  │  [View on Map]      │  │  Storage: ✓                 │ │
│  └─────────────────────┘  └─────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  DOCUMENT VAULT (12 documents)                      │  │
│  │  [Export License] [Phytosanitary] [Organic Cert]    │  │
│  │  [Lab Report] [Bank Statement] [Tax Certificate]    │  │
│  │  [+ Upload New Document]                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PERFORMANCE METRICS                                │  │
│  │  Completed Deals: 47  │  Avg Deal Value: $45,200    │  │
│  │  On-Time Delivery: 96% │  Inspection Pass: 98%      │  │
│  │  Repeat Buyers: 12    │  Dispute Rate: 0.5%         │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `VerificationBadgeGrid` — Visual verification status
- `DocumentVaultGrid` — Document cards with expiry alerts
- `CapacityIndicators` — Visual capability display
- `PerformanceScorecard` — Trade history metrics
- `OrgMapPin` — Interactive location map

**Permissions:**
- Public: View limited profile (name, country, verification level, trust score)
- Member: View full profile, edit own fields
- Admin: Edit all, manage members, upload documents
- Platform: Review verification, approve/reject

---

### 4.3 Product Catalog (Supplier)
**Primary User:** Suppliers
**Business Objective:** Create buyer-ready product listings with category-specific attributes

#### Product Create/Edit Flow

**Step 1: Category Selection**
```
┌────────────────────────────────────────────────────────────┐
│  Create Product Listing                                    │
├────────────────────────────────────────────────────────────┤
│  Select Product Category:                                  │
│                                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │  ☕ Coffee │  │  🥑 Avocado│  │  🌾 Grains │            │
│  │  523 listed│  │  189 listed│  │  412 listed│            │
│  └────────────┘ └────────────┘ └────────────┘            │
│                                                            │
│  Coffee subcategories:                                     │
│  [Arabica] [Robusta] [Specialty] [Commercial]             │
│                                                            │
│  Selected: Arabica Coffee                                  │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

**Step 2: Attribute Form (Dynamic, Category-Specific)**
```
┌────────────────────────────────────────────────────────────┐
│  Arabica Coffee — Product Details                          │
├────────────────────────────────────────────────────────────┤
│  Basic Info                                                │
│  Title*: [Kenya AA Arabica Coffee - Washed Process      ] │
│  Description: [Rich text editor...                       ] │
│                                                            │
│  Category-Specific Attributes                              │
│  Variety*:     [Arabica ▼]                                │
│  Grade*:       [AA ▼]                                     │
│  Processing*:  [Washed ▼] [Natural ▼] [Honey ▼]          │
│  Crop Year*:   [2026 ▼]                                   │
│  Cupping Score:[87.5    ] (Range: 60-100)                 │
│  Moisture %:   [10.5     ] (Range: 8-12)                  │
│  Defect Count: [2        ]                                │
│  Screen Size:  [17/18 ▼]                                  │
│                                                            │
│  Origin & Availability                                     │
│  Origin Country*: [Kenya ▼]                               │
│  Region:       [Nyeri ▼]                                  │
│  Harvest Date: [2026-03-15  ]                             │
│  Available Qty*:[500      ] [MT ▼]                        │
│  MOQ:          [10        ] [MT ▼]                        │
│  Recurring:    [✓] Monthly supply available               │
│                                                            │
│  Pricing & Terms                                           │
│  FOB Price:    [4.85      ] [USD ▼] per [KG ▼]           │
│  CIF Price:    [5.45      ] [USD ▼] per [KG ▼]           │
│  Valid Until:  [2026-09-30  ]                             │
│  Incoterm:     [FOB ▼]                                    │
│                                                            │
│  [Save as Draft]  [Submit for Review]                      │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `CategorySelector` — Visual category tree with search
- `DynamicAttributeForm` — Generated from `product_category_attributes` schema
- `ImageGalleryUploader` — Multi-image upload with preview, reorder, primary selection
- `DocumentLinker` — Link existing vault documents to product
- `CompliancePreview` — Real-time compliance score preview per destination

**Validation (Zod Schema):**
```typescript
const productSchema = z.object({
  title: z.string().min(5).max(255),
  category_id: z.string().uuid(),
  attributes: z.record(z.any()).superRefine((val, ctx) => {
    // Dynamic validation based on category schema
  }),
  origin_country: z.string().length(2),
  available_quantity: z.number().positive(),
  price_fob: z.number().positive().optional(),
  price_cif: z.number().positive().optional(),
  certifications: z.array(z.string()),
});
```

---

### 4.4 Product Discovery (Buyer)
**Primary User:** Buyers, procurement officers
**Business Objective:** Find verified suppliers with products matching sourcing requirements

#### Product Search & Discovery
```
┌────────────────────────────────────────────────────────────┐
│  Find Products                              [Advanced 🔍] │
├────────────────────────────────────────────────────────────┤
│  Search: [kenya aa arabica coffee                    🔍]  │
│                                                            │
│  Filters:                                                  │
│  [Category: Coffee ▼] [Origin: Kenya ▼] [Grade: AA ▼]    │
│  [Cert: Organic ▼] [Price: $4-6 ▼] [Incoterm: FOB ▼]     │
│  [Verified Only ✓] [In Stock ✓] [CIF Available ✓]        │
│                                                            │
│  Sort: [Trust Score ▼]  View: [Grid ▼]                    │
│                                                            │
│  1,247 products found                                      │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ☕ Kenya AA Arabica — Washed Process               │  │
│  │  [Product Image]                                    │  │
│  │  Nairobi Coffee Exporters Ltd • Kenya • ★ Verified  │  │
│  │  FOB: $4.85/kg  │  CIF: $5.45/kg  │  500 MT avail  │  │
│  │  AA Grade │ Cupping: 87.5 │ Organic, Fair Trade    │  │
│  │  [View Details]  [Request Quote]  [Add to Compare]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ☕ Ethiopia Yirgacheffe — Natural                  │  │
│  │  [Product Image]                                    │  │
│  │  Sidama Coffee Cooperative • Ethiopia • ★ Verified  │  │
│  │  FOB: $5.20/kg  │  CIF: $5.90/kg  │  300 MT avail  │  │
│  │  Grade 1 │ Cupping: 89.0 │ Organic                 │  │
│  │  [View Details]  [Request Quote]  [Add to Compare]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  [Load More]  or  [Next →]                                 │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `SearchBar` — Full-text search with suggestions, history
- `FilterPanel` — Collapsible filter sidebar with active filter pills
- `ProductCard` — Rich product card with hover preview
- `ProductCompareDrawer` — Side-by-side comparison of selected products
- `SupplierMiniProfile` — Inline supplier trust indicators
- `MapViewToggle` — Switch between grid/list and map view

**Accessibility:**
- Keyboard navigation for filter panels
- Screen reader announcements for search results count
- High contrast mode for charts and trust scores
- Focus trapping in modals and drawers

---

### 4.5 RFQ Manager
**Primary User:** Buyers, procurement teams
**Business Objective:** Publish structured sourcing requests and manage supplier responses

#### RFQ Create Flow
```
┌────────────────────────────────────────────────────────────┐
│  Create Sourcing Request (RFQ)                             │
├────────────────────────────────────────────────────────────┤
│  Step 1 of 4: Product Requirements                         │
│  [=====>                ] 25%                              │
│                                                            │
│  What are you sourcing?                                    │
│  Category: [Coffee ▼]  Sub-category: [Arabica ▼]          │
│                                                            │
│  Specifications:                                           │
│  Grade: [AA ▼]  Processing: [Washed ▼]                    │
│  Cupping Score Min: [85    ]                               │
│  Crop Year: [2025, 2026 ▼]                                 │
│  Certifications Required: [Organic ✓] [Fair Trade □]      │
│                                                            │
│  [Back]  [Continue to Quantity →]                          │
└────────────────────────────────────────────────────────────┘
```

#### RFQ Detail with Quotes
```
┌────────────────────────────────────────────────────────────┐
│  RFQ: Arabica Coffee AA — 100MT Annual                     │
│  Status: Reviewing Quotes  │  23 matched  │  8 quotes     │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RFQ SUMMARY                                        │  │
│  │  Quantity: 100 MT  │  Destination: Hamburg, DE      │  │
│  │  Delivery: Sep-Dec 2026  │  Budget: $5.20/kg        │  │
│  │  Incoterm: CIF  │  Payment: 30/70 CAD              │  │
│  │  Deadline: Aug 15, 2026                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  QUOTATIONS RECEIVED (8)                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ★ RECOMMENDED                                      │  │
│  │  Nairobi Coffee Exporters Ltd • Kenya               │  │
│  │  Price: $5.10/kg CIF  │  Delivery: 45 days          │  │
│  │  Trust Score: 87  │  47 completed deals             │  │
│  │  [View Quote]  [Start Negotiation]  [Award Deal]    │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Sidama Coffee Cooperative • Ethiopia               │  │
│  │  Price: $5.05/kg CIF  │  Delivery: 60 days          │  │
│  │  Trust Score: 82  │  23 completed deals             │  │
│  │  [View Quote]  [Start Negotiation]  [Award Deal]    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  [Compare All Quotes]  [Download CSV]                      │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `RFQStepper` — Multi-step form with validation per step
- `QuoteCard` — Quote comparison card with AI-recommended badge
- `QuoteCompareTable` — Side-by-side price/terms comparison
- `SupplierTrustBadge` — Inline trust indicators
- `AwardDealModal` — Confirm award with deal creation

---

### 4.6 Deal Room
**Primary User:** Buyers and Suppliers (shared workspace)
**Business Objective:** Coordinate the full commercial journey from contract to delivery

#### Deal Room Interface
```
┌────────────────────────────────────────────────────────────┐
│  Deal: Kenya AA Coffee — 100MT to Hamburg        [• Live]  │
│  Buyer: Hamburg Specialty Roasters  │  Supplier: Nairobi Coffee│
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │  MILESTONE TRACKER                                  │  │
│  │  [✓] Contract Signed    [✓] Advance Paid           │  │
│  │  [→] Inspection (Due Sep 20)  [○] Shipment         │  │
│  │  [○] Main Payment       [○] Delivery               │  │
│  │                                                      │  │
│  │  Overall: 33% complete  │  On track                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────┐  ┌────────────────────────────────────┐ │
│  │  QUICK TABS  │  │  MESSAGES                          │ │
│  │              │  │                                    │ │
│  │  [Messages]  │  │  Hans Mueller (Buyer)  2:30 PM    │ │
│  │  [Documents] │  │  "Inspection report looks good.   │ │
│  │  [Contract]  │  │   Please proceed with shipment."  │ │
│  │  [Payments]  │  │                                    │ │
│  │  [Inspection]│  │  Jane Doe (Supplier)  2:35 PM     │ │
│  │  [Logistics] │  │  "Acknowledged. Booking freight   │ │
│  │  [Compliance]│  │   now. ETA Mombasa port: Sep 25." │ │
│  │              │  │                                    │ │
│  │  [Timeline]  │  │  [Type a message...           📎] │ │
│  │              │  │  [🇬🇧 EN] [Send]                   │ │
│  └──────────────┘  └────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  COMPLIANCE STATUS                                  │  │
│  │  ✓ Phytosanitary Certificate  ✓ Certificate of Origin│  │
│  │  ✓ Organic Certificate        ⏳ Export Permit (due) │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `MilestoneTracker` — Visual pipeline with status indicators
- `MessageThread` — Real-time messaging with file sharing, translation
- `DocumentSidebar` — Shared document repository for the deal
- `PaymentWidget` — Payment milestone status, timeline, release triggers (AATOS does not custody funds)
- `InspectionWidget` — Inspector booking, report viewer, acceptance flow
- `LogisticsWidget` — Freight tracking, route map, ETA updates
- `ComplianceWidget` — Checklist progress, missing items, document links

**Real-time Events:**
- New messages (with sound + notification)
- Milestone status changes
- Payment status updates
- Document uploads
- Inspection results

---

### 4.7 Compliance Dashboard
**Primary User:** Compliance officers, buyers, suppliers
**Business Objective:** Track and manage trade compliance requirements

#### Compliance Overview
```
┌────────────────────────────────────────────────────────────┐
│  Compliance Center                                         │
├────────────────────────────────────────────────────────────┤
│  Corridor: Kenya → Germany  │  Product: Arabica Coffee     │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  COMPLIANCE SCORE: 85/100  [Good]                   │  │
│  │                                                      │  │
│  │  Required Documents           Status       Due Date │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  Phytosanitary Certificate    ✓ Verified    -       │  │
│  │  Certificate of Origin        ✓ Verified    -       │  │
│  │  Organic Certificate          ✓ Verified    -       │  │
│  │  Export License               ⚠ Expires     Aug 15  │  │
│  │  EU Importer Registration     ⏳ Pending    Sep 01  │  │
│  │                                                      │  │
│  │  Required Inspections                                 │  │
│  │  Pre-shipment Inspection      ⏳ Booked     Sep 20  │  │
│  │                                                      │  │
│  │  Estimated Total Cost: $450  │  Time: 5 days         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  [Generate Checklist PDF]  [Find Service Providers]        │
└────────────────────────────────────────────────────────────┘
```

---

### 4.8 Document Vault
**Primary User:** All roles
**Business Objective:** Centralized, verified document management with AI extraction

#### Document Vault Grid
```
┌────────────────────────────────────────────────────────────┐
│  Document Vault                              [+ Upload]    │
├────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Type: Any ▼] [Status: Any ▼] [Search]  │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ 📄 Export   │ │ 📄 Phyto-   │ │ 📄 Organic   │         │
│  │    License  │ │   sanitary  │ │   Cert      │         │
│  │  ✓ Verified │ │  ✓ Verified │ │  ✓ Verified │         │
│  │  Exp: 12/31 │ │  Exp: 12/31 │ │  Exp: 06/30 │         │
│  │  [Download] │ │  [Download] │ │  [Download] │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ 📄 Bank     │ │ ⏳ Lab      │ │ ⚠️ Tax      │         │
│  │  Statement  │ │   Report    │ │   Cert      │         │
│  │  ✓ Verified │ │  Processing │ │  Expired    │         │
│  │  Exp: 12/31 │ │  --         │ │  Exp: 03/31 │         │
│  │  [Download] │ │  [View]     │ │  [Renew]    │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└────────────────────────────────────────────────────────────┘
```

**Components:**
- `DocumentUploader` — Drag-drop upload, virus scan progress, AI extraction progress
- `DocumentCard` — Thumbnail, status badge, expiry alert, actions
- `DocumentViewer` — PDF viewer with annotation, signature overlay
- `ExpiryAlertBanner` — Platform-wide alerts for expiring documents

---

### 4.9 Admin Dashboard
**Primary User:** Platform admins, compliance reviewers, verification agents
**Business Objective:** Monitor platform health, review verifications, manage disputes

#### Admin Home
```
┌────────────────────────────────────────────────────────────┐
│  AATOS Admin Dashboard                                     │
├────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Pending │ │ Active  │ │ GMV     │ │ Disputes│        │
│  │ Verif.  │ │  Deals  │  (MTD)   │  Open    │        │
│  │   47    │ │   156   │ │ $2.4M  │ │    3    │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  VERIFICATION QUEUE                                 │  │
│  │  Org                    Type      Submitted  Status │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  Acme Exporters       Exporter   2h ago     Review  │  │
│  │  Green Farm Coop      Cooperative 5h ago    Review  │  │
│  │  Global Imports       Importer   1d ago    Pending │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  FLAGGED TRANSACTIONS                               │  │
│  │  Deal ID    Risk Score   Flag Reason       Action   │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  deal_001   75           Unusual pricing   [Review] │  │
│  │  deal_002   82           Doc mismatch      [Review] │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Design System

### 5.1 Color Palette
```css
/* Primary */
--color-primary-50:  #f0fdf4;   /* Lightest green - backgrounds */
--color-primary-100: #dcfce7;
--color-primary-500: #22c55e;   /* Main brand green - trust, growth */
--color-primary-600: #16a34a;   /* Hover states */
--color-primary-700: #15803d;   /* Active states */
--color-primary-900: #14532d;   /* Text on light */

/* Trust Indicators */
--color-trust-high:   #22c55e;   /* Verified, passed */
--color-trust-medium: #f59e0b;   /* Pending, warning */
--color-trust-low:    #ef4444;   /* Failed, expired, high risk */
--color-trust-info:   #3b82f6;   /* Information, in-progress */

/* Neutral */
--color-gray-50:  #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-500: #6b7280;
--color-gray-700: #374151;
--color-gray-900: #111827;

/* Semantic */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error:   #ef4444;
--color-info:    #3b82f6;
```

### 5.2 Typography
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs:   0.75rem;   /* 12px - captions, badges */
--text-sm:   0.875rem;  /* 14px - body small, table cells */
--text-base: 1rem;      /* 16px - body */
--text-lg:   1.125rem;  /* 18px - lead text */
--text-xl:   1.25rem;   /* 20px - card titles */
--text-2xl:  1.5rem;    /* 24px - section headers */
--text-3xl:  1.875rem;  /* 30px - page titles */
--text-4xl:  2.25rem;   /* 36px - hero text */

--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
```

### 5.3 Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 5.4 Component Tokens
```css
--radius-sm: 0.25rem;   /* 4px - buttons, badges */
--radius-md: 0.5rem;    /* 8px - cards, inputs */
--radius-lg: 0.75rem;   /* 12px - modals, panels */
--radius-xl: 1rem;      /* 16px - large cards */

--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

## 6. State Management Architecture

```typescript
// Zustand Store Structure
interface AppStore {
  // Auth slice
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
  };
  
  // Organization slice
  organization: {
    currentOrg: Organization | null;
    organizations: Organization[];
    permissions: PermissionSet;
    members: OrganizationMember[];
    switchOrg: (orgId: string) => void;
  };
  
  // UI slice
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    locale: string;
    density: 'compact' | 'comfortable' | 'spacious';
    toggleSidebar: () => void;
    setTheme: (theme: string) => void;
  };
  
  // Notifications slice
  notifications: {
    unreadCount: number;
    notifications: Notification[];
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
  };
}
```

```typescript
// React Query Key Patterns
const queryKeys = {
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
    members: (id: string) => ['organizations', id, 'members'] as const,
    products: (id: string) => ['organizations', id, 'products'] as const,
  },
  products: {
    all: (filters: ProductFilters) => ['products', filters] as const,
    detail: (id: string) => ['products', id] as const,
    compliance: (id: string, destination?: string) => ['products', id, 'compliance', destination] as const,
  },
  deals: {
    all: (filters: DealFilters) => ['deals', filters] as const,
    detail: (id: string) => ['deals', id] as const,
    messages: (id: string) => ['deals', id, 'messages'] as const,
    milestones: (id: string) => ['deals', id, 'milestones'] as const,
  },
  rfqs: {
    all: (filters: RFQFilters) => ['rfqs', filters] as const,
    detail: (id: string) => ['rfqs', id] as const,
    quotes: (id: string) => ['rfqs', id, 'quotes'] as const,
  },
};
```

## 7. File Structure

```
src/
├── app/                          # Next.js App Router (or React Router)
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── layout.tsx            # Dashboard shell
│   │   ├── products/
│   │   ├── rfqs/
│   │   ├── deals/
│   │   ├── messages/
│   │   ├── documents/
│   │   ├── compliance/
│   │   ├── analytics/
│   │   └── settings/
│   ├── (admin)/
│   │   ├── verifications/
│   │   ├── disputes/
│   │   ├── users/
│   │   └── platform/
│   └── api/                      # API route handlers (if Next.js)
│
├── components/
│   ├── ui/                       # Primitive components (Button, Input, Card)
│   ├── layout/                   # Layout components (AppShell, Sidebar, TopBar)
│   ├── forms/                    # Form components (DynamicForm, FileUploader)
│   ├── data-display/             # Tables, Lists, Cards, Kanban
│   ├── feedback/                 # Alerts, Modals, Toasts, Skeletons
│   ├── navigation/               # Tabs, Breadcrumbs, Pagination
│   ├── maps/                     # Map components
│   └── charts/                   # Chart components
│
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── api/
│   ├── organizations/
│   ├── products/
│   ├── rfqs/
│   ├── deals/
│   ├── messages/
│   ├── documents/
│   ├── compliance/
│   ├── payments/
│   ├── inspections/
│   ├── logistics/
│   ├── analytics/
│   └── admin/
│
├── hooks/                        # Shared custom hooks
│   ├── useAuth.ts
│   ├── useOrganization.ts
│   ├── usePermissions.ts
│   ├── useRealtime.ts
│   ├── useDebounce.ts
│   └── useInfiniteScroll.ts
│
├── lib/                          # Utilities and configurations
│   ├── api/                      # API client, interceptors
│   ├── query-client.ts           # React Query configuration
│   ├── socket-client.ts          # WebSocket client
│   ├── i18n.ts                   # i18n configuration
│   ├── validation/               # Zod schemas
│   └── utils/                    # Helper functions
│
├── stores/                       # Zustand stores
│   ├── auth-store.ts
│   ├── organization-store.ts
│   ├── ui-store.ts
│   └── notification-store.ts
│
├── types/                        # TypeScript types
│   ├── api.ts
│   ├── models.ts
│   └── enums.ts
│
├── styles/                       # Global styles
│   ├── globals.css
│   └── design-tokens.css
│
└── public/                       # Static assets
    ├── locales/                  # Translation files
    │   ├── en/
    │   ├── fr/
    │   ├── sw/
    │   └── ...
    └── images/
```

## 8. Performance Strategy

| Technique | Implementation |
|---|---|
| **Code Splitting** | Route-level lazy loading, component-level dynamic imports |
| **Image Optimization** | WebP/AVIF, responsive sizes, lazy loading, blur placeholders |
| **Data Fetching** | React Query caching, stale-while-revalidate, prefetch on hover |
| **Virtualization** | React Virtual for long lists (products, messages, audit logs) |
| **Bundle Analysis** | Rollup plugin analyzer, budget enforcement |
| **Service Worker** | Workbox for offline document viewing, cached API responses |
| **Streaming SSR** | Next.js streaming for initial page load (if applicable) |

## 9. Mobile Strategy

The platform is **mobile-first responsive**:
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
- Touch targets: Minimum 44x44px
- Deal Room on mobile: Full-screen message view, swipe between tabs
- Document upload: Native camera integration, multi-file selection
- WhatsApp-style quick actions for suppliers

## 10. Accessibility (WCAG 2.1 AA)

- All interactive elements keyboard accessible
- Focus indicators visible
- Color not sole means of conveying information
- Screen reader tested with NVDA/VoiceOver
- Reduced motion support
- Form labels and error associations
- Skip links for navigation

---

*AATOS Frontend Architecture v1.0 | For Engineering Team*
