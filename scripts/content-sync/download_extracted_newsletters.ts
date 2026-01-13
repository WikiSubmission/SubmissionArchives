
import https from 'https';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'public/data/newsletters';

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

interface NewsletterLink {
    text: string;
    year: string;
    href: string;
}

const LINKS: NewsletterLink[] = [
    {
        "text": "January",
        "year": "1990",
        "href": "https://www.masjidtucson.org/publications/books/sp/1990/pdf/SP1990jan.pdf"
    },
    {
        "text": "January bonus issue",
        "year": "1990",
        "href": "https://www.masjidtucson.org/publications/books/SP/1990/pdf/SP1990jan_special_issue.pdf"
    },
    {
        "text": "February",
        "year": "1990",
        "href": "https://www.masjidtucson.org/publications/books/sp/1990/pdf/SP1990feb.pdf"
    },
    {
        "text": "March",
        "year": "1990",
        "href": "https://www.masjidtucson.org/publications/books/sp/1990/pdf/SP1990mar.pdf"
    },
    {
        "text": "January",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989jan.pdf"
    },
    {
        "text": "February",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989feb.pdf"
    },
    {
        "text": "March",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989mar.pdf"
    },
    {
        "text": "April",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989apr.pdf"
    },
    {
        "text": "May",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989may.pdf"
    },
    {
        "text": "June",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989jun.pdf"
    },
    {
        "text": "July",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989jul.pdf"
    },
    {
        "text": "August",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989aug.pdf"
    },
    {
        "text": "September",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989sep.pdf"
    },
    {
        "text": "October",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989oct.pdf"
    },
    {
        "text": "November",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989nov.pdf"
    },
    {
        "text": "December",
        "year": "1989",
        "href": "https://www.masjidtucson.org/publications/books/sp/1989/pdf/SP1989dec.pdf"
    },
    {
        "text": "January",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988jan.pdf"
    },
    {
        "text": "February",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988feb.pdf"
    },
    {
        "text": "March",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988mar.pdf"
    },
    {
        "text": "April",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988apr.pdf"
    },
    {
        "text": "May",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988may.pdf"
    },
    {
        "text": "May Bulletin",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988may_bulletin.pdf"
    },
    {
        "text": "June",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988jun.pdf"
    },
    {
        "text": "July",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988jul.pdf"
    },
    {
        "text": "August",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988aug.pdf"
    },
    {
        "text": "September",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988sep.pdf"
    },
    {
        "text": "October",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988oct.pdf"
    },
    {
        "text": "November",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988nov.pdf"
    },
    {
        "text": "December",
        "year": "1988",
        "href": "https://www.masjidtucson.org/publications/books/sp/1988/pdf/SP1988dec.pdf"
    },
    {
        "text": "January",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987jan.pdf"
    },
    {
        "text": "February",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987feb.pdf"
    },
    {
        "text": "March",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987mar.pdf"
    },
    {
        "text": "April",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987apr.pdf"
    },
    {
        "text": "May",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987may.pdf"
    },
    {
        "text": "June",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987jun.pdf"
    },
    {
        "text": "July",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987jul.pdf"
    },
    {
        "text": "August",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987aug.pdf"
    },
    {
        "text": "September",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987sep.pdf"
    },
    {
        "text": "October",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987oct.pdf"
    },
    {
        "text": "November",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987nov.pdf"
    },
    {
        "text": "December",
        "year": "1987",
        "href": "https://www.masjidtucson.org/publications/books/sp/1987/pdf/SP1987dec.pdf"
    },
    {
        "text": "January",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986jan.pdf"
    },
    {
        "text": "February",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986feb.pdf"
    },
    {
        "text": "March",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986mar.pdf"
    },
    {
        "text": "April",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986apr.pdf"
    },
    {
        "text": "May",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986may.pdf"
    },
    {
        "text": "June",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986jun.pdf"
    },
    {
        "text": "July",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986jul.pdf"
    },
    {
        "text": "August",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986aug.pdf"
    },
    {
        "text": "September",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986sep.pdf"
    },
    {
        "text": "October",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986oct.pdf"
    },
    {
        "text": "November",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986nov.pdf"
    },
    {
        "text": "December",
        "year": "1986",
        "href": "https://www.masjidtucson.org/publications/books/sp/1986/pdf/SP1986dec.pdf"
    },
    {
        "text": "February",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985feb.pdf"
    },
    {
        "text": "March",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985mar.pdf"
    },
    {
        "text": "April",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985apr.pdf"
    },
    {
        "text": "May",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985may.pdf"
    },
    {
        "text": "June",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985jun.pdf"
    },
    {
        "text": "July",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985jul.pdf"
    },
    {
        "text": "August",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985aug.pdf"
    },
    {
        "text": "September",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985sep.pdf"
    },
    {
        "text": "October",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985oct.pdf"
    },
    {
        "text": "November",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985nov.pdf"
    },
    {
        "text": "December",
        "year": "1985",
        "href": "https://www.masjidtucson.org/publications/books/sp/1985/pdf/SP1985dec.pdf"
    }
];

// Helper to download with redirect support
function download(url: string, dest: string): Promise<boolean> {
    return new Promise((resolve) => {
        const get = (targetUrl: string) => {
            https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                // Handle Redirect
                if (res.statusCode === 301 || res.statusCode === 302) {
                    if (res.headers.location) {
                        // console.log(`Redirecting to ${res.headers.location}`);
                        // Handle relative redirects if needed, but usually they are absolute or relative to host
                        let newUrl = res.headers.location;
                        if (!newUrl.startsWith('http')) {
                            // Assuming redirect to same host/protocol if relative
                            const parsed = new URL(targetUrl);
                            newUrl = `${parsed.protocol}//${parsed.host}${newUrl}`;
                        }
                        get(newUrl);
                        return;
                    }
                }

                if (res.statusCode === 200) {
                    const file = fs.createWriteStream(dest);
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(true);
                    });
                } else {
                    // console.log(`Failed [${res.statusCode}]: ${targetUrl}`);
                    resolve(false);
                }
            }).on('error', (e) => {
                console.log(`Error: ${e.message}`);
                resolve(false);
            });
        };

        get(url);
    });
}

// Map month name to number
const MON_MAP: Record<string, string> = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
};

async function main() {
    const metadata: any[] = [];

    console.log(`Starting download of ${LINKS.length} files...`);

    for (const item of LINKS) {
        // Construct clean filename
        // e.g. 1985_02_February.pdf
        const rawMon = item.text.split(' ')[0]; // Handle "January bonus issue" -> "January"
        const monNum = MON_MAP[rawMon] || '00';
        const filename = `${item.year}_${monNum}_${item.text.replace(/ /g, '_')}.pdf`;
        const dest = path.join(OUT_DIR, filename);

        console.log(`Downloading ${filename}...`);
        const success = await download(item.href, dest);

        if (success) {
            metadata.push({
                id: filename.replace('.pdf', ''),
                title: `Submitter Perspective: ${item.text}`,
                year: parseInt(item.year),
                month: rawMon,
                displayDate: `${item.text} ${item.year}`,
                fullDate: `${item.year}-${monNum}-01`, // For ISO Sorting
                filename: filename,
                url: `/data/newsletters/${filename}`
            });
        }
    }

    // Sort metadata by date ascending (oldest first) as requested by filtering logic default
    // Using explicit fullDate for sorting
    metadata.sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    fs.writeFileSync(path.join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
    console.log(`Done! Saved ${metadata.length} files.`);
}

main();
