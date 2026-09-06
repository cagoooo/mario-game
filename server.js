const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.html': 'text/html' };
http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); res.end('Bad request'); return; }
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) {
        res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.readFile(target, (error, data) => {
        if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end('File unavailable'); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
    });
}).listen(8000, '127.0.0.1', () => console.log('Server running at http://127.0.0.1:8000/'));
