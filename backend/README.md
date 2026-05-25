# Tropical Gardens Hotel Backend

Production-ready starting backend for the hotel website.

## What It Adds

- Express API
- PostgreSQL schema
- JWT admin authentication
- Public room, menu, offer, reservation, and contact endpoints
- Admin dashboard endpoints for reservations, rooms, menu, offers, and guest messages
- Helmet, CORS, rate limiting, validation, and password hashing

## Setup

```bash
cd backend
cp .env.example .env
npm install
```

Create the database, then run:

```bash
npm run db:init
npm run db:seed
npm run admin:create
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

## Main API Routes

Public:

- `GET /api/rooms`
- `GET /api/menu`
- `GET /api/offers`
- `POST /api/reservations`
- `POST /api/contact`

Auth:

- `POST /api/auth/login`

Admin, requires `Authorization: Bearer <token>`:

- `GET /api/admin/dashboard`
- `GET /api/admin/reservations`
- `PATCH /api/admin/reservations/:id/status`
- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `GET /api/admin/menu`
- `POST /api/admin/menu`
- `GET /api/admin/offers`
- `POST /api/admin/offers`
- `GET /api/admin/messages`

## Frontend Integration

Replace the current fake reservation handler with:

```js
async function handleReservation(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const response = await fetch("http://localhost:4000/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestName: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      roomName: form.get("room"),
      checkIn: form.get("checkin"),
      checkOut: form.get("checkout"),
      guests: Number(form.get("guests") || 1),
      notes: form.get("notes") || ""
    })
  });
  if (!response.ok) throw new Error("Reservation failed");
  e.target.reset();
  showToast("Reservation received. We will confirm shortly.");
}
```

For production, deploy the static frontend to Vercel, Netlify, or GitHub Pages, and deploy the backend to Render, Railway, Fly.io, or AWS with a managed PostgreSQL database.
