# Baltimore Smart City Dashboard - TODO

## Database & Backend
- [x] Design database schema for devices, alerts, and KPIs
- [x] Create migration scripts for database tables
- [x] Import CSV data (ubicquia_active-alerts, ubicquia_adjusted_baltimore22, ubicquia_full_capabilities_baltimore, baltimoredataset)
- [x] Create seed script for populating database
- [x] Create mock data generator scripts
- [x] Set up tRPC procedures for devices data
- [x] Set up tRPC procedures for alerts data
- [x] Set up tRPC procedures for KPIs data
- [ ] Implement real-time data updates (WebSocket)

## Authentication
- [x] Configure admin user with credentials (admin@visium.com / Baltimore2025)
- [ ] Set up protected routes for dashboard
- [ ] Implement role-based access control

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
- [x] Add smooth transitions and parallax effects
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
- [ ] Set up Mapbox GL / Leaflet integration
- [ ] Create Baltimore-focused map with proper zoom
- [ ] Add device markers with status colors
- [ ] Implement heatmap overlay for incident density
- [ ] Add clustering for overlapping nodes
- [ ] Create click-to-drill-down functionality
- [ ] Add device details modal

## Network Relationship Graph
- [ ] Create force-directed graph with D3.js
- [ ] Implement node types (Control Stations, Devices, Sensors)
- [ ] Implement edge types (Primary Link, Backup Link, Data Flow)
- [ ] Add interactive features (drag nodes, zoom, filter)
- [ ] Create legend with color coding
- [ ] Add node click modal with details

## Analytics Visualizations
- [ ] Create Alert Timeline (line chart)
- [ ] Create Alert Type Distribution (donut chart)
- [ ] Create Device Status chart (bar chart)
- [ ] Create Burn Hours Distribution (histogram)
- [ ] Create Network Type Performance chart (grouped bar)
- [ ] Implement chart animations
- [ ] Add drill-down functionality for charts

## Ubicell UGU Section
- [x] Create Ubicell section layout
- [x] Add device diagrams (3D renderings)
- [ ] Add installation guide visuals
- [x] Display data collection capabilities
- [x] Explain 32+ data points
- [x] Show connection to UbiVu cloud

## Wow Factor Roadmap (Tier 2 & 3 Enhancements)
- [ ] Implement map heatmap overlay for incident density
- [ ] Add marker clustering and cluster drill-down
- [ ] Add animated counter effects to KPI cards
- [ ] Implement sortable, filterable data tables for devices and alerts
- [ ] Add CSV export and print-friendly report views
- [ ] Prototype 3D city flyover using Mapbox 3D or React Three Fiber
- [ ] Implement AI alert pattern detection & summarization flows
- [ ] Add predictive maintenance scoring based on Ubicell telemetry

## Data Tables
- [ ] Create sortable data table component
- [ ] Implement column sorting
- [ ] Add date range filtering
- [ ] Add alert type filtering
- [ ] Add severity filtering
- [ ] Implement pagination (50/100/500 rows)
- [ ] Add CSV export functionality
- [ ] Add color-coded severity indicators

## File Upload Feature
- [ ] Create drag & drop upload component
- [ ] Implement CSV/JSON file parsing
- [ ] Add auto-detect schema functionality
- [ ] Implement immediate visualization
- [ ] Store uploaded data in PostgreSQL
- [ ] Support Ubicquia format

## Advanced Features
- [ ] Implement global search across all devices
- [ ] Add 3D flyovers with React Three Fiber
- [ ] Create drill-down modals for all chart elements
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
