
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSpecifics() {
    console.log("Searching for specific titles...");
    const terms = ['Rashad Council', 'June', 'July', 'August'];
    const { data, error } = await supabase
        .from('media')
        .select('id, title, type, created_at')
        .or(`title.ilike.%Rashad Council%,title.ilike.%June%,title.ilike.%July%,title.ilike.%August%`);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(item => {
        console.log(`[${item.type}] ${item.title} (ID: ${item.id})`);
    });

    // Also perform the update for Rashad Council Fatiha
    console.log("\nUpdating 'Rashad Council Fatiha' to video-program...");
    const toUpdate = data.find(d => d.title.includes("Rashad Council Fatiha"));
    if (toUpdate) {
        const { error: updateError } = await supabase
            .from('media')
            .update({ type: 'video-program' })
            .eq('id', toUpdate.id);

        if (updateError) console.error("Update failed:", updateError);
        else console.log("Update successful!");
    } else {
        console.log("Could not find 'Rashad Council Fatiha' to update.");
    }
}

findSpecifics();
