# Localbite

A local food delivery application with a React frontend and FastAPI backend.

## Project Structure

- `localbite-backend/`: FastAPI Python application
- `localbite-frontend/`: React JavaScript application

## Prerequisites

- **Python 3.8+**
- **Node.js 14+** & **npm**

## Setup Instructions

### 1. Backend Setup

This project includes a setup script that creates a virtual environment and installs all required Python dependencies.

Open a terminal in the root directory and run:

```bash
chmod +x setup_backend.sh start_servers.sh
./setup_backend.sh
```

### 2. Frontend Setup

Navigate to the frontend directory and install the JavaScript dependencies:

```bash
cd localbite-frontend
npm install
cd ..
```

## Running the Application

To start both the Backend and Frontend servers in separate terminals, run:

```bash
./start_servers.sh
```

This will launch:
- **Backend**: http://localhost:8000 (with auto-reload)
- **Frontend**: http://localhost:3000

## API Documentation

Once the backend is running, you can access the interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Base Fare Recommendation API

New endpoint:

- `POST /api/v1/fares/recommendation`

Purpose:

- Calculates `base_fare` (minimum bidding fare for delivery agents)
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
