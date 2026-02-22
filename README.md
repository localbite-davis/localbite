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

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   App will start at `http://localhost:3000`.

---

## 🤝 Contribution Guidelines

We welcome contributions! To get started:

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally.
   ```bash
   git clone https://github.com/your-username/localbite.git
   ```
3. **Create a new branch** for your feature or bugfix.
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
4. **Make your changes** and commit them with descriptive messages.
5. **Push to your fork** and submit a **Pull Request**.

### Development Tips
- **Backend Reloading**: Since `uvicorn` runs with `--reload`, changes to Python files will automatically restart the server.
- **Frontend HMR**: Next.js provides Hot Module Replacement, so UI changes reflect instantly.
- **Database Schema**: If you modify models in `app/models/`, ensure you handle migration/updates securely (currently using `Base.metadata.create_all(bind=engine)` for auto-creation).

---

Built with ❤️ by the Localbite Team.

