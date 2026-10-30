# CycleCare 🌸 — Modern Women's Health & Mindful Cycle Companion

CycleCare is an elegant, mobile-friendly, privacy-first women's health web application inspired by mindful cycle tracking, hormonal wellness, and personal autonomy.

Designed with soft blush pinks, whites, dreamy lavender, rounded cards, clean typography, intuitive navigation, and a welcoming dashboard.

---

## 🌟 Key Features & Pages

### 1. Welcome & Onboarding Wizard
- Personalized multi-step setup flow:
  - Welcome & Privacy pledge ("Your health data stays on your device")
  - Focus goal selection (*Period Tracking*, *Conception/TTC*, *Hormonal & Mood Wellness*, *Perimenopause*)
  - Cycle rhythm calibration (last period start date, cycle length slider, period duration slider)
  - Common signals & symptoms selection
  - Anonymous mode & discreet notifications preferences
- One-click "Explore Demo with Sample Data" option for instant exploration.

### 2. Welcoming Home Dashboard
- **Interactive Cycle Ring / Radial Progress Wheel**:
  - Live cycle day (e.g., Day 14) with color-coded phase indicator
  - Days remaining until next period countdown
  - Conception & pregnancy probability status
- **Action Shortcuts**:
  - `+ Log Today` quick symptom logging modal
  - Quick period flow toggle ("Period Started Today?")
- **Daily Hormonal Energy & Science Tip**:
  - Phase-specific insights (Estrogen, Progesterone, LH levels)
  - Nutrition, movement, and mindset guidance for today
- **7-Day Interactive Timeline Horizon Strip**:
  - Highlights flow days, predicted days, ovulation peak, and fertile window
- **Wellness Check-in Tools**:
  - 8-glass water hydration tracker with interactive tap-to-fill
  - Quick mood reflection pills (Calm, Joyful, Vibrant, Sensitive, Irritable, Anxious, Brain Fog)
  - Upcoming cycle milestones card (Next period, Ovulation, Luteal shift)

### 3. Period Calendar & Forecast
- Monthly calendar grid with month navigation and "Today" jump
- Color-coded badges for:
  - Recorded menstrual flow (solid berry/rose pills)
  - Predicted future period days (subtle dashed pink)
  - Fertile window (soft mint/emerald badges with leaf)
  - Ovulation day (distinct vibrant violet-egg ring with star)
  - Days with logged symptoms or journal notes
- **Day Inspector Sidebar**:
  - Tap any date to view logged symptoms, flow, and journal notes
  - Edit full log or mark flow directly for that date
- Clear visual color legend

### 4. Comprehensive Symptom Tracker
- Category-based multi-select tag grid:
  1. **Menstrual Flow**: None, Spotting, Light, Medium, Heavy
  2. **Physical Comfort & Pain**: Mild Cramps, Severe Cramps, Backache, Tender Breasts, Headache, Bloating, Pelvic Pressure, Fatigue
  3. **Mood & Emotional State**: Calm, Joyful, High Vitality, Sensitive, Irritable, Anxious, Brain Fog
  4. **Cervical Fluid / Mucus**: Dry, Sticky, Creamy, Egg White (Peak Fertility), Watery
  5. **Vitals & BBT**: Basal body temperature (°F/°C) and cervical markers
  6. **Private Journal**: Notes on supplements, medications, workouts, or reflections
- Date picker to log for today or past dates
- "Past Logs History" tab for quick review and editing

### 5. Cycle Insights & Analytics
- **Biometric scorecards**:
  - Regularity Score (e.g. 96% Predictable)
  - Average cycle length vs. 24-35 day normal range
  - Average period flow duration
  - Luteal phase length
- **Interactive Visual Charts**:
  - 6-cycle comparative bar chart (period days vs non-bleeding days)
  - Theoretical 4-phase endocrine waveform simulator (Estrogen, Progesterone, and LH curves across 28 days with interactive day slider)
  - Clinically correlated symptom patterns (e.g. cramps timing, luteal headaches)
- **OB/GYN Summary Export**:
  - One-click formatted medical report generator ready to print or save to PDF for healthcare visits

### 6. Health Education Academy
- Medically reviewed articles across Hormones, Nutrition, Fertility, Pelvic Health, and Wellness
- Search bar to filter by keywords, symptoms, or hormone names
- Category pills and saved articles bookmarking
- Full Article Reader Modal with estimated read time, author credentials, and key takeaways
- Interactive **Myth vs. Fact Quiz** with instant answers and scientific references

### 7. Settings & Local Privacy Vault
- **The CycleCare Privacy Guarantee**:
  - On-device local storage only
  - Zero ad trackers or third-party brokers
- **Anonymous Mode**: Masks personal names across reports and exports
- **Passcode (PIN) Lock**: 4-digit security code with simulated Face ID unlock
- **Cycle Tuning**: Sliders for cycle length (21-45 days) and bleeding duration (2-10 days)
- **Data Management**:
  - Download complete data backup (JSON)
  - Export logs table (CSV)
  - Reset to realistic sample demo data
  - Clear local storage safety control

---

## 💻 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript & Modern ES6+
- **Styling**: Tailwind CSS & Custom Design System (Soft pink `#FFF5F7`, Lavender `#FAF5FF`, Rose `#E11D48`, Deep Plum `#2D232E`)
- **Backend & Authentication**: Supabase (GoTrue Auth, PostgreSQL, Row Level Security)
- **Persistence**: Dual Architecture — Authenticated Supabase Cloud Sync + Local-First Fallback (LocalStorage)
- **Security**: Strict Row Level Security (`auth.uid() = user_id`), public `anon` key only, secret administrative keys blocked
- **Server**: Zero-dependency Node.js HTTP server

---

## 🔒 Supabase Authentication & Database Integration

CycleCare is integrated with **Supabase** to provide encrypted user authentication and private cloud database storage with strict PostgreSQL Row Level Security (RLS).

### Database Tables & Schema

All health data tables are strictly linked to `auth.users(id)` and protected by Row Level Security:

1. **`public.profiles`**
   - User settings, display alias, goals, cycle length, bleeding duration, luteal length, irregular cycle rhythm toggle, and PIN lock status.
   - Gated by: `auth.uid() = id` (SELECT, INSERT, UPDATE).
2. **`public.cycle_logs`**
   - Daily menstrual flow, physical symptoms array, moods array, cervical fluid, energy, sleep hours, sleep quality, hydration, basal temperature, libido, sexual activity, and journal notes.
   - Gated by: `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE).
3. **`public.past_cycles`**
   - Historical cycle boundaries, durations, ovulation markers, and clinical symptom summaries.
   - Gated by: `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE).
4. **Trigger: `on_auth_user_created`**
   - Automatically initializes a user profile row upon signup.

### 🛡️ Row Level Security (RLS) & API Security Rules

- **Strict Isolation**: Users can **only** read and modify their own records. Cross-user data leakage is prevented at the database level by PostgreSQL policies.
- **Client Security**: Frontend code **never** uses or exposes the Supabase `service_role` secret key. Only the public `anon` key is used.
- **Key Safety Guard**: The application actively checks provided keys and rejects any key containing `service_role` or administrative claims.

---

## 🛠️ Supabase Setup & Migration Guide

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Note your **Project URL** and **Public `anon` key** from `Project Settings -> API`.

### Step 2: Apply the Database Migration
1. In the Supabase Dashboard, navigate to the **SQL Editor**.
2. Open `supabase/migrations/20261029_init_cyclecare.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. This creates `profiles`, `cycle_logs`, `past_cycles`, enables RLS, creates policies, and installs the auto-profile trigger.

### Step 3: Configure Credentials

#### Option A: In-App UI Configuration (Easiest)
1. Open CycleCare in your browser.
2. Click the **Demo Mode (Sample Data)** pill in the header (or go to **Settings -> Supabase Cloud Sync**).
3. Switch to the **Cloud Setup** tab.
4. Paste your Supabase Project URL and public `anon` key.
5. Click **Save & Test Connection**.

#### Option B: Environment Variables (`.env`)
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🧪 Demo Mode vs. Cloud Sync

- **Demo Mode (Default)**:
  - CycleCare launches immediately with rich, realistic clinical sample data (Maya Chen, 28-day cycle, logged flow, follicular/luteal symptoms, OB/GYN history).
  - Clearly labeled with the `🧪 Demo Mode (Sample Data)` badge in the header.
  - Allows full offline exploration without requiring any Supabase credentials or internet access.
- **Authenticated Cloud Sync**:
  - Sign in or create an account via the **Auth Modal**.
  - Once signed in, the header displays `☁️ Synced: user@email.com` with a live pulse indicator.
  - All logs, symptom updates, and cycle parameter edits synchronize automatically with private Supabase tables protected by Row Level Security.
  - Manual sync ("Push & Sync to Cloud") and sign out are available in Settings.

---

## 🧪 Automated Testing

CycleCare includes an end-to-end automated test suite verifying server endpoints, static routing, mathematical cycle projections, irregular cycle uncertainty widening, symptom trend aggregation, zero-data safety, Supabase security token enforcement, and educational content standards.

Run the test suite with:
```bash
npm test
# or directly with Node:
node test_cyclecare.js
```

### Test Coverage Highlights (22/22 Passing):
- **Suite 1: Server Endpoints & Static Routing**: Validates `/api/health`, `/env.js` injection, `/` viewport & branding, `/cyclecare.js` asset delivery, and SPA route fallback.
- **Suite 2: Cycle Calculations & Phase Forecasting**: Accurate cycle day indexing, menstrual phase detection, fertile window calculation, ovulation date prediction, and luteal phase transitions.
- **Suite 3: Irregular Cycles & Uncertainty Handling**: Verifies prediction margin automatically widens from ±1 to ±3 days (spanning 6 days total) when irregular cycles are flagged or when historical variance exceeds biological thresholds; verifies clinical non-diagnostic disclaimer is always attached.
- **Suite 4: Form & Parameter Validation**: Checks bounds for cycle length (15–90 days), bleeding duration (1–15 days), and rejection of invalid relations (period >= cycle length).
- **Suite 5: Symptom Trends & Historical Aggregation**: Validates zero-data edge cases (0 logs handled cleanly without `NaN` or crashes) and multi-day aggregation for cramps, headaches, moods, and stamina.
- **Suite 6: Supabase RLS Client Protection & Security**: Validates detection and strict rejection of administrative `service_role` keys, and verifies only public `anon` tokens are accepted.
- **Suite 7: Educational Content & Medically Reviewed Standards**: Confirms all articles include medical reviewer credentials, review dates, peer-reviewed literature citations, and educational disclaimers.

---

## 🚀 How to Run Locally

```bash
# Start the local server
npm start
# or
node server.js
```

Then open your browser at:
```
http://localhost:3000
```
Or open `index.html` directly in any modern web browser!

---

## 🌐 Production Deployment Guide

CycleCare is designed for turnkey zero-dependency containerized or serverless deployment.

### 1. Environment Variables
Configure the following environment variables in your hosting environment (e.g., Render, Railway, Fly.io, AWS, Docker):

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `3000` | Port on which the HTTP server listens. |
| `VITE_SUPABASE_URL` | Optional | `""` | Your Supabase project URL (e.g., `https://xyz.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Optional | `""` | Public `anon` key from Supabase API settings. *(Never use `service_role`)* |

### 2. Zero-Config Environment Injection
CycleCare features a dynamic `/env.js` endpoint served directly by `server.js`. When the browser loads `index.html`, `/env.js` securely mounts the runtime environment variables to `window.__ENV__`, enabling instant zero-config cloud sync without rebuilding or baking secrets into client bundles.

### 3. Orchestrator Health Check
- Endpoint: `GET /api/health`
- Response: `HTTP 200 OK`
  ```json
  { "status": "ok", "app": "CycleCare", "timestamp": "2026-10-29T14:20:00.000Z" }
  ```
- Designed for Kubernetes liveness/readiness probes, Docker `HEALTHCHECK`, and cloud load balancers.

### 4. Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
Because CycleCare is completely static-compatible, you can also deploy the root directory to any static web host. When deployed statically without `server.js`, users configure their Supabase credentials directly via the in-app **Cloud Setup** modal in the navigation header or **Settings**.

---

## 📡 Upstream SMS Provider Integration (SMS-BUS Official API)

CycleCare integrates **SMS-BUS** (`https://sms-bus.com`) as an upstream SMS provider using its official documented APIs:
- Activation API: [https://sms-bus.com/docs](https://sms-bus.com/docs)
- Rental API: [https://sms-bus.com/docs/rent](https://sms-bus.com/docs/rent)

*Subject to provider authorization, account credentials, and resale permissions.*

### 🛡️ Security & Architecture Guarantees
- **Server-Side Adapter**: All requests to SMS-BUS (`https://sms-bus.com/api/control`) are dispatched through the server-side provider adapter.
- **Credential Isolation**: The upstream API token (`SMSBUS_API_TOKEN`) is stored strictly in environment variables and is **never** exposed to the frontend or included in `/env.js`.
- **No Mock Availability in Production**: When production mode is active (`NODE_ENV === 'production'` or `SMS_STRICT_PRODUCTION=true`), mock availability is strictly forbidden.
- **No Synthetic SMS**: Real incoming SMS verification codes are retrieved directly from the upstream provider; fake messages are never shown.
- **Extensible Supplier Architecture**: Built with `BaseSmsProvider` and `SmsProviderRegistry`, allowing additional authorized suppliers (e.g. 5SIM, SMS-Activate, DaisySMS) to be hot-registered and switched dynamically.

### 🔌 SMS REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sms/status` | Real-time provider health, response latency ping, uptime SLA, and route availability. |
| `GET` | `/api/sms/policy` | Official Acceptable Use Policy (carrier compliance and anti-bulk abuse rules). |
| `POST` | `/api/sms/auth/register` | Registers customer account with salted Scrypt hash and issues signed session token. |
| `POST` | `/api/sms/auth/login` | Authenticates customer or admin credentials with constant-time equality check. |
| `GET` | `/api/sms/auth/me` | Returns current authenticated user and session role (`CUSTOMER` vs `ADMIN`). |
| `POST` | `/api/sms/auth/logout` | Revokes current session and logs audit event. |
| `GET` | `/api/sms/wallet` | Tenant-isolated customer wallet balance, reserved holds, and immutable ledger. |
| `POST` | `/api/sms/wallet/topup` | Credits wallet with optional cryptographic payment intent or signature verification. |
| `POST` | `/api/sms/wallet/intent` | Generates signed HMAC-SHA256 payment intent with timestamp window. |
| `POST` | `/api/sms/wallet/verify-payment` | Verifies cryptographic payment proof and credits funds atomically. |
| `GET` | `/api/sms/admin/stats` | (Admin Only) Platform-wide aggregate metrics, active reservations, and user counts. |
| `GET` | `/api/sms/admin/audit-logs` | (Admin Only) Queries tamper-evident security and financial audit trail. |
| `GET` | `/api/sms/admin/users` | (Admin Only) Lists registered users with sanitized credential views. |
| `GET` | `/api/sms/providers` | Lists configured providers and current active supplier. |
| `GET` | `/api/sms/balance` | Checks wallet balance and currency on the active provider. |
| `GET` | `/api/sms/countries` | Fetches available countries and regions (`/list/countries`). |
| `GET` | `/api/sms/services` | Fetches verified services annotated with live provider inventory (`/list/projects`). |
| `GET` | `/api/sms/prices?countryId={id}` | Fetches country-specific service prices & live stock (`/list/prices`). |
| `POST` | `/api/sms/orders` | Purchases a number (`/get/number`) with 2-phase reserve-and-commit fund deduction. |
| `GET` | `/api/sms/orders` | Lists tenant-scoped orders (customers see only their own; admins see all). |
| `GET` | `/api/sms/orders/:orderId` | Retrieves order details, verification status, and error logs (tenant isolated). |
| `GET` | `/api/sms/orders/:orderId/sms` | Polls incoming SMS message with sliding-window rate limit (`/get/sms`). |
| `POST` | `/api/sms/orders/:orderId/cancel` | Cancels eligible order and refunds wallet balance (`/cancel`). |
| `POST` | `/api/sms/rent` | Orders long-term virtual number rental (`/rent/get/number`). |
| `GET` | `/api/sms/rent/:orderId/sms` | Checks incoming SMS received on rental numbers (`/rent/get/sms`). |
| `POST` | `/api/sms/rent/:orderId/cancel` | Cancels active rental subscription (`/rent/cancel`). |

### 🛡️ Production Security & Compliance Architecture

1. **Authentication & RBAC**:
   - Password hashing with individual 16-byte cryptographically secure random salts and Scrypt derivation (64-byte key).
   - Constant-time verification using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
   - Signed HMAC-SHA256 session tokens with 24-hour expiration window.
   - Role-Based Access Control distinguishing `CUSTOMER` from `ADMIN`.
2. **Database Access Policies & Tenant Isolation**:
   - Row-level access policies enforce that customers can only view, poll, or cancel orders they created.
   - Customer wallet balances and audit entries are strictly isolated per tenant.
3. **Anti-DDoS Sliding Window Rate Limiting**:
   - In-memory sliding window rate limiter protects endpoints from brute force and Denial of Service:
     - Auth: 5 attempts/minute
     - Number Purchases: 6 orders/minute
     - SMS Polling: 60 polls/minute
     - Wallet Deposits: 10 deposits/minute
     - General API: 120 calls/minute
   - Standard HTTP 429 response with `Retry-After` and `X-RateLimit-*` headers.
4. **Encrypted Secrets & Customer Data Protection (`CryptoVault`)**:
   - Authenticated AES-256-GCM encryption at rest with random 12-byte initialization vectors (IVs) and 16-byte authentication tags.
   - Automatic masking of customer phone numbers (`+1 (***) ***-0199`) and secrets in logs.
5. **Tamper-Evident Audit Logging (`AuditLogger`)**:
   - Structured JSON audit log ledger capturing security events, wallet deposits, order creations, rate limit violations, and administrative actions.
   - Sanitizes metadata to prevent secrets from entering persistent logs.
6. **Payment Verification & Anti-Replay Defense (`PaymentVerifier`)**:
   - Issues cryptographically signed HMAC-SHA256 payment intents.
   - Enforces 5-minute maximum timestamp drift and single-use intent nonce cache preventing replay attacks.
7. **Carrier Compliance & Anti-Abuse Rules (`AntiAbuseGuard`)**:
   - Strictly enforces third-party carrier and platform policies.
   - Quota limit: Maximum 5 concurrent active number reservations per customer to prevent bulk automated bot hoarding.
   - Cooldown period: Minimum 1-3 second delay between consecutive purchases to block scripted harvesting.
   - Clear Acceptable Use Policy prominently displayed in UI and via `/api/sms/policy`.
8. **Real-Time Provider Health & Out-of-Stock Clear Guidance (`ProviderStatusTracker`)**:
   - Live telemetry endpoint `/api/sms/status` tracks provider response latency (ms), operational state, and route inventory.
   - Automatically translates raw upstream error codes (e.g. `no_numbers`, `NO_NUMBERS`) into clear, friendly guidance suggesting alternative high-stock countries.
   - Only advertises service compatibility supported by verified provider data.

### 🧪 Running Provider & Production Tests

```bash
# Run the dedicated Production Security & Compliance test suite
node test_sms_production.js

# Run the complete test suite (126 tests across 5 suites)
npm test
```
