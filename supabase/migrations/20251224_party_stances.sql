create table if not exists party_stances (
  id bigint generated always as identity primary key,
  poll_id bigint references polls (id) on delete cascade not null,
  party_name text not null,
  stance text not null,
  source_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate entries for same party on same poll
  unique(poll_id, party_name)
);

-- Index for faster lookups
create index if not exists party_stances_poll_id_idx on party_stances (poll_id);

-- Enable RLS (Optional but good practice if exposed to client)
alter table party_stances enable row level security;

-- Allow public read access (since everyone should see it)
create policy "Public stances access"
  on party_stances for select
  using (true);

-- Allow service role (server) full access
-- (Supabase service role bypasses RLS, but explicit policies or default closed is safer. 
-- For now, read-only public is sufficient for client, write is backend only)
