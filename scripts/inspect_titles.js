
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTitles() {
    const { data, error } = await supabase
        .from('media') // Assuming table name is 'media'
        .select('id, title, type')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching media:', error);
        return;
    }

    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.type]) grouped[item.type] = [];
        if (grouped[item.type].length < 10) { // Keep top 10 for inspection
            grouped[item.type].push(item.title);
        }
    });

    console.log('--- SAMPLE TITLES ---');
    for (const [type, titles] of Object.entries(grouped)) {
        console.log(`\nTYPE: ${type}`);
        titles.forEach(t => console.log(`  - ${t}`));
    }
}

inspectTitles();
