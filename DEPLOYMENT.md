# Tropical Gardens Hotel Deployment

This repository contains the production setup files for the website, Supabase data layer, Vercel static hosting, and Render backend.

## Live Website

- Domain: `https://tropicalgardenshotelkyenjojo.com`
- Custom domain file: `CNAME`
- Static hosting config: `vercel.json`

## Vercel

The Vercel project id provided for this site is:

```text
prj_Uj1VwlZhbaNSbeBCI3CR6QGxQZkj
```

The repository includes `vercel.json` with security headers for:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Cross-Origin-Opener-Policy
- Restricted CORS origin

Do not commit `VERCEL_TOKEN`, Vercel team/org secrets, or `.vercel` local credentials. Add private Vercel values in Vercel or GitHub repository secrets.

## Supabase

The public Supabase config used by the frontend is in `supabase-config.js`.

The full database setup is in:

```text
supabase/create_all_tables.sql
```

Run that SQL in the Supabase SQL Editor to create:

- rooms
- menu_items
- offers
- notifications
- bookings
- reservations
- payments
- guest_messages
- reviews
- gallery
- staff_profiles
- hotel_settings

The admin dashboard supports active mode by logging in with a Supabase Auth user when the hosted backend API is unavailable.

Do not commit Supabase service-role keys or database passwords. The website must only use the public publishable/anon key.

## Backend

The backend deployment blueprint is in `render.yaml`.

Render secrets that must be set in the hosting dashboard:

- `ADMIN_PASSWORD`
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_IPN_ID` if already registered

Before accepting real payments, regenerate the Pesapal Consumer Secret and update the hosting environment variables.
