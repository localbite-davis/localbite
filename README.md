# Localbite 🍔

Localbite is a modern, full-stack food delivery platform connecting customers with local restaurants. Built with **Next.js 16** (Frontend) and **FastAPI** (Backend), it features role-based access for Customers, Restaurant Owners, and Delivery Agents.

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: Lucide React
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod validation

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.10+
- **Database**: PostgreSQL (via Supabase) with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **Authentication**: JWT (JSON Web Tokens) with HttpOnly cookies
- **Password Hashing**: Argon2 (via Passlib)
- **Validation**: Pydantic schemes

---

## 📂 Project Structure

```bash
localbite/
├── localbite-backend/       # Python FastAPI Application
│   ├── app/
│   │   ├── api/             # API Route Handlers (endpoints)
│   │   ├── core/            # Config, Security, Hashing utilities
│   │   ├── crud/            # Database Operations (Create, Read, Update, Delete)
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Request/Response Schemas
│   │   └── database.py      # Database Connection Setup
│   ├── main.py              # Application Entry Point
│   └── requirements.txt     # Python Dependencies
│
├── localbite-frontend/      # Next.js Application
│   ├── app/                 # App Router Pages & Layouts
│   │   ├── dashboard/       # Role-protected Dashboards (Customer/Restaurant)
│   │   ├── login/           # Authentication Pages
│   │   └── page.tsx         # Landing Page
│   ├── components/          # Reusable UI Components
│   ├── context/             # React Context (Auth, Theme)
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # Utilities & Mock Data
│   └── public/              # Static Assets
└── README.md                # Project Documentation
```

---

## ✨ Features & Functionality

### 1. Authentication & Roles 🔐
- **Secure Login/Signup**: Supports separate flows for Customers, Restaurant Owners, and Delivery Agents.
- **JWT Auth**: HttpOnly cookies for secure session management.
- **Role-Based Redirects**: Automatically routes users to their specific dashboard upon login.

### 2. Customer Dashboard 👤
- **Restaurant Discovery**: Browse and search restaurants by name or cuisine.
- **Menu Interaction**: View detailed restaurant menus with categories.
- **Smart Filtering**: Filter by cuisine type (Thai, Mexican, Halal, etc.).
- **Live Data**: Connects to backend API for real-time restaurant and menu data.

### 3. Restaurant Dashboard 🍳
- **Menu Management**: Add, update, and delete menu items dynamically.
- **Business Insights**: View order stats and manage restaurant profile (Name, Cuisine, etc.).
- **Real-time Updates**: Changes reflect immediately on the customer side.

### 4. Delivery Agent Dashboard 🛵
- **Task Management**: (In progress) View available orders for pickup.
- **Earnings Tracker**: Monitor completed deliveries and earnings.

---

## 🚀 API Endpoints

The backend provides a comprehensive REST API. Once running, visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Key Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/signup` | Register a new user |
| **Auth** | `/api/v1/auth/token` | Login & receive access token |
| **Restaurant** | `/api/v1/restaurants/` | List all restaurants |
| **Restaurant** | `/api/v1/restaurants/{id}` | Get restaurant details |
| **Menu** | `/api/v1/menu/restaurant/{id}`| Get menu items for a restaurant |
| **Menu** | `/api/v1/menu/` | Create new menu item (Auth required) |

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js**: v18+ & npm
- **Python**: v3.10+
- **PostgreSQL Database**: Local instance or cloud (e.g., Supabase, Neon)

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd localbite-backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration (`.env`):**
   Create a `.env` file in `localbite-backend/` with the following variables:
   ```env
   # Database Configuration
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host.supabase.co
   DB_NAME=postgres
   
   # Security
   SECRET_KEY=your_super_secret_key_openssl_rand_hex_32
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```
   Server will start at `http://localhost:8000`.

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd localbite-frontend
   ```

## Running the Application (Backend + Redis, Recommended)

Before starting, ensure your Neon connection is configured in:
- `localbite-backend/.env` (`DATABASE_URL=...`)
or set the individual DB env vars used by the backend.

Start backend + local Redis:

```bash
./deploy_backend.sh
```

This starts:
- **Redis**: `localhost:6379` (if installed locally and not already running)
- **Backend**: http://localhost:8000

## Running the Frontend (Local)

```bash
cd localbite-frontend
npm install
npm run dev
```

Frontend:
- **Frontend**: http://localhost:3000

## Integration Workflow (Dispatch + Bidding)

Run the Postman/Newman integration workflow (local backend):

```bash
./run_api_tests.sh
```

Reports are written to:
- `localbite-backend/postman/reports/`

## Running the Application (Older Local Scripts)

To start both the Backend and Frontend servers in separate terminals, run:

```bash
./start_servers.sh
```

This will launch:
- **Backend**: http://localhost:8000 (with auto-reload)
- **Frontend**: http://localhost:3000

### Backend + Redis (Dispatch/Bidding Testing, Alternative)

For dispatch timer and bidding workflows (which require Redis), use:

```bash
cd localbite-backend
./scripts/start_backend_with_redis.sh
```

## API Documentation

Once the backend is running, you can access the interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Base Fare Recommendation API

New endpoint:

- `POST /api/v1/fares/recommendation`

Purpose:

- Calculates `base_fare` (minimum bidding fare for delivery agents)
- Calculates `max_bid_limit` (`1.5x` of `base_fare`)
- Returns `eta_estimate_minutes`

Payload supports either:

- `distance_km` from your distance API, or
- coordinates for both user and restaurant (`latitude`/`longitude`) to compute distance with Haversine.

Example request body:

```json
{
  "user_location": {
    "address": "500 1st St, Davis, CA",
    "latitude": 38.5449,
    "longitude": -121.7405
  },
  "restaurant_location": {
    "address": "220 G St, Davis, CA",
    "latitude": 38.5435,
    "longitude": -121.7407
  },
  "incentive_metrics": {
    "demand_index": 1.1,
    "supply_index": 0.9,
    "weather_severity": 0.1
  }
}
```

## Delivery Agent Bidding API

New endpoint:

- `POST /api/v1/delivery-bids/`

Behavior:

- Validates bid against the order's bidding window:
  - minimum = `orders.base_fare`
  - maximum = `1.5 * orders.base_fare`
- Supports phased dispatch bidding:
  - `student_pool`: only student delivery agents can bid
  - `all_agents`: all active agents can bid

Example request body:

```json
{
  "order_id": 101,
  "agent_id": "agent_123",
  "bid_amount": 6.5,
  "pool_phase": "student_pool"
}
```

Accept a bid (assign order + stop dispatch flow):

- `POST /api/v1/delivery-bids/{bid_id}/accept`

Notes:

- Marks selected bid as `accepted`
- Rejects competing `placed` bids for the same order
- Assigns `orders.assigned_partner_id`
- Updates dispatch state in Redis so phase timers stop

## Dispatch (Phase Timer) API

New endpoints:

- `POST /api/v1/dispatch/orders/{order_id}/start`
- `GET /api/v1/dispatch/orders/{order_id}/status`

Behavior:

- Starts two-phase dispatch in background
- Phase 1 (`student_pool`): student-only broadcast, waits configurable timer
- Phase 2 (`all_agents`): full-pool broadcast, waits configurable timer
- If still unassigned after Phase 2: status becomes `needs_fee_increase`

Example start request body:

```json
{
  "delivery_address": "500 1st St, Davis, CA",
  "phase1_wait_seconds_min": 180,
  "phase1_wait_seconds_max": 240,
  "phase2_wait_seconds": 180,
  "poll_interval_seconds": 5
}
```
