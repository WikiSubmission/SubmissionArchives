
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTitles() {
    const { data, error } = await supabase
        .from('media')
        .select('id, title, type')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching media:', error);
        return;
    }

    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.type]) grouped[item.type] = [];
        if (grouped[item.type].length < 20) { // Keep top 20
            grouped[item.type].push(item.title);
        }
    });

    let output = '--- SAMPLE TITLES ---\n';
    for (const [type, titles] of Object.entries(grouped)) {
        output += `\nTYPE: ${type}\n`;
        titles.forEach(t => output += `  - ${t}\n`);
    }

    fs.writeFileSync(path.join(__dirname, 'titles_utf8.txt'), output, 'utf8');
}

inspectTitles();
