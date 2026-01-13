-- Study Edition Schema

-- Table for storing exegesis, notes, and media for specific verses
create table if not exists study_entries (
  id uuid default gen_random_uuid() primary key,
  
  -- Reference System: "SOURCE:BOOK:CHAPTER:VERSE"
  -- Examples: "OT:Genesis:1:1", "NT:Matthew:5:3", "QURAN:2:255"
  verse_ref text not null,
  
  -- Human readable title for the note (optional, defaults to Verse Ref)
  title text,

  -- Rich text content (Markdown or HTML)
  content text,

  -- Structured Media Links
  -- Format: [{ "type": "youtube", "url": "...", "title": "...", "timestamp": 120 }, { "type": "book", "citation": "..." }]
  media_content jsonb default '[]'::jsonb,

  -- Cross References
  -- Array of verse_refs this note connects to
  cross_refs text[] default array[]::text[],

  -- Metadata
  author_id uuid references auth.users(id), -- If we want to track who wrote it (Admin)
  is_published boolean default true,       -- Draft vs Live
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookup by verse reference
create index if not exists study_entries_verse_ref_idx on study_entries (verse_ref);

-- Comments (Community Engagement - Future Proofing)
create table if not exists study_comments (
  id uuid default gen_random_uuid() primary key,
  entry_id uuid references study_entries(id) on delete cascade,
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
