# Baltimore Smart City Dashboard - TODO

## Roadmap Phases

### Phase 1 – Core polish & UX
- [ ] Add breadcrumb navigation to main dashboard
- [ ] Add animated counter effects to KPI cards
- [ ] Implement interactive column sorting for data tables
- [ ] Add color-coded severity indicators in tables

### Phase 2 – Advanced analytics & real-time
- [ ] Implement real-time data updates (WebSocket or SSE)
- [ ] Implement global search across devices & alerts
- [ ] Extend drill-down modals to additional dashboard charts
- [ ] Prototype 3D city flyover using Mapbox 3D or React Three Fiber

### Phase 3 – AI & predictive operations
- [ ] Implement AI alert pattern detection & summarization flows
- [ ] Add predictive maintenance scoring based on Ubicell telemetry
- [ ] Add predictive maintenance suggestions UX

### Phase 4 – Production hardening
- [ ] Set up protected routes for dashboard (if needed beyond demo)
- [ ] Implement role-based access control (optional / future phase)
- [ ] Test all dashboard features end-to-end
- [ ] Performance optimization & code splitting by route
- [ ] Create user, API, and deployment documentation

---

## Database & Backend
- [x] Design database schema for devices, alerts, and KPIs
- [x] Create migration scripts for database tables
- [x] Import CSV data (ubicquia_active-alerts, ubicquia_adjusted_baltimore22, ubicquia_full_capabilities_baltimore, baltimoredataset)
- [x] Create seed script for populating database
- [x] Create mock data generator scripts
- [x] Set up tRPC procedures for devices data
- [x] Set up tRPC procedures for alerts data
- [x] Set up tRPC procedures for KPIs data
- [ ] Implement real-time data updates (WebSocket/SSE)

## Authentication
- [x] Configure admin user with credentials (admin@visium.com / Baltimore2025)
- [ ] Set up protected routes for dashboard (can remain relaxed for demo)
- [ ] Implement role-based access control (optional / future phase)

## UI Foundation & Theme
- [x] Configure Baltimore color scheme (Black #000000, Gold #FFC72C)
- [x] Set up Tailwind CSS with custom Baltimore theme
- [x] Configure status colors (Online, Power Loss, Warning, Offline)
- [x] Add custom fonts and typography
- [x] Set up dark mode as default theme

## Landing Page
- [x] Create landing page layout with Baltimore branding
- [x] Add video background support for b-roll
- [x] Implement pre-filled login form
- [x] Add smooth transitions and parallax/transition effects
- [x] Create "Enter Dashboard" CTA with golden glow effect
- [x] Add Baltimore flag imagery and Battle Monument

## Main Dashboard Layout
- [x] Create dashboard layout structure
- [x] Implement navigation system
- [ ] Add breadcrumb navigation
- [x] Create responsive grid system

## KPI Cards
- [x] Create KPI card component
- [x] Implement Average Resolution Time card
- [x] Implement Feeder Efficiency Rating card
- [x] Implement Network Status Summary card
- [x] Implement Active Alerts Count card
- [x] Implement Device Health Score card
- [ ] Add animated counter effects

## Interactive Map
- [x] Set up Mapbox GL / Leaflet integration
- [x] Create Baltimore-focused map with proper zoom
- [x] Add device markers with status colors
- [x] Implement heatmap overlay for incident density
- [x] Add clustering for overlapping nodes
- [x] Create click-to-drill-down functionality
- [x] Add device details modal

## Network Relationship Graph
- [x] Create force-directed graph with D3.js
- [x] Implement node types (Control Stations, Devices, Sensors)
- [x] Implement edge types (Primary Link, Backup Link, Data Flow)
- [x] Add interactive features (drag nodes, zoom, filter)
- [x] Create legend with color coding
- [x] Add node click modal with details

## Analytics Visualizations
- [x] Create Alert Timeline (line chart)
- [x] Create Alert Type Distribution (donut chart)
- [x] Create Device Status chart (bar chart)
- [x] Create Burn Hours Distribution (histogram)
- [x] Create Network Type Performance chart (grouped bar)
- [x] Implement chart animations
- [x] Add drill-down functionality for charts

## Ubicell UGU Section
- [x] Create Ubicell section layout
- [x] Add device diagrams (3D-style conceptual renderings)
- [ ] Add installation guide visuals
- [x] Display data collection capabilities
- [x] Explain 32+ data points
- [x] Show connection to UbiVu cloud

## Wow Factor Roadmap (Tier 2 & 3 Enhancements)
- [x] Implement map heatmap overlay for incident density
- [x] Add marker clustering and cluster drill-down
- [ ] Add animated counter effects to KPI cards
- [x] Implement sortable, filterable data tables for devices and alerts
- [x] Add CSV export for devices and alerts tables
- [ ] Add print-friendly report views
- [ ] Prototype 3D city flyover using Mapbox 3D or React Three Fiber
- [ ] Implement AI alert pattern detection & summarization flows
- [ ] Add predictive maintenance scoring based on Ubicell telemetry

## Data Tables
- [x] Create sortable data table component
- [ ] Implement interactive column sorting (per-column sort toggles)
- [x] Add date range filtering
- [x] Add alert type filtering
- [x] Add severity filtering
- [ ] Implement configurable pagination (50/100/500 rows)
- [x] Add CSV export functionality
- [ ] Add color-coded severity indicators

## File Upload Feature
- [x] Create drag & drop upload component
- [x] Implement CSV file parsing
- [ ] Add JSON file parsing (optional)
- [x] Add auto-detect schema functionality
- [x] Implement immediate visualization
- [x] Store uploaded data in PostgreSQL
- [x] Support Ubicquia-format CSVs via flexible importer

## Advanced Features
- [ ] Implement global search across all devices (beyond per-page search)
- [ ] Add 3D flyovers with React Three Fiber
- [x] Create drill-down modals for analytics chart elements
- [ ] Extend drill-down modals to remaining dashboard charts
- [ ] Implement AI alert pattern detection
- [ ] Add predictive maintenance suggestions

## Reference Dashboard Integration
- [ ] Review reference dashboard (https://trucdash-2dwdbjwe.manus.space/)
- [ ] Adapt design patterns to Baltimore theme
- [ ] Ensure consistent look and feel

## Video Prompts
- [x] Generate 50 video prompts for Google Veo Flow 3.1
- [x] Create prompts for login page b-roll
- [x] Create prompts for dashboard sections

## Testing & Optimization
- [ ] Test all dashboard features
- [ ] Verify data loading and display
- [ ] Test authentication flow
- [ ] Verify responsive design
- [ ] Test map interactions
- [ ] Test chart interactions
- [ ] Performance optimization
- [ ] Code splitting by route
- [ ] Lazy load charts
- [ ] Virtual scrolling for large tables

## Documentation
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Create deployment guide
