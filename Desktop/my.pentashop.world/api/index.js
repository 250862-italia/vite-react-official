// API Entry Point per Vercel
// Questo file serve come entry point per Vercel e importa il vero API dal frontend

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importa i dati dal backend
import users from '../backend/data/users.json' assert { type: 'json' };
import tasks from '../backend/data/tasks.json' assert { type: 'json' };
import commissions from '../backend/data/commissions.json' assert { type: 'json' };
import commissionPlans from '../backend/data/commission-plans.json' assert { type: 'json' };
import sales from '../backend/data/sales.json' assert { type: 'json' };
import referrals from '../backend/data/referrals.json' assert { type: 'json' };
import packages from '../backend/data/packages.json' assert { type: 'json' };
import adminRequests from '../backend/data/admin-requests.json' assert { type: 'json' };

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // limite per IP
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Funzioni di utilità
const findUserByUsername = (username) => {
  return users.find(user => user.username === username);
};

const findUserById = (id) => {
  return users.find(user => user.id === parseInt(id));
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Verifica token - Header:', authHeader ? 'Presente' : 'Assente');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT decodificato:', decoded);
    
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
    
    console.log('✅ Utente trovato:', user.username, 'Ruolo:', user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Errore verifica token:', error.message);
    return res.status(401).json({ error: 'Token non valido' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('🔐 Verifica ruolo:', req.user.role);
    console.log('👤 Utente richiesta:', {
      id: req.user.id,
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    });
    console.log('🔍 Ruolo richiesto:', roles, 'Ruolo utente:', req.user.role);
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    console.log('✅ Accesso autorizzato per ruolo:', req.user.role);
    next();
  };
};

// Routes API

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔍 Login attempt:', { username, password: '***' });
    
    console.log('📊 Loading users...');
    console.log('📊 Loaded', users.length, 'users');
    
    const user = findUserByUsername(username);
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    console.log('✅ User found:', user.username, 'Role:', user.role);
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', user.username);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Dashboard route
app.get('/api/dashboard', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Get current user request for:', req.user.username);
    console.log('✅ User found:', req.user.username, 'Role:', req.user.role);
    
    // Trova i task dell'utente
    const userTasks = tasks.filter(task => task.userId === userId);
    const completedTasks = userTasks.filter(task => task.completed);
    const totalTasks = tasks.length;
    
    // Trova le commissioni dell'utente
    const userCommissions = commissions.filter(comm => comm.userId === userId);
    const totalCommissions = userCommissions.reduce((sum, comm) => sum + comm.amount, 0);
    
    // Trova i referral dell'utente
    const userReferrals = referrals.filter(ref => ref.sponsorId === userId);
    
    const dashboardData = {
      user: req.user,
      progress: {
        completedTasks: completedTasks.length,
        totalTasks: totalTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
      },
      stats: {
        totalCommissions: totalCommissions,
        totalReferrals: userReferrals.length,
        activeTasks: userTasks.filter(task => !task.completed).length
      },
      tasks: userTasks,
      commissions: userCommissions,
      referrals: userReferrals
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Tasks routes
app.get('/api/tasks', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userTasks = tasks.filter(task => task.userId === userId);
    
    res.json({
      success: true,
      data: userTasks
    });
  } catch (error) {
    console.error('❌ Tasks error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.get('/api/tasks/:id', verifyToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const task = tasks.find(t => t.id === taskId && t.userId === userId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task non trovato' });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Task error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Commissions routes
app.get('/api/commissions', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    console.log('💰 Richiesta commissioni per utente:', userId);
    
    const userCommissions = commissions.filter(comm => comm.userId === userId);
    console.log('💰', userCommissions.length, 'commissioni trovate per', req.user.username);
    
    res.json({
      success: true,
      data: userCommissions
    });
  } catch (error) {
    console.error('❌ Commissions error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Referrals routes
app.get('/api/referrals', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    console.log('👥 Richiesta referral per utente:', userId);
    
    const userReferrals = referrals.filter(ref => ref.sponsorId === userId);
    console.log('📊', userReferrals.length, 'referral trovati per', req.user.username);
    
    res.json({
      success: true,
      data: userReferrals
    });
  } catch (error) {
    console.error('❌ Referrals error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Admin routes
app.get('/api/admin/users', verifyToken, requireRole(['admin']), (req, res) => {
  try {
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.get('/api/admin/sales', verifyToken, requireRole(['admin']), (req, res) => {
  try {
    console.log('💰 Admin: Richiesta lista vendite');
    console.log('📊 Vendite disponibili:', sales.length);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('❌ Admin sales error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Packages routes
app.get('/api/packages', verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('❌ Packages error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Commission plans routes
app.get('/api/commission-plans', verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: commissionPlans
    });
  } catch (error) {
    console.error('❌ Commission plans error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Catch-all route per il frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Credenziali: testuser / password`);
  console.log(`🎬 Quiz test: GET http://localhost:${PORT}/api/tasks/2/quiz`);
});

export default app; 