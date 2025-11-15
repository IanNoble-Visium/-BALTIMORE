# Baltimore Smart City Command Center

A comprehensive smart city dashboard for monitoring and managing Ubicquia devices, alerts, and KPIs across Baltimore. Built with React, TypeScript, tRPC, PostgreSQL, and modern visualization libraries.

## 🎯 Overview

The Baltimore Smart City Command Center provides real-time monitoring, analytics, and management capabilities for smart city infrastructure. The platform integrates with Ubicquia devices to collect and visualize critical data including device health, alerts, network performance, and operational KPIs.

## ✨ Features

### 🏠 Landing Page
- **Video Background Support**: Dynamic b-roll video backgrounds with smooth transitions
- **Baltimore Branding**: Custom color scheme (Black #000000, Gold #FFC72C) with Baltimore flag imagery
- **Pre-filled Login Form**: Streamlined authentication experience
- **Smooth Animations**: Parallax effects and golden glow CTAs

### 📊 Main Dashboard
- **Real-time KPI Cards**:
  - Average Resolution Time
  - Feeder Efficiency Rating
  - Network Status Summary (Online/Offline)
  - Active Alerts Count
  - Device Health Score
- **AI Command Assistant**: Interactive chat interface with OpenAI integration
  - Enhanced prompt templates for common queries
  - Device health analysis
  - Alert pattern detection
  - Performance insights
  - Predictive maintenance suggestions
- **Baltimore Data Highlights**: Recent events and data points
- **Quick Stats**: Device and alert statistics at a glance

### 🗺️ Interactive Map
- **Mapbox GL Integration**: High-performance 3D map rendering
- **Device Markers**: Color-coded markers by status (Online, Offline, Warning, Power Loss)
- **Heatmap Overlay**: Incident density visualization
- **Marker Clustering**: Automatic clustering for overlapping nodes
- **Click-to-Drill-Down**: Interactive device details modal
- **Fit-to-Bounds**: Automatic map bounds adjustment
- **Status Filtering**: Filter devices by status type

### 📈 Analytics Visualizations
- **Alert Timeline**: Line chart showing alert trends over time
- **Alert Type Distribution**: Donut chart for alert type breakdown
- **Device Status Chart**: Bar chart showing device status distribution
- **Burn Hours Distribution**: Histogram of device operational hours
- **Network Type Performance**: Grouped bar chart comparing network types
- **Chart Animations**: Smooth transitions and hover effects
- **Drill-Down Functionality**: Click charts to view detailed data modals

### 🌐 Network Relationship Graph
- **D3.js Force-Directed Graph**: Interactive network visualization
- **Node Types**: Control Stations, Devices, Sensors
- **Edge Types**: Primary Link, Backup Link, Data Flow
- **Interactive Features**:
  - Drag nodes to reposition
  - Zoom and pan controls
  - Filter by node/edge type
  - Node click modal with details
- **Color-Coded Legend**: Visual guide for node and edge types

### 📋 Data Explorer
- **CSV Import/Export**: Upload and download data in CSV format
- **AI-Powered Import**: Optional OpenAI integration for alert type inference
- **Data Preview**: View parsed data before import
- **Quick Filters**: Filter by severity, status, and date range
- **Sparkline Charts**: Visual trend indicators
- **Pagination**: Efficient handling of large datasets
- **Search Functionality**: Full-text search across devices and alerts

### 📊 Data Tables
- **Sortable Columns**: Click headers to sort
- **Advanced Filtering**: Multiple filter criteria
- **Pagination Controls**: Configurable page sizes
- **Export Options**: CSV download functionality

### ⚡ Ubicell UGU Section
- **Device Information**: Comprehensive device specifications
- **3D Renderings**: Visual device diagrams
- **Data Collection Capabilities**: 32+ data points documentation
- **UbiVu Cloud Integration**: Connection details and architecture

### 🔐 Authentication & Security
- **OAuth Integration**: Secure authentication flow
- **Role-Based Access**: Admin and user roles
- **JWT Tokens**: Secure session management
- **Protected Routes**: Route-level access control

## 🏗️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend] --> B[Wouter Router]
        B --> C[Dashboard Pages]
        B --> D[Interactive Map]
        B --> E[Analytics]
        B --> F[Network Graph]
        B --> G[Data Explorer]
    end
    
    subgraph "API Layer"
        H[tRPC Server] --> I[Express Middleware]
        I --> J[Context Provider]
        J --> K[Auth Middleware]
    end
    
    subgraph "Business Logic"
        L[Device Router] --> M[Database Layer]
        N[Alert Router] --> M
        O[KPI Router] --> M
        P[AI Router] --> Q[OpenAI API]
        R[Import Router] --> M
        R --> Q
    end
    
    subgraph "Data Layer"
        M --> S[(PostgreSQL)]
        S --> T[Devices Table]
        S --> U[Alerts Table]
        S --> V[KPIs Table]
        S --> W[Users Table]
    end
    
    A --> H
    H --> L
    H --> N
    H --> O
    H --> P
    H --> R
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant tRPC
    participant Server
    participant Database
    participant OpenAI
    
    User->>Frontend: Interact with Dashboard
    Frontend->>tRPC: Query/Mutation Request
    tRPC->>Server: Process Request
    Server->>Database: Query Data
    Database-->>Server: Return Results
    Server-->>tRPC: Formatted Response
    tRPC-->>Frontend: Type-Safe Data
    Frontend-->>User: Render UI
    
    Note over User,OpenAI: AI Chat Flow
    User->>Frontend: Send Chat Message
    Frontend->>tRPC: ai.chat Mutation
    tRPC->>Server: Process Chat
    Server->>OpenAI: LLM Request
    OpenAI-->>Server: AI Response
    Server-->>tRPC: Formatted Response
    tRPC-->>Frontend: Chat Message
    Frontend-->>User: Display Response
```

## 🧠 AI & Voice Experience

### Overview

The Baltimore Smart City Command Center includes a full AI and voice layer that sits on top of the live dashboard data:

- **AI Command Assistant** (Dashboard)
- **AI Insights** page (alert patterns, summaries, predictive maintenance)
- **Voice briefings** for KPIs, alerts, analytics, and AI insights
- **Spoken alert announcements** on the Interactive Map

All of these features are powered by:

- **tRPC router** under `ai.*`
- **OpenAI Chat Completions API** (LLM) via `invokeLLM`
- **OpenAI Text-to-Speech API** via `ai.speakAlert` and `ai.speakText`
- Live **PostgreSQL data** (devices, alerts, KPIs) accessed through Drizzle-based helpers

### How AI Chat Works

#### 1. AI Command Assistant (Dashboard)

- UI component: `AIChatBox` rendered on `Dashboard.tsx` under **AI Command Assistant**.
- User messages are accumulated into a `messages: Message[]` array.
- When the user sends a message:
  - The client calls `trpc.ai.chat.mutate({ messages })`.

On the server (`server/routers.ts`):

- `ai.chat` receives the messages and fetches **live dashboard data**:
  - `getDeviceStatistics()`
  - `getAlertStatistics()`
  - `getLatestKPIs()`
  - `getActiveAlerts()`
- It builds a **system context message** that describes:
  - Total devices, online/offline counts
  - Active alert counts by severity
  - Current device health score and average resolution time
  - A few sample active alerts (severity, type, deviceId)
- This context message is prepended to the message list:
  - `[contextMessage, ...input.messages]`
- The combined messages are sent to `invokeLLM`, which calls the OpenAI Chat Completions API (`gpt-4o-mini`).
- The first choice is returned as the assistant’s response and streamed back through tRPC.

This means the assistant always answers with **current Command Center context**, not just a generic chat.

#### 2. AI Insights Page

On the `/ai` route (`AI.tsx`):

- tRPC queries fetch AI-augmented data:
  - `trpc.ai.detectAlertPatterns`
  - `trpc.ai.summarizeAlerts`
  - `trpc.ai.getPredictiveMaintenanceScores`
- These endpoints (defined under `ai.*` in `server/routers.ts`) use the same `invokeLLM` helper to:
  - Analyze alert history for patterns
  - Generate executive summaries and recommendations
  - Score devices for predictive maintenance priority

The AI Insights page displays:

- Pattern summaries + detected patterns list
- Alert executive summaries, key points, and recommendations
- Maintenance scores and AI-generated maintenance insights

### How Voice & TTS Work

#### TTS Endpoints

Two tRPC mutations handle Text-to-Speech using the OpenAI audio API:

- `ai.speakAlert`
  - Inputs: `title`, optional `deviceName`, optional `severity`.
  - Builds a short urgent phrase (e.g. *"Urgent alert. Power Loss at device BAL000321. Severity critical."*).
  - Calls `https://api.openai.com/v1/audio/speech` with model `tts-1` and a randomly chosen voice from `alloy | shimmer | verse`.
  - Returns `audioBase64` (MP3) and `voice`.

- `ai.speakText`
  - Inputs: `text`, optional `tone` string.
  - Optional tone is used to nudge OpenAI (e.g. *"Calm, executive analytics summary:"*).
  - Same TTS endpoint and voice selection.
  - Returns `audioBase64` and `voice`.

#### Where Voice is Used

- **Interactive Map – Device Alarm Dialog**
  - On dialog open, `ai.speakAlert` is called for the primary alert on that device.
  - The MP3 is played immediately and cached as a `data:audio/mp3;base64,…` URL.
  - A replay button with tooltip **"Replay alert audio"** replays from cache.

- **Dashboard – KPI Briefing**
  - Speaker icon above the KPI cards calls `ai.speakText` with a script like:
    - *"Baltimore Smart City Command Center status update. There are X devices, Y online, Z offline, and A active alerts. Overall system health score is H percent."*
  - Tone is based on **highest alert severity**.

- **Dashboard – Most Severe Alert**
  - Speaker icon in Recent Alerts card calls `ai.speakText` with:
    - *"Baltimore Smart City Command Center critical alert. Power Loss at device BAL000321, reported at …"*
  - Uses severity-based tones and caches the audio.

- **Dashboard – AI Command Assistant (Voice)**
  - Speaker icon in the AI card header calls `ai.speakText` with the **last assistant message**.
  - Tone: *"Calm, helpful explanation for city operations staff:"*.
  - Audio is cached so replay does not re-call TTS.

- **Analytics Page – Analytics Summary**
  - Speaker icon in the Analytics header calls `ai.speakText` with a short analytics summary:
    - Devices count, dominant status, total alerts, and dominant severity.
  - Tone: *"Calm, executive analytics summary:"*.

- **AI Insights – AI Briefing**
  - Speaker icon in the AI Insights header calls `ai.speakText` with a multi-sentence briefing:
    - Mentions patterns, summaries, and maintenance scores when available.
  - Tone: *"Calm, executive AI insights briefing for city operations leaders:"*.

All of these voice features **cache the returned audio URL** so repeated clicks replay instantly without additional OpenAI calls.

### AI & Voice Flow Diagrams

#### AI Command Assistant Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant tRPC as tRPC ai.chat
    participant Server
    participant DB as PostgreSQL
    participant OpenAI

    User->>Dashboard: Ask AI question
    Dashboard->>tRPC: ai.chat({ messages })
    tRPC->>Server: Forward request
    Server->>DB: getDeviceStatistics / getAlertStatistics / getLatestKPIs / getActiveAlerts
    DB-->>Server: Live stats + alerts
    Server->>Server: Build system context message
    Server->>OpenAI: invokeLLM(messages + context)
    OpenAI-->>Server: AI completion
    Server-->>tRPC: { content }
    tRPC-->>Dashboard: Assistant message
    Dashboard-->>User: Render AI response in AIChatBox
```

#### Voice Briefing Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI (Dashboard / Map / AI)
    participant tRPC as tRPC ai.speakText / ai.speakAlert
    participant Server
    participant OpenAI

    User->>UI: Click speaker icon
    alt audio cached
        UI->>UI: Replay cached data:audio/mp3 URL
    else no cache
        UI->>tRPC: speakText / speakAlert
        tRPC->>Server: Forward request
        Server->>OpenAI: TTS request (model tts-1)
        OpenAI-->>Server: MP3 bytes
        Server-->>tRPC: audioBase64
        tRPC-->>UI: audioBase64
        UI->>UI: Cache data:audio/mp3 URL
        UI->>UI: Play audio
    end
```

### Database Schema

```mermaid
erDiagram
    USERS ||--o{ ALERTS : creates
    DEVICES ||--o{ ALERTS : generates
    DEVICES ||--o{ KPIS : contributes_to
    
    USERS {
        serial id PK
        varchar openId UK
        text name
        varchar email
        enum role
        timestamp createdAt
    }
    
    DEVICES {
        serial id PK
        varchar deviceId UK
        varchar nodeName
        varchar latitude
        varchar longitude
        varchar alertType
        varchar nodeStatus
        varchar networkType
        timestamp lastUpdate
    }
    
    ALERTS {
        serial id PK
        varchar deviceId FK
        timestamp timestamp
        varchar alertType
        enum severity
        enum status
        integer resolutionTime
        text description
    }
    
    KPIS {
        serial id PK
        timestamp timestamp
        float avgResolutionTime
        float feederEfficiency
        integer activeAlertsCount
        float deviceHealthScore
    }
```

## 🚀 Installation

### Prerequisites

- **Node.js**: v18.x or higher
- **pnpm**: v10.x or higher
- **PostgreSQL**: v14.x or higher
- **OpenAI API Key**: (Optional, for AI features)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd @BALTIMORE
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/baltimore_smart_city

# Authentication
JWT_SECRET=your-secret-key-here
OWNER_OPEN_ID=your-openid-here
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id

# OpenAI (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Mapbox (Required for Interactive Map)
VITE_MAPBOX_TOKEN=your-mapbox-token

# Server
PORT=3000
NODE_ENV=development
```

### Step 4: Database Setup

```bash
# Generate migration files
pnpm db:push

# Seed the database with initial data
node scripts/seed-db.mjs

# Create admin user
node scripts/seed-admin.mjs
```

### Step 5: Build the Application

```bash
# Development build
pnpm build

# Production build
NODE_ENV=production pnpm build
```

### Step 6: Start the Application

```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

The application will be available at `http://localhost:3000`

## 🐳 Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- PostgreSQL database accessible from cluster
- Docker registry access

### Step 1: Build Docker Image

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

Build and push the image:

```bash
docker build -t your-registry/baltimore-smart-city:latest .
docker push your-registry/baltimore-smart-city:latest
```

### Step 2: Create Kubernetes Manifests

#### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: baltimore-smart-city
```

#### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: baltimore-config
  namespace: baltimore-smart-city
data:
  NODE_ENV: "production"
  PORT: "3000"
```

#### Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: baltimore-secrets
  namespace: baltimore-smart-city
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres-service:5432/baltimore_smart_city"
  JWT_SECRET: "your-jwt-secret"
  OWNER_OPEN_ID: "your-openid"
  OAUTH_SERVER_URL: "https://your-oauth-server.com"
  VITE_OAUTH_PORTAL_URL: "https://your-oauth-portal.com"
  VITE_APP_ID: "your-app-id"
  OPENAI_API_KEY: "sk-your-openai-key"
  VITE_MAPBOX_TOKEN: "your-mapbox-token"
```

#### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: baltimore-smart-city
  namespace: baltimore-smart-city
  labels:
    app: baltimore-smart-city
spec:
  replicas: 3
  selector:
    matchLabels:
      app: baltimore-smart-city
  template:
    metadata:
      labels:
        app: baltimore-smart-city
    spec:
      containers:
      - name: app
        image: your-registry/baltimore-smart-city:latest
        ports:
        - containerPort: 3000
          name: http
        envFrom:
        - configMapRef:
            name: baltimore-config
        - secretRef:
            name: baltimore-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/trpc/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/trpc/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: baltimore-smart-city
  namespace: baltimore-smart-city
spec:
  selector:
    app: baltimore-smart-city
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: LoadBalancer
```

#### Ingress (Optional)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: baltimore-smart-city
  namespace: baltimore-smart-city
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - baltimore.visiumtechnologies.com
    secretName: baltimore-tls
  rules:
  - host: baltimore.visiumtechnologies.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: baltimore-smart-city
            port:
              number: 80
```

### Step 3: Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n baltimore-smart-city
kubectl get svc -n baltimore-smart-city
kubectl get ingress -n baltimore-smart-city
```

### Step 4: Database Migration

Run database migrations in a Kubernetes job:

```yaml
# k8s/migrate-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: baltimore-smart-city
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: your-registry/baltimore-smart-city:latest
        command: ["sh", "-c", "pnpm db:push"]
        envFrom:
        - secretRef:
            name: baltimore-secrets
      restartPolicy: Never
  backoffLimit: 3
```

```bash
kubectl apply -f k8s/migrate-job.yaml
kubectl logs -f job/db-migrate -n baltimore-smart-city
```

## 📦 Technology Stack

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Wouter**: Lightweight routing
- **tRPC**: End-to-end typesafe APIs
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Component library
- **Recharts**: Chart visualizations
- **D3.js**: Network graph visualization
- **Mapbox GL**: Interactive maps
- **Framer Motion**: Animations

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **tRPC**: Type-safe API layer
- **PostgreSQL**: Database
- **Drizzle ORM**: Database toolkit
- **OpenAI API**: AI chat functionality
- **JWT**: Authentication

### DevOps
- **Vite**: Build tool
- **esbuild**: Fast bundler
- **Docker**: Containerization
- **Kubernetes**: Orchestration

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm check            # Type check
pnpm format           # Format code
pnpm test             # Run tests

# Database
pnpm db:push          # Generate and apply migrations
```

### Project Structure

```
.
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities
│   │   └── App.tsx      # Main app component
│   └── public/          # Static assets
├── server/              # Backend server
│   ├── _core/           # Core server modules
│   ├── routers.ts        # tRPC routers
│   └── db.ts            # Database functions
├── api/                 # Vercel serverless functions
├── drizzle/             # Database schema and migrations
├── k8s/                 # Kubernetes manifests
└── scripts/             # Utility scripts
```

## 🔒 Security Considerations

- Environment variables for sensitive data
- JWT token-based authentication
- Role-based access control (RBAC)
- SQL injection prevention via Drizzle ORM
- CORS configuration
- Rate limiting (recommended for production)

## 📝 API Documentation

### tRPC Endpoints

The application uses tRPC for type-safe API communication. Key routers include:

- `devices.*`: Device data queries
- `alerts.*`: Alert management
- `kpis.*`: KPI data
- `ai.chat`: AI chat functionality
- `import.csv`: CSV data import
- `admin.*`: Admin operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License

## 👥 Authors

Visium Technologies

## 🙏 Acknowledgments

- Ubicquia for device integration
- Baltimore City for partnership
- Open source community for excellent tools

---

For more information, visit [Visium Technologies](https://visiumtechnologies.com)

