# Tropical Gardens Hotel Backend

Production-ready starting backend for the hotel website.

## What It Adds

- Express API
- PostgreSQL schema
- JWT admin authentication
- Public room, menu, offer, reservation, and contact endpoints
- Admin dashboard endpoints for reservations, rooms, menu, offers, and guest messages
- Pesapal checkout endpoints for Mobile Money and card payments
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
- `GET /api/notifications`
- `POST /api/reservations`
- `POST /api/contact`
- `POST /api/payments/pesapal/checkout`
- `GET /api/payments/pesapal/callback`
- `GET|POST /api/payments/pesapal/ipn`

Auth:

- `POST /api/auth/login`

Admin, requires `Authorization: Bearer <token>`:

- `GET /api/admin/dashboard`
- `GET /api/admin/reservations`
- `POST /api/admin/reservations`
- `PUT /api/admin/reservations/:id`
- `PATCH /api/admin/reservations/:id/status`
- `DELETE /api/admin/reservations/:id`
- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `PUT /api/admin/rooms/:id`
- `DELETE /api/admin/rooms/:id`
- `GET /api/admin/menu`
- `POST /api/admin/menu`
- `PUT /api/admin/menu/:id`
- `DELETE /api/admin/menu/:id`
- `GET /api/admin/offers`
- `POST /api/admin/offers`
- `PUT /api/admin/offers/:id`
- `DELETE /api/admin/offers/:id`
- `GET /api/admin/notifications`
- `POST /api/admin/notifications`
- `DELETE /api/admin/notifications/:id`
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

## Mobile Money and Card Payments

Use Pesapal for Uganda-friendly payments. The checkout URL can present available payment options such as Mobile Money and cards depending on your Pesapal merchant setup.

Required environment variables:

```bash
PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3
PESAPAL_CONSUMER_KEY=...
PESAPAL_CONSUMER_SECRET=...
PESAPAL_IPN_ID=...
PESAPAL_CALLBACK_URL=https://your-api-domain.com/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=https://your-website-domain.com/payment-cancelled.html
PAYMENT_SUCCESS_URL=https://your-website-domain.com/payment-success.html
```

Create a checkout:

```js
const response = await fetch("https://your-api-domain.com/api/payments/pesapal/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reservationId: "optional-reservation-uuid",
    amount: 50000,
    currency: "UGX",
    description: "Tropical Gardens Hotel booking deposit",
    customer: {
      firstName: "Guest",
      lastName: "Name",
      phone: "256782460683",
      email: "guest@example.com"
    }
  })
});
const data = await response.json();
window.location.href = data.redirectUrl;
```

For production, deploy the static frontend to Vercel, Netlify, or GitHub Pages, and deploy the backend to Render, Railway, Fly.io, or AWS with a managed PostgreSQL database.

## Render Deployment

This repository includes a root `render.yaml` Blueprint for hosting the real backend:

- Node API service: `tropical-gardens-hotel-api`
- PostgreSQL database: `tropical-gardens-hotel-db`
- Pre-deploy setup: runs the database schema, seed data, and admin user creation

Create a new Render Blueprint from the GitHub repository, then provide the secret values Render asks for:

- `ADMIN_PASSWORD`
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_IPN_ID` if you already registered one. Otherwise leave it blank and keep `PESAPAL_IPN_URL` set so the backend can register the IPN URL with Pesapal.

The public website is configured through `app-config.js` to call:

```js
window.TGH_API_BASE = "https://tropical-gardens-hotel-api.onrender.com";
```

If Render gives the API a different URL, update `app-config.js` and redeploy GitHub Pages.

Never commit Pesapal keys to Git. Put live credentials only in Render environment variables or a local ignored `backend/.env` file.
