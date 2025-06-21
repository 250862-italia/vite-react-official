require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const onboardingRoutes = require('./routes/onboarding');

const app = express();
const PORT = process.env.PORT || 5000;

// Connessione database
connectDB();

// Middleware di sicurezza
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite per IP
  message: {
    error: 'Troppe richieste da questo IP, riprova più tardi.'
  }
});
app.use(limiter);

// Middleware per parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route di default
app.get('/', (req, res) => {
  res.json({
    message: '🌊 Wash The World Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      wallet: '/api/wallet',
      onboarding: '/api/onboarding',
      health: '/health'
    }
  });
});

// Gestione errori 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trovata'
  });
});

// Middleware gestione errori globale
app.use((error, req, res, next) => {
  console.error('❌ Errore server:', error.message);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Errore interno del server' 
      : error.message
  });
});

// Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`�� API Base URL: http://localhost:${PORT}/api`);
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM ricevuto. Chiusura server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT ricevuto. Chiusura server...');
  process.exit(0);
}); 