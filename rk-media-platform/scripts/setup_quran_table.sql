-- Create the table for storing Quran editions
create table public.quran_editions (
  id uuid default gen_random_uuid() primary key,
  edition_key text not null, -- e.g., '1981', '1989', 'revision'
  sura integer not null,
  verse integer not null,
  text text not null,
  footnotes jsonb, -- Optional: store footnotes as structured data
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate verses for the same edition
  unique(edition_key, sura, verse)
);

-- Add indexes for fast lookup
create index idx_quran_editions_lookup on public.quran_editions(sura, verse);
create index idx_quran_editions_key on public.quran_editions(edition_key);

-- Enable RLS (Optional, depending on policy)
alter table public.quran_editions enable row level security;

-- Allow public read access (if this is a public app)
create policy "Allow public read access"
  on public.quran_editions
  for select
  to public
  using (true);

-- Allow authenticated upload (adjust as needed)
create policy "Allow authenticated upload"
  on public.quran_editions
  for insert
  to authenticated
  with check (true);
