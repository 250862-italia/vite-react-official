// API Entry Point per Vercel
// Versione semplificata per test deployment

import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'MY.PENTASHOP.WORLD API is running!'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'API is working correctly!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MY.PENTASHOP.WORLD</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { color: #4ade80; font-weight: bold; font-size: 1.2em; }
        .api-link { margin: 20px 0; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .endpoint { background: rgba(255,255,255,0.1); padding: 10px; margin: 10px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌍 MY.PENTASHOP.WORLD</h1>
        <p class="status">✅ Sistema API Online</p>
        <p>Backend funzionante su Vercel</p>
        
        <div class="api-link">
          <h3>🔗 API Endpoints</h3>
          <div class="endpoint">
            <a href="/api/health">Health Check</a> - Status del sistema
          </div>
          <div class="endpoint">
            <a href="/api/test">Test API</a> - Test endpoint
          </div>
        </div>
        
        <div class="api-link">
          <h3>📊 Status</h3>
          <p>✅ API: Funzionante</p>
          <p>✅ Vercel: Deploy attivo</p>
          <p>✅ CORS: Configurato</p>
        </div>
        
        <p><small>Deploy automatico da GitHub - Vercel</small></p>
      </div>
    </body>
    </html>
  `);
});

// Catch-all per altre route
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app; 