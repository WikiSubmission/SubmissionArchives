
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aXJ5cGJzaHBoemJkdnpycWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODIzNTEsImV4cCI6MjA4MTI1ODM1MX0.LUY7ja4LERG6wqPPMURrXWuyB0u4f2pRMTnU07hn8WM'

async function main() {
    console.log("Probing Supabase Buckets for access...");

    // Known file from RENAME_MAP #1
    // We try standard URL encoding and raw
    const testFilename = "1) Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989).mp3";
    const testFilenameEncoded = encodeURIComponent(testFilename);

    // Possible buckets and paths
    const buckets = ['media', 'rkmediaassets', 'public', 'files', 'quran-studies'];
    const folders = ['', 'messenger_quran_studies/', 'audio/', 'media/messenger_quran_studies/'];

    for (const bucket of buckets) {
        for (const folder of folders) {
            const path = `${folder}${testFilename}`;
            const pathEncoded = `${folder}${testFilenameEncoded}`;

            // Construct Public URL
            // https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathEncoded}`;

            process.stdout.write(`Testing: ${bucket}/${path}... `);

            try {
                const res = await fetch(publicUrl, { method: 'HEAD' });
                if (res.ok) {
                    console.log(`\n✅ FOUND! [${res.status}] ${publicUrl}`);
                    console.log(`  Content-Type: ${res.headers.get('content-type')}`);
                    console.log(`  Content-Length: ${res.headers.get('content-length')}`);
                    return; // We found a working path!
                } else {
                    // console.log(`✗ ${res.status}`);
                    process.stdout.write(`✗ ${res.status}\n`);
                }
            } catch (e: any) {
                console.log(`Error: ${e.message}`);
            }
        }
    }
    console.log("\nProbe complete. No public files found with guessed paths.");
}

main()
