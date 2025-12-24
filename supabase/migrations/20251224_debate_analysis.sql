-- Drop the old tables if they exist
drop table if exists party_stances;
drop table if exists poll_analysis;


-- Create the new analysis table
create table if not exists poll_analysis (
  id bigint generated always as identity primary key,
  poll_id bigint references polls (id) on delete cascade not null unique,
  description text,
  pro_arguments jsonb, -- Array of strings or objects
  contra_arguments jsonb, -- Array of strings or objects
  sources jsonb, -- Array of URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index if not exists poll_analysis_poll_id_idx on poll_analysis (poll_id);

-- Enable RLS
alter table poll_analysis enable row level security;

-- Allow public read access
create policy "Public analysis access"
  on poll_analysis for select
  using (true);
