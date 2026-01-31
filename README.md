# Unolo Field Force Tracker

A web application for tracking field employee check-ins at client locations.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js, SQLite (via sql.js)
- **Authentication:** JWT

> **Note:** This project uses `sql.js` (pure JavaScript SQLite implementation) to avoid C++ build tool dependencies while maintaining full SQLite compatibility.

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
node fix-database.js    # Initialize database with test data
cp .env.example .env
npm run dev
```

Backend runs on: `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Test Credentials

| Role     | Email              | Password    |
|----------|-------------------|-------------|
| Manager  | manager@unolo.com | password123 |
| Employee | rahul@unolo.com   | password123 |
| Employee | priya@unolo.com   | password123 |

## Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── scripts/         # Database init scripts
│   ├── utils/           # Utility functions (distance calculation)
│   └── server.js        # Express app entry
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── utils/       # API helpers
│   └── index.html
└── database/            # SQL schemas (reference only)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Check-ins
- `GET /api/checkin/clients` - Get assigned clients
- `POST /api/checkin` - Create check-in (now includes distance calculation)
- `PUT /api/checkin/checkout` - Checkout
- `GET /api/checkin/history` - Get check-in history
- `GET /api/checkin/active` - Get active check-in

### Dashboard
- `GET /api/dashboard/stats` - Manager stats
- `GET /api/dashboard/employee` - Employee stats

### Reports (NEW)
- `GET /api/reports/daily-summary` - Daily team activity summary (Manager only)

## New Features

### Distance Calculation

When checking in, the application now:
- Calculates the distance between employee's location and client's location
- Uses the Haversine formula for accurate geographic distance
- Stores distance in the database
- Shows real-time distance preview when selecting a client
- Displays warning if distance > 500 meters

### Daily Summary Report API

**Endpoint:** `GET /api/reports/daily-summary`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `employee_id` (optional): Filter by specific employee

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "team_summary": {
      "total_checkins": 5,
      "total_hours": 12.5,
      "employees_active": 3,
      "unique_clients": 4
    },
    "employee_breakdown": [
      {
        "employee_id": 2,
        "employee_name": "Rahul Kumar",
        "checkins": 3,
        "clients_visited": 2,
        "total_hours": 5.5,
        "avg_distance_km": 0.15
      }
    ]
  }
}
```

## Bug Fixes Applied

See `BUG_FIXES.md` for detailed documentation of all bugs found and fixed.
<img width="1626" height="713" alt="Screenshot 2026-01-31 153914" src="https://github.com/user-attachments/assets/c965d4a5-b48b-4d6b-b3ca-6374a24093a4" />
<img width="1654" height="921" alt="Screenshot 2026-01-31 154108" src="https://github.com/user-attachments/assets/4a9f7471-118c-45eb-9e35-437211876895" />
<img width="1629" height="654" alt="Screenshot 2026-01-31 154034" src="https://github.com/user-attachments/assets/d65544b6-d3f5-412d-9739-8276b61adff2" />



## Notes

- The database uses SQLite - no external database setup required
- Run `npm run init-db` to reset the database to initial state

