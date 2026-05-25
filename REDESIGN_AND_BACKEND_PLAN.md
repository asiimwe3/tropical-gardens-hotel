# Tropical Gardens Hotel: Luxury Redesign + Backend Plan

## Design Direction

Position the site as a modern nature-focused boutique hotel: calm, premium, warm, and easy to book.

### Visual Style

- Use deep forest green, warm ivory, champagne gold, charcoal, and natural stone accents.
- Use large real hotel photography: rooms, gardens, restaurant, event spaces, exterior, and staff hospitality.
- Replace busy sections with spacious layouts, elegant typography, and clear booking actions.
- Use subtle motion: smooth hero transitions, gentle image reveals, and refined hover states.
- Keep the mobile layout booking-first: call, WhatsApp, reserve, rooms, maps.

### Homepage Structure

1. Full-screen immersive hero with real hotel image/video, direct booking CTA, WhatsApp CTA, and quick trust badges.
2. Availability search: check-in, check-out, guests, room type.
3. Signature rooms and suites with pricing, amenities, and availability.
4. Nature and hospitality story: gardens, quiet environment, local tourism access.
5. Restaurant and dining section with featured dishes and menu categories.
6. Events and conference section for weddings, meetings, parties, and retreats.
7. Gallery with professional image categories.
8. Reviews and guest trust signals.
9. Location section with nearby attractions, maps, transport, and contact.

### UX Improvements

- Add sticky booking bar on desktop.
- Add bottom mobile actions: Call, WhatsApp, Book, Directions.
- Use clear room cards with amenities, capacity, price, and availability.
- Add confirmation states after booking/contact submission.
- Add loading and error states for API data.
- Remove public admin link from the main navigation.

## Backend Added

I added a backend package under `backend/` with:

- Node.js + Express API
- PostgreSQL schema
- JWT admin login
- Public reservations/contact endpoints
- Pesapal payment checkout for Mobile Money and card collections
- Admin routes for rooms, menu, offers, reservations, and messages
- Validation with Zod
- Security middleware: Helmet, CORS, rate limiting
- Docker and setup docs

## Recommended Next Build Step

Connect the existing `index.html` and `admin.html` to the new API:

- Replace fake reservation/contact handlers with `POST /api/reservations` and `POST /api/contact`.
- Replace `eval()` and `raw.githack.com` data loading with `GET /api/menu`, `GET /api/rooms`, and `GET /api/offers`.
- Add admin login screen and store the JWT securely for admin API calls.
- Move hardcoded admin arrays into PostgreSQL seed data.

## Deployment

Frontend:

- GitHub Pages, Vercel, or Netlify.

Backend:

- Render, Railway, Fly.io, AWS ECS, or DigitalOcean App Platform.

Database:

- Managed PostgreSQL from Render, Railway, Neon, Supabase, AWS RDS, or DigitalOcean.
