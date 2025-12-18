
const { createClient } = require('@supabase/supabase-js');

// Config
const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error("Error: SUPABASE_KEY environment variable is missing.");
    console.error("Usage: set SUPABASE_KEY=your_key_here && node scripts/test_supabase.js");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing connection to Supabase...");
    console.log(`URL: ${supabaseUrl}`);

    // Try to select from a non-existent table just to check authentication/connection
    // Or if there are public tables, we could list them.
    // A simple way to check auth is getting the user session (though this is a service role/anon key scenario).
    // Let's try to query 'media' table assuming it might exist, or just check if we get a network error vs 404.

    const { data, error } = await supabase.from('media').select('*').limit(1);

    if (error) {
        if (error.code === 'PGRST204') {
            console.log("Success! Connected to Supabase (but 'media' table not found, which is expected).");
        } else {
            console.log("Connection attempt finished.");
            console.log("Response Error:", error.message);
            console.log("(This likely means the connection worked but the table implies a schema issue or empty DB).");
        }
    } else {
        console.log("Success! Connected and found 'media' table.");
        console.log("Data:", data);
    }
}

testConnection();
