# Campus Carpool — Single Build Prompt

You are the lead full-stack engineer. Build the **entire Campus Carpool web application** described below. Treat this document as the source of truth. Do not merely create mockups or explain what should be done: implement the working application in the repository.

## 1. PRODUCT

Build a **college-only carpooling platform** where verified students can:

- Register/login using their college identity.
- Create rides when they have spare seats.
- Search rides by route/date/time.
- Request seats.
- Accept/reject/cancel ride requests.
- Manage vehicles and their own rides.
- Receive in-app notifications.
- Complete rides and rate participants.
- Report/block users.
- View ride history.

An `ADMIN` can manage users, rides, reports and basic analytics.

The same account can act as both driver and passenger. Do NOT make DRIVER and PASSENGER separate account roles.

The product is a **student cost-sharing/community platform**, not a commercial taxi service.

---

# 2. REQUIRED STACK

Use:

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form + Zod where useful
- TanStack Query or an equally clean API-state solution

### Backend
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

### Database
- PostgreSQL

### Infrastructure
- Docker
- Docker Compose for local development
- GitHub Actions-ready CI
- `.env` configuration
- `.env.example`

Do NOT introduce microservices or Kubernetes. Use a clean **modular monolith**.

If the repository already contains a reasonable structure, preserve it where practical instead of unnecessarily rewriting everything.

---

# 3. CORE ARCHITECTURE

Use:

```text
Next.js Frontend
       │
       │ HTTPS / REST
       ▼
FastAPI Backend
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
PostgreSQL
```

Backend layering:

```text
Router / Controller
        ↓
Pydantic Schema
        ↓
Service Layer
        ↓
Repository / DB Layer
        ↓
PostgreSQL
```

Keep business logic out of route handlers wherever practical.

---

# 4. USER ROLES

## USER

Can:

- Manage own profile
- Manage own vehicles
- Create/edit/cancel own rides
- Search rides
- Request rides
- Cancel own requests
- Accept/reject requests for own rides
- Complete own rides
- Rate ride participants
- Report/block users
- View notifications/history

## ADMIN

Can additionally:

- View users
- Suspend/activate users
- View/manage rides
- View/manage reports
- View basic platform analytics

Every protected operation must be authorized on the backend. Never trust frontend role information.

---

# 5. AUTHENTICATION

Implement:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/users/me
PATCH /api/v1/users/me
```

Requirements:

- College email restriction.
- Passwords must be hashed using Argon2 or bcrypt.
- Never store plaintext passwords.
- JWT access + refresh token authentication is acceptable.
- Protected frontend routes.
- Backend token validation.
- Suspended users cannot participate.
- Never commit secrets.

Use environment variables such as:

```env
DATABASE_URL=
JWT_SECRET=
JWT_ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
```

---

# 6. DATABASE

Create migrations with Alembic.

## users

```text
id UUID PK
name
email UNIQUE
college_id UNIQUE
department
year
phone
password_hash
profile_image_url
role
status
average_rating
created_at
updated_at
```

Roles:

```text
USER
ADMIN
```

Statuses:

```text
PENDING_VERIFICATION
ACTIVE
SUSPENDED
DEACTIVATED
```

## vehicles

```text
id UUID PK
owner_id FK users
type
model
registration_number
seat_capacity
created_at
updated_at
```

## rides

```text
id UUID PK
driver_id FK users
vehicle_id FK vehicles
source
destination
pickup_point
source_latitude nullable
source_longitude nullable
destination_latitude nullable
destination_longitude nullable
departure_date
departure_time
original_seats
available_seats
contribution
notes
status
created_at
updated_at
```

Statuses:

```text
OPEN
FULL
STARTED
COMPLETED
CANCELLED
EXPIRED
```

## ride_requests

```text
id UUID PK
ride_id FK rides
passenger_id FK users
status
created_at
updated_at
```

Statuses:

```text
PENDING
ACCEPTED
REJECTED
CANCELLED
```

Add:

```text
UNIQUE(ride_id, passenger_id)
```

## ratings

```text
id UUID PK
ride_id FK rides
reviewer_id FK users
reviewed_user_id FK users
rating
comment
created_at
```

Prevent duplicate ratings for the same participant/ride.

## notifications

```text
id UUID PK
user_id FK users
type
title
message
ride_id nullable
request_id nullable
is_read
created_at
```

## reports

```text
id UUID PK
reporter_id FK users
reported_user_id FK users
ride_id nullable
reason
description
status
admin_notes
created_at
resolved_at nullable
```

Reasons:

```text
UNSAFE_DRIVING
NO_SHOW
HARASSMENT
FAKE_PROFILE
MISCONDUCT
SPAM
OTHER
```

Statuses:

```text
OPEN
UNDER_REVIEW
RESOLVED
DISMISSED
```

## blocks

```text
id UUID PK
blocker_id FK users
blocked_id FK users
created_at

UNIQUE(blocker_id, blocked_id)
```

Add sensible foreign keys, indexes, constraints and timestamps.

Important indexes should include:

```text
users(email)
rides(driver_id)
rides(departure_date, status)
rides(source, destination, departure_date)
ride_requests(ride_id, status)
ride_requests(passenger_id)
notifications(user_id, is_read)
reports(status)
```

---

# 7. RIDE FUNCTIONALITY

## Create ride

Driver enters:

```text
Source
Destination
Pickup point
Date
Departure time
Vehicle
Available seats
Contribution
Optional notes
```

Validate:

- User is authenticated and active.
- Vehicle belongs to the user.
- Date/time is not invalid/past.
- Seats are positive.
- Ride data is valid.

## Search rides

Support:

```text
source
destination
date
time/time range
vehicle type
minimum available seats
maximum contribution
```

Return paginated results.

Sort intelligently, preferably by:

1. Departure-time proximity
2. Rating
3. Contribution

For MVP, use text/location matching. Coordinates are stored so geographic matching can be added later.

## Ride details

Show:

- Route
- Pickup point
- Date/time
- Available seats
- Contribution
- Driver name
- Driver rating
- Vehicle
- Notes
- Request button

Do not expose unnecessary private information.

---

# 8. RIDE REQUEST FLOW

Required flow:

```text
Passenger
   ↓
Request Ride
   ↓
PENDING
   ↓
Driver
 ┌─┴─────┐
 ↓       ↓
ACCEPT  REJECT
 ↓
Passenger notified
```

Endpoints:

```text
POST /api/v1/rides/{ride_id}/requests
GET  /api/v1/rides/{ride_id}/requests
GET  /api/v1/requests/me
POST /api/v1/requests/{id}/accept
POST /api/v1/requests/{id}/reject
POST /api/v1/requests/{id}/cancel
```

Rules:

- Cannot request own ride.
- Cannot duplicate a request.
- Cannot request cancelled/completed rides.
- Blocked users cannot interact.
- Only the ride owner can accept/reject requests.
- Only the requesting passenger can cancel their request.

---

# 9. CRITICAL SEAT TRANSACTION

Seat management MUST be backend/database controlled.

When accepting a request:

```text
BEGIN TRANSACTION

Lock the ride row

Check available_seats > 0

If yes:
    Set request = ACCEPTED
    Decrement available_seats
    If available_seats == 0:
        ride = FULL

If no:
    reject operation

COMMIT
```

Do not rely on frontend seat counts.

When an accepted passenger cancels:

```text
BEGIN
Lock ride
Cancel request
Increment available_seats
If ride was FULL:
    change to OPEN
COMMIT
```

This prevents race-condition overbooking.

---

# 10. RIDE LIFECYCLE

Normal flow:

```text
OPEN → FULL → STARTED → COMPLETED
```

Other paths:

```text
OPEN → CANCELLED
FULL → CANCELLED
OPEN → EXPIRED
```

Only valid state transitions should be accepted by the backend.

A completed ride cannot be edited.

---

# 11. NOTIFICATIONS

Implement in-app notifications first.

Notify users when:

- Someone requests their ride.
- Their request is accepted.
- Their request is rejected.
- A ride is cancelled.
- A ride is starting soon.
- A ride is completed.

Frontend needs:

```text
Notification bell
Unread count
Notification list
Mark read
Mark all read
```

Later architecture can support email/push notifications.

---

# 12. RATINGS

After a completed ride:

- Driver can rate passengers.
- Passengers can rate driver.
- Only actual ride participants can rate.
- Cannot rate yourself.
- Cannot rate before completion.
- Cannot rate the same participant twice for the same ride.
- Rating range: 1–5.

Update/display average user rating.

---

# 13. REPORTS AND BLOCKING

Users can report another user or ride.

Implement:

```text
POST /api/v1/reports
GET /api/v1/reports/me
```

Users can block other users.

Blocked users should not be able to send relevant ride requests to each other.

Admin can:

- View reports
- Change report status
- Add admin notes
- Suspend/activate users

---

# 14. ADMIN API

Implement approximately:

```text
GET   /api/v1/admin/users
PATCH /api/v1/admin/users/{id}/suspend
PATCH /api/v1/admin/users/{id}/activate

GET   /api/v1/admin/rides
POST  /api/v1/admin/rides/{id}/cancel

GET   /api/v1/admin/reports
PATCH /api/v1/admin/reports/{id}

GET   /api/v1/admin/analytics
```

Admin endpoints must require the `ADMIN` role.

---

# 15. FRONTEND PAGES

Build a polished but realistic college-project UI.

Use a clean modern design, preferably dark/light neutral styling with a restrained accent color. Do not make it look like a generic Uber clone.

Required pages:

```text
/
 /login
 /register
 /verify
 /dashboard
 /rides/search
 /rides/create
 /rides/[id]
 /my-rides
 /requests
 /notifications
 /profile
 /settings
 /admin
 /admin/users
 /admin/rides
 /admin/reports
 /admin/analytics
```

Landing page should communicate:

> Find your way home. Share the ride. Travel with your campus community.

Include:

- Hero
- Find Ride CTA
- Offer Ride CTA
- How it works
- College verification/trust explanation
- Footer

---

# 16. IMPORTANT UI COMPONENTS

Create reusable components:

```text
Navbar
Sidebar where appropriate
RideCard
RideFilters
RideDetails
CreateRideForm
VehicleForm
RequestCard
RatingStars
NotificationDropdown
UserAvatar
Modal
ConfirmDialog
LoadingState
EmptyState
ErrorState
Pagination
AdminStatsCards
```

Make the UI responsive.

Handle loading, empty, error and success states.

Do not leave buttons that do nothing.

---

# 17. DASHBOARD

Student dashboard should show:

```text
Welcome message

Upcoming ride
Quick actions:
    Find Ride
    Offer Ride

Pending requests

Recent activity

Notifications
```

Driver-side views should show their created rides and passenger requests.

Passenger-side views should show requested/upcoming rides.

---

# 18. API RESPONSE DESIGN

Use consistent responses and HTTP status codes.

Typical codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

Use structured errors, e.g.:

```json
{
  "error": {
    "code": "RIDE_FULL",
    "message": "This ride has no available seats."
  }
}
```

Useful codes:

```text
INVALID_CREDENTIALS
EMAIL_ALREADY_EXISTS
INVALID_COLLEGE_EMAIL
USER_NOT_FOUND
RIDE_NOT_FOUND
RIDE_FULL
RIDE_CANCELLED
REQUEST_NOT_FOUND
REQUEST_ALREADY_EXISTS
NOT_AUTHORIZED
ACCOUNT_SUSPENDED
ALREADY_RATED
```

---

# 19. BACKEND PROJECT STRUCTURE

Use a structure similar to:

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   ├── schemas/
│   ├── api/v1/
│   ├── services/
│   ├── repositories/
│   └── utils/
├── migrations/
├── tests/
├── Dockerfile
├── requirements.txt
└── .env.example
```

Organize models, schemas, routers, services and repositories by feature.

---

# 20. FRONTEND STRUCTURE

Use something similar to:

```text
frontend/
├── app/
├── components/
├── hooks/
├── lib/
├── types/
├── public/
├── middleware.ts
└── package.json
```

Keep API calls centralized instead of scattering raw `fetch()` logic throughout components.

---

# 21. SECURITY

Implement:

- Password hashing
- College email validation
- JWT/session security
- Backend authorization
- Ownership checks
- Input validation
- SQL injection protection through SQLAlchemy
- Rate limiting on sensitive endpoints where practical
- Secure CORS configuration
- No secrets in source control
- Safe error messages
- Proper authentication middleware

Never log:

```text
passwords
tokens
secrets
database credentials
```

---

# 22. TESTING

Create meaningful tests.

## Unit tests

Test:

- Auth logic
- Ride validation
- Request rules
- Seat calculations
- Rating rules
- Matching/search logic

## Integration tests

At minimum test:

```text
Register
Login
Create vehicle
Create ride
Search ride
Request ride
Accept request
Reject request
Cancel request
Complete ride
Rate participant
Report user
```

Most importantly verify the seat-count transaction and duplicate-request constraints.

---

# 23. DEVOPS

Provide:

```text
Dockerfile
docker-compose.yml
.env.example
README.md
GitHub Actions workflow
```

Local development should ideally be:

```text
docker compose up
```

with frontend/backend/database working together.

CI should:

```text
Install dependencies
Run linting
Run tests
Build application
```

Make the application deployable.

---

# 24. DOCUMENTATION

Create/update a README containing:

- Project overview
- Architecture
- Requirements
- Local setup
- Environment variables
- Database setup/migrations
- Running frontend
- Running backend
- Running tests
- Docker instructions
- API overview
- Deployment notes

Also document any assumptions you had to make.

---

# 25. DEVELOPMENT STRATEGY

Although this is one prompt, implement in this dependency order:

```text
1. Inspect existing repository
2. Establish project structure
3. Backend + database configuration
4. Database models + migrations
5. Authentication
6. User profiles
7. Vehicles
8. Rides
9. Ride search
10. Ride requests
11. Transactional seat management
12. Notifications
13. Ratings
14. Reports/blocking
15. Admin
16. Frontend polish
17. Tests
18. Docker/CI
19. Final integration
```

Do not stop after creating scaffolding. Continue through the complete implementation.

After each major module, verify that it integrates correctly with the previous modules.

---

# 26. IMPORTANT IMPLEMENTATION RULES

1. **Do not create fake/mock backend functionality when a real implementation is required.**
2. **Do not leave TODOs for core features.**
3. **Do not create buttons that have no working action.**
4. **Do not bypass backend authorization.**
5. **Do not trust frontend seat counts or roles.**
6. **Do not store plaintext passwords.**
7. **Do not hardcode secrets.**
8. **Do not introduce unnecessary microservices.**
9. **Do not rewrite working existing code without a reason.**
10. **Reuse components and services rather than duplicating logic.**
11. **Keep the code readable and maintainable.**
12. **Use database transactions for operations requiring consistency.**
13. **Use migrations rather than manually modifying production schema.**
14. **Handle loading, errors and empty states throughout the UI.**
15. **Run tests/build checks before considering the implementation complete.**

---

# 27. FUTURE FEATURES — DO NOT LET THESE BLOCK MVP

Design the code so these can be added later, but do not over-engineer them now:

```text
Maps integration
GPS coordinates
Route-overlap matching
Recurring rides
Email notifications
Push notifications
Redis caching
Image/object storage
Advanced analytics
Live location
```

For route matching, the future concept is:

```text
Driver:
College → Kazhakkoottam → Attingal

Passenger:
College → Attingal

→ high route overlap
```

The current MVP can use source/destination text filtering.

---

# 28. FINAL ACCEPTANCE CRITERIA

The project is NOT complete until this end-to-end flow works:

```text
Student A registers
        ↓
College verification
        ↓
Login
        ↓
Add vehicle
        ↓
Create ride
        ↓
Ride appears in search
        ↓
Student B registers/logs in
        ↓
Student B searches ride
        ↓
Student B opens ride details
        ↓
Student B requests seat
        ↓
Student A receives notification
        ↓
Student A accepts
        ↓
Seat count decreases safely
        ↓
Student B receives acceptance notification
        ↓
Ride starts/completes
        ↓
Ride is marked COMPLETED
        ↓
Both participants can rate each other
        ↓
Rating appears on profile
```

Also verify:

```text
Unauthorized users cannot access protected resources.
A user cannot edit another user's ride.
A user cannot request their own ride.
Duplicate requests are rejected.
A full ride cannot accept another passenger.
Concurrent acceptance cannot overbook seats.
Suspended users cannot participate.
Only admins can access admin endpoints.
Completed rides cannot be edited.
Ratings cannot be submitted before completion.
Reports reach the admin system.
```

---

# 29. FINAL GOAL

Build this as a **real, coherent, runnable full-stack application**, not a collection of disconnected pages.

The architecture should make this flow obvious:

```text
USER
 ↓
NEXT.JS UI
 ↓
FASTAPI API
 ↓
AUTHORIZATION
 ↓
SERVICE / BUSINESS LOGIC
 ↓
DATABASE
 ↓
NOTIFICATION / RESPONSE
 ↓
USER
```

The most important feature is the complete ride lifecycle:

```text
REGISTER
 → VERIFY
 → LOGIN
 → CREATE / SEARCH RIDE
 → REQUEST
 → ACCEPT / REJECT
 → SEAT MANAGEMENT
 → NOTIFICATION
 → RIDE
 → COMPLETE
 → RATE
 → REPORT/MODERATE WHEN NECESSARY
```

Build the application completely according to this specification. Before finishing, run the available tests/build checks, fix errors you encounter, and leave the repository in a runnable state.
