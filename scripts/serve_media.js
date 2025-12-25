const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 9090;
// Root directory: c:\Users\Jonathan\Desktop\RKM
const ROOT_DIR = 'c:\\Users\\Jonathan\\Desktop\\RKM';

const mimeTypes = {
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.json': 'application/json',
    '.vtt': 'text/vtt'
};

http.createServer((req, res) => {
    // 1. CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 2. Parse URL
    let reqUrl = url.parse(req.url).pathname;
    // Decode URI component to handle spaces/special chars
    try {
        reqUrl = decodeURIComponent(reqUrl);
    } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    // Prevent directory traversal
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT_DIR, safePath);

    // 3. Check file existence
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (err && err.code === 'ENOENT') {
                console.log(`404 Not Found: ${filePath}`);
                res.writeHead(404);
                res.end('Not Found');
            } else {
                console.log(`500 Error: ${err}`);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
            return;
        }

        const fileSize = stats.size;
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // 4. Handle Range Request
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize) {
                res.writeHead(416, {
                    'Content-Range': `bytes */${fileSize}`
                });
                res.end();
                return;
            }

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });

            console.log(`Serving Range: ${start}-${end}/${fileSize} for ${reqUrl}`);

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
            });
            file.pipe(res);
        } else {
            // Full content
            console.log(`Serving Full: ${reqUrl}`);
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });

}).listen(PORT, () => {
    console.log(`Node Media Server running at http://localhost:${PORT}`);
    console.log(`Serving from: ${ROOT_DIR}`);
});
