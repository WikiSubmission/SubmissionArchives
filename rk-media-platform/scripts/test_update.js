const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function testUpdate() {
    console.log("Testing text update permissions...");

    // 1. Get an ID for Sura 93:1 Revision
    const { data: verse, error: findError } = await supabase
        .from('quran_editions')
        .select('id, text')
        .eq('edition_key', 'revision')
        .eq('sura', 93)
        .eq('verse', 1)
        .single();

    if (findError || !verse) {
        console.error("Could not find verse:", findError);
        return;
    }

    console.log(`Target Verse ID: ${verse.id}`);
    console.log(`Original Text: "${verse.text}"`);

    // 2. Try to update Header
    const testHeader = "TEST_HEADER_" + Date.now();
    const { data: updateData, error: updateError } = await supabase
        .from('quran_editions')
        .update({ header: testHeader })
        .eq('id', verse.id)
        .select();

    if (updateError) {
        console.error("Update FAILED:", updateError);
    } else {
        console.log("Update SUCCESS. New Data:", updateData);

        // 3. Verify read back
        const { data: verify } = await supabase
            .from('quran_editions')
            .select('header')
            .eq('id', verse.id)
            .single();

        console.log(`Verified Header in DB: "${verify.header}"`);

        // Cleanup (optional, or leave to show user?)
        // Let's clean it up to avoid confusion
        await supabase.from('quran_editions').update({ header: null }).eq('id', verse.id);
        console.log("Cleaned up test header.");
    }
}

testUpdate();
