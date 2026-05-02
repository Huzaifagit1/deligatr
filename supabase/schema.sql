-- Enable UUID extension
create extension if not exists "pgcrypto";

-- PDFs table
create table if not exists pdfs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  tracking_id uuid unique not null default gen_random_uuid(),
  campaign_name text,
  created_at timestamptz not null default now()
);

-- Tracking events table
create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  tracking_id uuid not null references pdfs(tracking_id) on delete cascade,
  pdf_name text not null,
  campaign_name text,
  opened_at timestamptz not null default now(),
  ip text,
  city text,
  country text,
  device text,
  browser text,
  os text,
  screen_width int,
  screen_height int,
  timezone text,
  language text,
  is_bot boolean not null default false,
  event_file_path text
);

-- Indexes for common queries
create index if not exists tracking_events_tracking_id_idx on tracking_events(tracking_id);
create index if not exists tracking_events_opened_at_idx on tracking_events(opened_at desc);

-- Enable Row Level Security
alter table pdfs enable row level security;
alter table tracking_events enable row level security;

-- Allow all operations from service role (used by API routes)
-- For production you'd scope these to authenticated users
create policy "service_role_all_pdfs" on pdfs
  for all using (true) with check (true);

create policy "service_role_all_events" on tracking_events
  for all using (true) with check (true);

-- Enable realtime on tracking_events
alter publication supabase_realtime add table tracking_events;
