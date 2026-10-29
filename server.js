/**
 * CycleCare — Web Server & Deployment Runtime
 * Zero-dependency static file server with environment variable injection.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {
    console.warn('Warning: Could not parse .env file:', e.message);
  }
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const parsedUrl = req.url.split('?')[0];

  // 1. Health check route for cloud deployment orchestrators
  if (parsedUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', app: 'CycleCare', timestamp: new Date().toISOString() }));
  }

  // 2. Dynamic environment variable injection for frontend
  if (parsedUrl === '/env.js') {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || '';
    const safeUrl = supabaseUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeAnon = supabaseAnon.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const envJs = `window.__ENV__ = { VITE_SUPABASE_URL: "${safeUrl}", VITE_SUPABASE_ANON_KEY: "${safeAnon}" };\n`;

    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-cache',
    });
    return res.end(envJs);
  }

  let localPath = parsedUrl === '/' ? '/index.html' : (parsedUrl === '/login' || parsedUrl === '/login-demo' ? '/login-demo.html' : parsedUrl);
  let filePath = path.join(__dirname, localPath);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.end(content);
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🌸 CycleCare server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Environment runtime: http://localhost:${PORT}/env.js`);
  });
}

module.exports = server;
