# Tropical Gardens Hotel Supabase Setup

Run `create_all_tables.sql` in the Supabase SQL Editor for project:

`https://eiyexnuhqdscomilwpqg.supabase.co`

It creates the hotel tables used by the website and admin system:

- `rooms`
- `menu_items`
- `offers`
- `notifications`
- `bookings`
- `reservations`
- `payments`
- `guest_messages`
- `reviews`
- `gallery`
- `staff_profiles`
- `hotel_settings`

It also enables Row Level Security and adds public policies for safe website reads and booking/message inserts.

## Admin Dashboard Active Mode

The admin dashboard first tries the hosted backend API. If that API is unavailable, it now falls back to Supabase Auth and the Supabase REST API.

To activate the dashboard:

1. Run `create_all_tables.sql` in the Supabase SQL Editor.
2. In Supabase Dashboard, go to Authentication > Users.
3. Create an admin user with the hotel email and a strong password.
4. Sign in at `/admin.html` using that Supabase email and password.

Authenticated Supabase users can manage rooms, menu items, offers, notifications, bookings, reservations, payments, messages, reviews, gallery, staff, and settings through the RLS policies in `create_all_tables.sql`.

Do not put Supabase secret or service-role keys in frontend files. The website should use only the publishable/anon key in `supabase-config.js`.
