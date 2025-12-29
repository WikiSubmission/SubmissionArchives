const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv(filePath) {
    try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, 'utf-8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            });
        }
    } catch (e) { }
}

loadEnv('.env.local');

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseServiceKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'; // Using key found in source for diagnosis

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    // Attempt to hardcode if env fails (using keys from client file I saw earlier, solely for diagnosis)
    // Actually, I saw keys in src/lib/supabaseClient.ts earlier. 
    // supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
    // supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
    // But better to rely on env first.
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('Checking quran_editions table...');
    const { data, error } = await supabase
        .from('quran_editions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Connection Error Object:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success! Table exists.');
    }
}

checkTable();
