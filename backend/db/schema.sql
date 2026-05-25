create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_number text,
  description text not null default '',
  type text not null default '',
  price integer not null check (price >= 0),
  capacity integer not null check (capacity > 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('Breakfast','Lunch','Dinner','Drinks','Desserts','Snacks')),
  price integer not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  code text,
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  phone text not null,
  email text,
  room_id uuid references rooms(id) on delete set null,
  room_name text,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Checked In','Checked Out','Cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists guest_messages (
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

create index if not exists idx_reservations_status on reservations(status);
create index if not exists idx_reservations_dates on reservations(check_in, check_out);
create index if not exists idx_menu_category on menu_items(category);
create index if not exists idx_messages_status on guest_messages(status);
