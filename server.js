/**
 * CycleCare — Web Server & Deployment Runtime
 * Zero-dependency static file server with environment variable injection.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleSmsApiRoute } = require('./sms/smsHttpHandler');

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
  const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parsedUrl = fullUrl.pathname;
  const searchParams = fullUrl.searchParams;

  // 1. Health check route for cloud deployment orchestrators
  if (parsedUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      app: 'CycleCare',
      apps: ['CycleCare', 'SmsBusGateway'],
      timestamp: new Date().toISOString()
    }));
  }

  // 2. Dynamic environment variable injection for frontend
  if (parsedUrl === '/env.js') {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || '';
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const safeUrl = supabaseUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeAnon = supabaseAnon.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const envJs = `window.__ENV__ = { VITE_SUPABASE_URL: "${safeUrl}", VITE_SUPABASE_ANON_KEY: "${safeAnon}", GEMINI_CONFIGURED: ${hasGemini} };\n`;

    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-cache',
    });
    return res.end(envJs);
  }

  // 3. Upstream SMS Provider Integration (SMS-BUS official API & extensible suppliers)
  if (parsedUrl.startsWith('/api/sms')) {
    handleSmsApiRoute(req, res, parsedUrl, searchParams);
    return;
  }

  // 4. Generative AI Chat endpoint (Google Gemini 1.5 Flash)
  if (req.method === 'POST' && parsedUrl === '/api/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB payload ceiling
    });
    req.on('end', async () => {
      try {
        const { message, cycleStatus, profile, conversationHistory, apiKey: clientApiKey } = JSON.parse(body || '{}');
        const apiKey = clientApiKey || process.env.GEMINI_API_KEY || '';

        if (!apiKey) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            hasApiKey: false,
            fallback: true,
            notice: 'No Gemini API key configured. Using on-device clinical knowledge base.'
          }));
        }

        const currentDay = cycleStatus?.currentCycleDay || 1;
        const phaseTitle = cycleStatus?.phaseTitle || 'Cycle';
        const phaseDesc = cycleStatus?.phaseDescription || 'Natural hormonal rhythms';
        const userName = profile?.isAnonymous ? 'Friend' : ((profile?.name || 'there').split(' ')[0]);

        const systemInstruction = `You are Maya, a warm, compassionate, highly knowledgeable, and medically responsible women's health companion inside CycleCare.
Current User Context:
- User Name: ${userName}
- Current Cycle Day: Day ${currentDay} (${phaseTitle} Phase)
- Phase Biology: ${phaseDesc}

Guidelines:
1. Answer the user's specific question directly, warmly, and conversationally—just like ChatGPT, but tailored as an empathetic women's health companion.
2. If the user asks casual or personal questions (e.g. "can you be honest with me", "who are you", "tell me a joke", "how are you feeling"), answer warmly and genuinely like a caring companion. Do NOT force cycle explanations unless relevant.
3. For medical, reproductive, menstrual, or nutritional questions, provide clear evidence-based guidance based on ACOG, WHO, and endocrine standards.
4. Maintain medical responsibility: clarify that you provide clinical wellness awareness, not formal medical diagnosis. If symptoms are severe, red-flag, or persistent, kindly suggest consulting a healthcare provider.
5. Keep responses concise, warm, structured with bullet points where helpful.`;

        const contents = [];
        if (Array.isArray(conversationHistory)) {
          conversationHistory.slice(-6).forEach(msg => {
            if (msg.sender && msg.text) {
              contents.push({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
              });
            }
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        let geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 900,
            }
          })
        });

        let data = await geminiRes.json();
        // Fallback to gemini-2.5-flash or gemini-1.5-flash if 3.5 not found
        if (data.error && data.error.code === 404) {
          geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 900 }
            })
          });
          data = await geminiRes.json();
        }

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const generatedText = data.candidates[0].content.parts[0].text;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            hasApiKey: true,
            reply: generatedText,
            sources: 'Maya AI · Powered by Google Gemini Generative Intelligence',
            title: 'Maya AI Companion'
          }));
        } else {
          console.warn('Gemini API response note:', data?.error?.message || 'No candidates returned');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            hasApiKey: true,
            fallback: true,
            error: data?.error?.message || 'Could not generate response'
          }));
        }
      } catch (e) {
        console.error('Chat endpoint exception:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ fallback: true, error: e.message }));
      }
    });
    return;
  }

  let localPath;
  if (parsedUrl === '/') {
    localPath = '/index.html';
  } else if (parsedUrl === '/login' || parsedUrl === '/login-demo') {
    localPath = '/login-demo.html';
  } else if (parsedUrl === '/sms' || parsedUrl === '/sms/' || parsedUrl === '/sms-app') {
    localPath = '/sms.html';
  } else {
    localPath = parsedUrl;
  }

  let filePath = path.join(__dirname, localPath);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA client-side routing
      if (parsedUrl.startsWith('/sms')) {
        filePath = path.join(__dirname, 'sms.html');
      } else {
        filePath = path.join(__dirname, 'index.html');
      }
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
    console.log(`⚡ SMS-BUS Gateway App: http://localhost:${PORT}/sms`);
    console.log(`   SMS Provider API: http://localhost:${PORT}/api/sms/providers`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Environment runtime: http://localhost:${PORT}/env.js`);
  });
}

module.exports = server;
