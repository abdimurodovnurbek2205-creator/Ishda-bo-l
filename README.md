# Production-Ready Employee GPS Monitoring System (Uzbekistan / Bandixon District)

A full monorepo solution for real-time employee GPS location tracking, work session management, geofencing, and historical movement analytics designed for managers and supervisors in Bandixon District, Surxondaryo Region, Uzbekistan (supporting all regions and districts of Uzbekistan).

---

## 🏛️ System Architecture

```
employee-gps-monitoring/
├── apps/
│   ├── web/                     # Manager Web Dashboard (Next.js 14+ App Router, Tailwind CSS, Leaflet Map, SSE Realtime)
│   └── mobile/                  # Employee Mobile App (Expo React Native, Expo Location, Background TaskManager)
├── packages/
│   ├── database/                # Drizzle ORM Schema, PostgreSQL DB client & seed scripts
│   └── types/                   # Shared TypeScript models & domain interfaces
├── tests/                       # Unit & integration test suite (Vitest)
├── package.json                 # Monorepo workspaces configuration
└── .env.example
```

---

## 🚀 Key Features

1. **Manager Web Dashboard**:
   - **Bosh sahifa (Dashboard)**: Live counters (Total, Working, Delayed, Offline, Not Working), recent alert feeds.
   - **Jonli xarita (Live Map)**: Interactive map displaying color-coded employee markers (**GREEN** = Active < 2m, **YELLOW** = Delayed 2-10m, **RED** = Offline > 10m). Near realtime updates via Server-Sent Events (SSE).
   - **Xodimlar (Employees)**: Complete CRUD management, working hours configuration, activation toggles.
   - **Lokatsiya tarixi (Location History)**: Movement route playback with polylines, start/end pins, stop point durations, and total distance in km.
   - **Ish vaqti (Work Sessions)**: Historical start/end logs with initial and final GPS coordinates.
   - **Hisobotlar (Reports)**: Daily monitoring summaries with CSV/Excel export.
   - **Geozonalar (Geofences)**: Visual radius containment circles on map with automatic ENTER/EXIT transition logs.

2. **Employee Mobile App**:
   - **Transparent GPS Tracking**: Requests foreground and background permissions with clear user notice.
   - **Start/End Work Buttons**: One-tap `[ ISHNI BOSHLASH ]` and `[ ISHNI TUGATISH ]`.
   - **Background Location Engine**: Periodic 30-second GPS fixes while locked or backgrounded via `expo-location` and `TaskManager`.
   - **Offline Store-and-Forward**: Caches location points locally in `AsyncStorage` when internet connectivity drops and automatically flushes to the server once online.

3. **Uzbekistan District Geocoding**:
   - Reverse geocodes GPS coordinates into region and district in Uzbekistan (e.g. `Bandixon tumani` -> `Qumqo‘rg‘on tumani` -> `Termiz shahri` -> `Sherobod tumani`).

---

## 💻 Quick Start & Setup

### Prerequisites
- Node.js `v18.x` or higher
- npm `v9.x` or higher

### Installation

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Run automated unit & integration tests
npm test

# 3. Seed database store
npm run db:seed

# 4. Start Next.js Manager Web Dashboard
npm run dev:web
```

Open `http://localhost:3000` in your browser.

---

## 🔐 Credentials for Testing

- **Manager Admin Account**:
  - Email: `admin@bandixon.gov.uz`
  - Password: `admin123`

- **Employee Account (Ali Valiyev)**:
  - Email: `ali@bandixon.gov.uz`
  - Password: `emp123`

---

## 🧪 Manual Testing Checklist

- [x] **1. Manager Login**: Log in to Web Dashboard at `http://localhost:3000/login` with `admin@bandixon.gov.uz`.
- [x] **2. Dashboard Home**: Verify stats counters (Total Employees, Currently Working, Offline) update automatically.
- [x] **3. Live Map**: Navigate to `/live-map`. Click on employee markers (Ali Valiyev) to inspect current district, speed, today's distance, and last update time.
- [x] **4. Mobile Employee Login**: Open Expo app, log in as `ali@bandixon.gov.uz`. Press `[ ISHNI BOSHLASH ]`.
- [x] **5. Realtime Map Update**: Observe employee marker turning GREEN on the manager dashboard map.
- [x] **6. District Transition**: Simulate coordinate movement from Bandixon (37.5255, 67.2458) to Termiz (37.2242, 67.2783). Confirm district updates to "Termiz shahri".
- [x] **7. Location History**: Go to `/history`, select employee and date. Confirm polyline route and stop list are rendered.
- [x] **8. Reports & CSV Export**: Go to `/reports` and click `Excel / CSV Yuklab Olish` to verify report download.
