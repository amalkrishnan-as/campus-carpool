# Campus Carpool 🚗

A college-only carpooling platform where verified students can share rides, reduce costs, and build community.

> **Find your way home. Share the ride. Travel with your campus community.**

---

## Architecture

```
Next.js Frontend (Port 3000)
         │
         │ HTTPS / REST
         ▼
FastAPI Backend (Port 8000)
         │
         ├── Auth
         ├── Users
         ├── Vehicles
         ├── Rides
         ├── Ride Requests
         ├── Notifications
         ├── Ratings
         ├── Reports
         └── Admin
         │
         ▼
PostgreSQL (Port 5432)
```

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind  |
| Backend  | Python 3.11, FastAPI, Pydantic    |
| Database | PostgreSQL 15                     |
| ORM      | SQLAlchemy 2.0 + Alembic          |
| Auth     | JWT (access + refresh tokens)     |
| Infra    | Docker, Docker Compose            |
| CI       | GitHub Actions                    |

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <repo-url>
cd campus-carpool

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Start all services
docker compose up --build

# 4. Apply database migrations (first run only)
docker compose exec backend alembic upgrade head
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

---

## Local Development

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit env
cp .env.example .env

# Apply migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret for JWT signing | **Required** |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `COLLEGE_EMAIL_DOMAINS` | Accepted email domains | `college.edu,...` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Database Migrations

```bash
# Generate a new migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one revision
alembic downgrade -1
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest ../tests -v
```

Tests use SQLite in-memory database (no PostgreSQL required for tests).

---

## API Overview

Base URL: `/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with college email |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/verify` | Verify email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PATCH | `/users/me` | Update profile |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rides/search` | Search rides |
| POST | `/rides` | Create ride |
| GET | `/rides/{id}` | Get ride details |
| POST | `/rides/{id}/requests` | Request a seat |
| POST | `/rides/{id}/cancel` | Cancel ride |
| POST | `/rides/{id}/start` | Start ride |
| POST | `/rides/{id}/complete` | Complete ride |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/requests/me` | My ride requests |
| POST | `/requests/{id}/accept` | Accept request |
| POST | `/requests/{id}/reject` | Reject request |
| POST | `/requests/{id}/cancel` | Cancel request |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/{id}/suspend` | Suspend user |
| PATCH | `/admin/users/{id}/activate` | Activate user |
| GET | `/admin/analytics` | Platform stats |

Full interactive docs: http://localhost:8000/api/docs

---

## Key Design Decisions

1. **Single role system**: Users can be both drivers and passengers — no separate roles.
2. **Transactional seat management**: All seat decrement/increment operations use `SELECT FOR UPDATE` to prevent race conditions.
3. **College email validation**: Backend validates email domain against configured allowed domains.
4. **JWT stateless auth**: Access tokens (30min) + Refresh tokens (7 days). Logout is client-side token discard.
5. **Soft deletes**: Users are suspended/deactivated, not deleted.
6. **Block system**: Blocked users cannot interact with each other's rides.

---

## Deployment

### Option A: Deploy Frontend on Vercel + Backend on Render/Railway (Recommended)

Since Campus Carpool consists of a Next.js frontend and a FastAPI backend with PostgreSQL:

#### 1. Deploy the Backend & Database (Render / Railway / Fly.io)
1. **Database:** Create a managed PostgreSQL database (e.g. on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com)).
2. **Backend Web Service:**
   - Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
   - Set **Root Directory** to `backend`.
   - Set **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `DATABASE_URL`: `postgresql://<user>:<pass>@<host>/<db>`
     - `JWT_SECRET`: `<your-random-secret-key>`
     - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
     - `ENVIRONMENT`: `production`

#### 2. Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your repository.
3. In the configuration screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `frontend` (crucial since frontend lives in a subfolder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com` (your deployed backend URL, without trailing slash).
5. Click **Deploy**.

---

### Option B: Full-Stack Docker Deployment

The application is Docker-ready with `docker-compose.yml`:
1. Set strong `JWT_SECRET` in `.env`
2. Update `ALLOWED_ORIGINS` to your frontend domain
3. Update `COLLEGE_EMAIL_DOMAINS` to your institution's domain
4. Run `docker compose up --build -d`

---

## Assumptions

- Email verification is simulated (token printed to console in dev mode)
- Password reset is simulated (token printed to console in dev mode)
- No email service is integrated (designed to be added as a future enhancement)
- Geographic/map-based matching is not implemented (coordinates are stored for future use)
- No real-time WebSocket features (polling-based notifications)
