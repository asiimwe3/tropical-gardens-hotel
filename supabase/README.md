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

Do not put Supabase secret or service-role keys in frontend files. The website should use only the publishable/anon key in `supabase-config.js`.
