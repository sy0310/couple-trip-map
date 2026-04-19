-- 001_initial_schema.sql
-- Run this in Supabase SQL Editor to create the database schema.

-- ── users ──
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ── couples ──
create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id),
  user_b_id uuid references users(id),
  binding_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── trips ──
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  location_name text not null,
  province text not null,
  city text not null,
  scenic_spot text,
  lat double precision,
  lng double precision,
  visit_date date not null,
  notes text,
  photo_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── photos ──
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  file_url text not null,
  description text,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── locations (reference data for province/city/scenic spots) ──
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  province text not null,
  city text not null,
  scenic_spot text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- ── Indexes ──
create index if not exists idx_trips_couple_id on trips(couple_id);
create index if not exists idx_trips_province on trips(province);
create index if not exists idx_trips_city on trips(city);
create index if not exists idx_photos_trip_id on photos(trip_id);

-- ── Row Level Security ──
alter table users enable row level security;
alter table couples enable row level security;
alter table trips enable row level security;
alter table photos enable row level security;
alter table locations enable row level security;

-- Anonymous mode: anyone can SELECT and INSERT trips/photos
-- (Will be tightened when auth is added)
create policy "Anyone can read trips"
  on trips for select
  using (true);

create policy "Anyone can insert trips"
  on trips for insert
  with check (true);

create policy "Anyone can update their trips"
  on trips for update
  using (true);

create policy "Anyone can delete trips"
  on trips for delete
  using (true);

create policy "Anyone can read photos"
  on photos for select
  using (true);

create policy "Anyone can insert photos"
  on photos for insert
  with check (true);

create policy "Anyone can read locations"
  on locations for select
  using (true);

-- ── Storage: Photo bucket ──
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "Anyone can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

create policy "Anyone can read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Anyone can delete photos"
  on storage.objects for delete
  using (bucket_id = 'photos');
