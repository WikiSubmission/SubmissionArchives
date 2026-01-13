# Setup Guide: Quran Translation Comparison

To fix the error `Error fetching verses: {}` and get the Comparison page working, you need to set up the database table.

## Step 1: Fix API Key (Critical)

Your project currently has a **Secret Key** in the code, which is blocking the browser. You need to switch it to the **Public Key**.

1.  Log in to **Supabase Dashboard**.
2.  Go to **Project Settings** (Cog icon at bottom left).
3.  Click **"API"** in the sidebar.
4.  Look for the **"anon" public** key (it starts with `ey...`). **Copy it.**
5.  Open the file `src/lib/supabaseClient.ts` in your editor.
6.  Replace the `supabaseKey` value with the key you just copied.

```typescript
// src/lib/supabaseClient.ts

// OLD (Incorrect)
const supabaseKey = 'sb_secret_...'

// NEW (Correct)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // <-- Paste your anon key here
```

## Step 2: Create the Table in Supabase

1.  Log in to your **Supabase Dashboard** (https://supabase.com/dashboard).
2.  Select your project (**RK Media Platform**).
3.  Click on the **SQL Editor** icon in the left sidebar (it looks like a terminal `>_`).
4.  Click **"New Query"**.
5.  Copy the SQL code below (or from `scripts/setup_quran_table.sql`):
    ```sql
    -- Create the table
    create table public.quran_editions (
      id uuid default gen_random_uuid() primary key,
      edition_key text not null, -- '1981', '1989', 'revision'
      sura integer not null,
      verse integer not null,
      text text not null,
      footnotes jsonb,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      unique(edition_key, sura, verse)
    );

    -- Add indexes for speed
    create index idx_quran_editions_lookup on public.quran_editions(sura, verse);
    create index idx_quran_editions_key on public.quran_editions(edition_key);

    -- Allow public read access
    alter table public.quran_editions enable row level security;
    create policy "Allow public read access" on public.quran_editions for select to public using (true);
    create policy "Allow auth upload" on public.quran_editions for insert to authenticated with check (true);
    ```
6.  Click the big green **RUN** button.

## Step 2: Upload Your Data (Optional for now)

The page works without data (it just says "No Data"), but to see text, you need to upload it.
You need **3 JSON files**, one for each edition (1981, 1989, Revision).

**JSON Format Example:**
```json
[
  { "sura": 1, "verse": 1, "text": "In the name of God...", "footnotes": null },
  { "sura": 1, "verse": 2, "text": "Praise be to God...", "footnotes": null }
]
```

**How to Upload:**
Run these commands in your terminal (replace paths with your actual file locations):

```bash
# Upload 1981 Edition
node scripts/upload_quran_editions.js "./path/to/1981_quran.json" 1981

# Upload 1989 Edition
node scripts/upload_quran_editions.js "./path/to/1989_quran.json" 1989

# Upload Revision
node scripts/upload_quran_editions.js "./path/to/revision_quran.json" revision
```

Once Step 1 is done, refresh the website and the error will be gone!
