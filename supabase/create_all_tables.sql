-- Tropical Gardens Hotel - Supabase setup
-- Run this in Supabase SQL Editor to create all website/admin tables.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_number text,
  description text not null default '',
  type text not null default 'Standard',
  price integer not null default 0 check (price >= 0),
  capacity integer not null default 1 check (capacity > 0),
  image_url text,
  amenities jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('Breakfast','Lunch','Dinner','Drinks','Desserts','Snacks')),
  price integer not null default 0 check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  code text,
  starts_at date not null default current_date,
  ends_at date not null default (current_date + 30),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  channel text not null default 'Website',
  audience text not null default 'All Guests',
  type text not null default 'update' check (type in ('update','promo','alert')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  first_name text,
  last_name text,
  phone text not null,
  email text,
  room_id uuid references public.rooms(id) on delete set null,
  room_name text,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1 check (guests > 0),
  notes text not null default '',
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Checked In','Checked Out','Cancelled')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Pending','Paid','Failed','Refunded')),
  deposit_amount integer not null default 0 check (deposit_amount >= 0),
  source text not null default 'Website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  phone text not null,
  email text,
  room_id uuid references public.rooms(id) on delete set null,
  room_name text,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1 check (guests > 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Checked In','Checked Out','Cancelled')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Pending','Paid','Failed','Refunded')),
  amount_paid integer not null default 0 check (amount_paid >= 0),
  payment_reference text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  merchant_reference text unique not null,
  provider text not null default 'pesapal',
  provider_tracking_id text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'UGX',
  status text not null default 'PENDING',
  payment_method text,
  payment_account text,
  confirmation_code text,
  checkout_url text,
  raw_status jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  subject text,
  message text not null,
  status text not null default 'Unread' check (status in ('Unread','Read','Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  guest text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  review_date date not null default current_date,
  status text not null default 'Pending' check (status in ('Pending','Published','Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text not null default 'Hotel photo',
  category text not null default 'Facilities',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text not null default 'Receptionist',
  phone text,
  access text[] not null default '{}',
  last_login timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_available_sort on public.rooms(is_available, sort_order);
create index if not exists idx_menu_category_sort on public.menu_items(category, sort_order);
create index if not exists idx_notifications_active_created on public.notifications(is_active, created_at desc);
create index if not exists idx_bookings_status_dates on public.bookings(status, check_in, check_out);
create index if not exists idx_reservations_status_dates on public.reservations(status, check_in, check_out);
create index if not exists idx_payments_reference on public.payments(merchant_reference);
create index if not exists idx_payments_tracking on public.payments(provider_tracking_id);
create index if not exists idx_messages_status on public.guest_messages(status);
create index if not exists idx_reviews_status on public.reviews(status, review_date desc);
create index if not exists idx_gallery_active_sort on public.gallery(is_active, sort_order);

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at before update on public.offers for each row execute function public.set_updated_at();
drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();
drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
drop trigger if exists set_guest_messages_updated_at on public.guest_messages;
create trigger set_guest_messages_updated_at before update on public.guest_messages for each row execute function public.set_updated_at();
drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
drop trigger if exists set_gallery_updated_at on public.gallery;
create trigger set_gallery_updated_at before update on public.gallery for each row execute function public.set_updated_at();
drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;
alter table public.menu_items enable row level security;
alter table public.offers enable row level security;
alter table public.notifications enable row level security;
alter table public.bookings enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.guest_messages enable row level security;
alter table public.reviews enable row level security;
alter table public.gallery enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.hotel_settings enable row level security;

drop policy if exists "Public can read available rooms" on public.rooms;
create policy "Public can read available rooms" on public.rooms for select to anon using (is_available = true);
drop policy if exists "Public can read available menu items" on public.menu_items;
create policy "Public can read available menu items" on public.menu_items for select to anon using (is_available = true);
drop policy if exists "Public can read active offers" on public.offers;
create policy "Public can read active offers" on public.offers for select to anon using (is_active = true and current_date between starts_at and ends_at);
drop policy if exists "Public can read active notifications" on public.notifications;
create policy "Public can read active notifications" on public.notifications for select to anon using (is_active = true);
drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings" on public.bookings for insert to anon with check (true);
drop policy if exists "Public can create guest messages" on public.guest_messages;
create policy "Public can create guest messages" on public.guest_messages for insert to anon with check (true);
drop policy if exists "Public can read published reviews" on public.reviews;
create policy "Public can read published reviews" on public.reviews for select to anon using (status = 'Published');
drop policy if exists "Public can read active gallery" on public.gallery;
create policy "Public can read active gallery" on public.gallery for select to anon using (is_active = true);

drop policy if exists "Authenticated users manage rooms" on public.rooms;
create policy "Authenticated users manage rooms" on public.rooms for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage menu" on public.menu_items;
create policy "Authenticated users manage menu" on public.menu_items for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage offers" on public.offers;
create policy "Authenticated users manage offers" on public.offers for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage notifications" on public.notifications;
create policy "Authenticated users manage notifications" on public.notifications for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage bookings" on public.bookings;
create policy "Authenticated users manage bookings" on public.bookings for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage reservations" on public.reservations;
create policy "Authenticated users manage reservations" on public.reservations for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage payments" on public.payments;
create policy "Authenticated users manage payments" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage messages" on public.guest_messages;
create policy "Authenticated users manage messages" on public.guest_messages for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage reviews" on public.reviews;
create policy "Authenticated users manage reviews" on public.reviews for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage gallery" on public.gallery;
create policy "Authenticated users manage gallery" on public.gallery for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage staff" on public.staff_profiles;
create policy "Authenticated users manage staff" on public.staff_profiles for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage settings" on public.hotel_settings;
create policy "Authenticated users manage settings" on public.hotel_settings for all to authenticated using (true) with check (true);

insert into public.rooms (name, room_number, description, type, price, capacity, image_url, is_available, sort_order)
select * from (values
  ('Standard Room', '101', 'Cosy room with queen bed, en-suite bathroom, and garden view.', 'Standard', 80000, 2, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/2-min.jpg', true, 10),
  ('Deluxe Room', '201', 'Spacious room with king bed, work desk, and peaceful garden views.', 'Deluxe', 150000, 2, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/8-min.jpg', true, 20),
  ('Family Suite', '301', 'Premium family suite with lounge space and elevated privacy.', 'Suite', 250000, 4, 'https://tropicalgardenshotel.com/wp-content/uploads/2023/06/3-min.jpg', true, 30)
) as seed(name, room_number, description, type, price, capacity, image_url, is_available, sort_order)
where not exists (select 1 from public.rooms);

insert into public.menu_items (name, description, category, price, image_url, is_available, is_featured, sort_order)
select * from (values
  ('Tropical Breakfast Platter', 'Fresh fruit, eggs, toast, juice, and Ugandan tea.', 'Breakfast', 18000, 'https://commons.wikimedia.org/wiki/Special:FilePath/Rolex%20in%20Mbarara.jpg?width=900', true, true, 10),
  ('Grilled Tilapia', 'Fresh tilapia grilled with herbs and served with local sides.', 'Lunch', 32000, 'https://commons.wikimedia.org/wiki/Special:FilePath/Grilled%20Tilapia%20001.jpg?width=900', true, true, 20),
  ('Garden Chicken Dinner', 'Tender chicken stew with matooke, rice, or posho.', 'Dinner', 28000, 'https://commons.wikimedia.org/wiki/Special:FilePath/Preparing%20chicken%20stew.jpg?width=900', true, false, 30),
  ('Fresh Passion Juice', 'Cold house-made passion fruit juice.', 'Drinks', 7000, 'https://commons.wikimedia.org/wiki/Special:FilePath/Passion%20fruit%20juice.jpg?width=900', true, false, 40)
) as seed(name, description, category, price, image_url, is_available, is_featured, sort_order)
where not exists (select 1 from public.menu_items);

insert into public.notifications (title, body, channel, audience, type, is_active)
select * from (values
  ('Weekend Special Offer', 'Book this weekend and enjoy 20% off all rooms.', 'Website Banner', 'All Guests', 'promo', true),
  ('New Breakfast Menu', 'We have added new breakfast options for guests and visitors.', 'Website', 'All Guests', 'update', true)
) as seed(title, body, channel, audience, type, is_active)
where not exists (select 1 from public.notifications);
