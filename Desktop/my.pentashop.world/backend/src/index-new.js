const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

// Import del nuovo sistema CRUD
const { 
  UsersCRUD, 
  TasksCRUD, 
  CommissionPlansCRUD, 
  KYCCRUD, 
  SalesCRUD, 
  CommissionsCRUD, 
  ReferralsCRUD 
} = require('./crud-manager');
const { initializeData } = require('./data-initializer');

// Inizializza i gestori CRUD
const usersCRUD = new UsersCRUD();
const tasksCRUD = new TasksCRUD();
const commissionPlansCRUD = new CommissionPlansCRUD();
const kycCRUD = new KYCCRUD();
const salesCRUD = new SalesCRUD();
const commissionsCRUD = new CommissionsCRUD();
const referralsCRUD = new ReferralsCRUD();

// Inizializza i dati di default
initializeData();

const app = express();

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagine sono permessi'), false);
    }
  }
});

// Configurazione email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@washtw.com',
    pass: 'password123'
  }
});

// Middleware di sicurezza
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://wash-the-world-frontend.vercel.app',
    'https://wash-the-world.vercel.app',
    'https://my-pentashop-world.vercel.app',
    'https://vite-react-official.vercel.app',
    'https://frontend-qp00oawi1-250862-italias-projects.vercel.app'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Troppe richieste da questo IP, riprova più tardi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost';
  }
});
app.use(limiter);

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware per parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'wash-the-world-secret-key-2025';

// Funzione per verificare il token JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token di accesso richiesto'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
}

// Funzione per generare referral code univoco
function generateReferralCode(firstName, lastName) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const specialChars = '!@#$%^&*';
  
  const nameBase = `${firstName.toUpperCase().substring(0, 2)}${lastName.toUpperCase().substring(0, 2)}`;
  const timestamp = Date.now().toString().slice(-6);
  
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const specialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  const nameSum = (firstName + lastName).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const checksum = (nameSum % 36).toString(36).toUpperCase();
  
  return `${nameBase}${timestamp}-${randomStr}-${specialChar}-${checksum}`;
}

// Funzione per verificare se un referral code è univoco
function isReferralCodeUnique(code, excludeUserId = null) {
  const users = usersCRUD.readAll();
  return !users.find(u => u.referralCode === code && u.id !== excludeUserId);
}

// Funzione per generare un referral code univoco
function generateUniqueReferralCode(user) {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateReferralCode(user.firstName, user.lastName);
    attempts++;
  } while (!isReferralCodeUnique(code, user.id) && attempts < maxAttempts);
  
  return code;
}

// ==================== API ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server Wash The World attivo',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wash The World API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      tasks: '/api/tasks/*',
      admin: '/api/admin/*',
      mlm: '/api/mlm/*',
      kyc: '/api/kyc/*'
    }
  });
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// Login
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', { username: req.body.username, password: '***' });
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username e password sono obbligatori'
    });
  }
  
  const users = usersCRUD.readAll();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Credenziali non valide'
    });
  }
  
  // Aggiorna lastLogin
  usersCRUD.update(user.id, { lastLogin: new Date().toISOString() });
  
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    message: 'Login effettuato con successo',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        level: user.level,
        points: user.points,
        tokens: user.tokens,
        referralCode: user.referralCode,
        totalSales: user.totalSales,
        totalCommissions: user.totalCommissions,
        wallet: user.wallet,
        badges: user.badges,
        completedTasks: user.completedTasks,
        isActive: user.isActive,
        onboardingLevel: user.onboardingLevel,
        isOnboardingComplete: user.isOnboardingComplete
      },
      token
    }
  });
});

// Registrazione
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registration attempt:', { username: req.body.username, email: req.body.email });
  
  const {
    username,
    email,
    firstName,
    lastName,
    password,
    sponsorCode
  } = req.body;
  
  // Validazione campi obbligatori
  if (!username || !email || !firstName || !lastName || !password) {
    return res.status(400).json({
      success: false,
      error: 'Tutti i campi sono obbligatori'
    });
  }
  
  const users = usersCRUD.readAll();
  
  // Verifica username univoco
  if (users.find(u => u.username === username)) {
    return res.status(400).json({
      success: false,
      error: 'Username già esistente'
    });
  }
  
  // Verifica email univoca
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: 'Email già esistente'
    });
  }
  
  // Trova sponsor se fornito
  let sponsorId = null;
  if (sponsorCode) {
    const sponsor = users.find(u => u.referralCode === sponsorCode);
    if (sponsor) {
      sponsorId = sponsor.id;
    }
  }
  
  // Genera referral code univoco
  const referralCode = generateUniqueReferralCode({ firstName, lastName });
  
  // Crea nuovo utente
  const newUser = {
    username,
    email,
    firstName,
    lastName,
    password,
    sponsorId,
    referralCode,
    role: 'entry_ambassador',
    level: 1,
    points: 0,
    tokens: 0,
    experience: 0,
    onboardingLevel: 1,
    isActive: true,
    isOnboardingComplete: false,
    completedTasks: [],
    badges: [],
    wallet: {
      balance: 0,
      transactions: []
    },
    totalSales: 0,
    totalCommissions: 0
  };
  
  const result = usersCRUD.create(newUser);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }
  
  // Crea referral se c'è uno sponsor
  if (sponsorId) {
    referralsCRUD.create({
      referrerId: sponsorId,
      referredId: result.data.id,
      status: 'active'
    });
  }
  
  // Genera token
  const token = jwt.sign(
    { 
      id: result.data.id, 
      username: result.data.username, 
      role: result.data.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  res.status(201).json({
    success: true,
    message: 'Registrazione effettuata con successo',
    data: {
      user: {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        role: result.data.role,
        level: result.data.level,
        points: result.data.points,
        tokens: result.data.tokens,
        referralCode: result.data.referralCode,
        totalSales: result.data.totalSales,
        totalCommissions: result.data.totalCommissions,
        wallet: result.data.wallet,
        badges: result.data.badges,
        completedTasks: result.data.completedTasks,
        isActive: result.data.isActive,
        onboardingLevel: result.data.onboardingLevel,
        isOnboardingComplete: result.data.isOnboardingComplete
      },
      token
    }
  });
});

// Verifica token
app.get('/api/auth/verify-token', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token valido',
    data: {
      user: req.user
    }
  });
});

// ==================== USERS ENDPOINTS ====================

// GET - Lista tutti gli utenti (Admin)
app.get('/api/admin/users', verifyToken, (req, res) => {
  console.log('👑 Admin users list request');
  
  const users = usersCRUD.readAll();
  
  const userList = users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    level: u.level,
    points: u.points,
    tokens: u.tokens,
    totalSales: u.totalSales,
    totalCommissions: u.totalCommissions,
    isActive: u.isActive,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  }));

  res.json({
    success: true,
    data: userList
  });
});

// GET - Dettagli utente (Admin)
app.get('/api/admin/users/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const result = usersCRUD.readById(userId);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }

  res.json({
    success: true,
    data: {
      ...result.data,
      password: undefined
    }
  });
});

// PUT - Aggiorna utente (Admin)
app.put('/api/admin/users/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const updateData = req.body;
  
  const result = usersCRUD.update(userId, updateData);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Utente aggiornato con successo',
    data: {
      ...result.data,
      password: undefined
    }
  });
});

// POST - Crea nuovo utente (Admin)
app.post('/api/admin/users', verifyToken, (req, res) => {
  console.log('👑 Admin create user request');
  
  const result = usersCRUD.create(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  res.status(201).json({
    success: true,
    message: 'Utente creato con successo',
    data: {
      ...result.data,
      password: undefined
    }
  });
});

// DELETE - Elimina utente (Admin)
app.delete('/api/admin/users/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const result = usersCRUD.delete(userId);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }

  res.json({
    success: true,
    message: 'Utente eliminato con successo',
    data: result.data
  });
});

// ==================== TASKS ENDPOINTS ====================

// GET - Lista tutti i task (Admin)
app.get('/api/admin/tasks', verifyToken, (req, res) => {
  console.log('📋 Admin tasks list request');
  
  const tasks = tasksCRUD.readAll();
  
  res.json({
    success: true,
    data: tasks
  });
});

// GET - Dettagli task (Admin)
app.get('/api/admin/tasks/:id', verifyToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = tasksCRUD.readById(taskId);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: 'Task non trovato'
    });
  }
  
  res.json({
    success: true,
    data: result.data
  });
});

// POST - Crea nuovo task (Admin)
app.post('/api/admin/tasks', verifyToken, (req, res) => {
  console.log('📋 Admin create task request');
  
  const result = tasksCRUD.create(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Task creato con successo',
    data: result.data
  });
});

// PUT - Aggiorna task (Admin)
app.put('/api/admin/tasks/:id', verifyToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = tasksCRUD.update(taskId, req.body);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Task aggiornato con successo',
    data: result.data
  });
});

// DELETE - Elimina task (Admin)
app.delete('/api/admin/tasks/:id', verifyToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = tasksCRUD.delete(taskId);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Task eliminato con successo',
    data: result.data
  });
});

// ==================== COMMISSION PLANS ENDPOINTS ====================

// GET - Lista tutti i piani commissioni (Admin)
app.get('/api/admin/commission-plans', verifyToken, (req, res) => {
  console.log('📋 Admin: Richiesta lista piani commissioni');
  
  const plans = commissionPlansCRUD.readAll();
  
  res.json({
    success: true,
    data: plans
  });
});

// GET - Dettagli piano commissioni (Admin)
app.get('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  const planId = parseInt(req.params.id);
  const result = commissionPlansCRUD.readById(planId);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: 'Piano non trovato'
    });
  }
  
  res.json({
    success: true,
    data: result.data
  });
});

// POST - Crea nuovo piano commissioni (Admin)
app.post('/api/admin/commission-plans', verifyToken, (req, res) => {
  console.log('🆕 Admin: Creazione nuovo piano commissioni');
  
  const result = commissionPlansCRUD.create(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Piano commissioni creato con successo',
    data: result.data
  });
});

// PUT - Aggiorna piano commissioni (Admin)
app.put('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  const planId = parseInt(req.params.id);
  const result = commissionPlansCRUD.update(planId, req.body);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Piano commissioni aggiornato con successo',
    data: result.data
  });
});

// DELETE - Elimina piano commissioni (Admin)
app.delete('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  const planId = parseInt(req.params.id);
  const result = commissionPlansCRUD.delete(planId);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Piano commissioni eliminato con successo',
    data: result.data
  });
});

// ==================== KYC ENDPOINTS ====================

// POST - Invia richiesta KYC
app.post('/api/kyc/submit', verifyToken, upload.fields([
  { name: 'identityDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), (req, res) => {
  console.log('📋 KYC submission request');
  
  const kycData = {
    userId: req.user.id,
    ...req.body,
    files: req.files
  };
  
  const result = kycCRUD.create(kycData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Richiesta KYC inviata con successo',
    data: result.data
  });
});

// GET - Status KYC
app.get('/api/kyc/status', verifyToken, (req, res) => {
  const result = kycCRUD.readByUserId(req.user.id);
  
  if (!result.success) {
    return res.json({
      success: true,
      data: {
        status: 'not_submitted',
        message: 'Nessuna richiesta KYC trovata'
      }
    });
  }
  
  res.json({
    success: true,
    data: result.data
  });
});

// GET - Lista richieste KYC (Admin)
app.get('/api/admin/kyc/requests', verifyToken, (req, res) => {
  const kycRequests = kycCRUD.readAll();
  
  res.json({
    success: true,
    data: kycRequests
  });
});

// PUT - Aggiorna status KYC (Admin)
app.put('/api/admin/kyc/:kycId/status', verifyToken, async (req, res) => {
  const kycId = parseInt(req.params.kycId);
  const { status, reason } = req.body;
  
  const result = kycCRUD.update(kycId, { status, reason });
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Status KYC aggiornato con successo',
    data: result.data
  });
});

// ==================== SALES ENDPOINTS ====================

// POST - Crea nuova vendita
app.post('/api/sales', verifyToken, (req, res) => {
  const saleData = {
    userId: req.user.id,
    ...req.body
  };
  
  const result = salesCRUD.create(saleData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Vendita registrata con successo',
    data: result.data
  });
});

// GET - Lista vendite utente
app.get('/api/sales/user/:userId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  const sales = salesCRUD.readByUserId(userId);
  
  res.json({
    success: true,
    data: sales
  });
});

// ==================== COMMISSIONS ENDPOINTS ====================

// POST - Crea nuova commissione
app.post('/api/commissions', verifyToken, (req, res) => {
  const commissionData = {
    userId: req.user.id,
    ...req.body
  };
  
  const result = commissionsCRUD.create(commissionData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Commissione registrata con successo',
    data: result.data
  });
});

// GET - Lista commissioni utente
app.get('/api/commissions/user/:userId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  const commissions = commissionsCRUD.readByUserId(userId);
  
  res.json({
    success: true,
    data: commissions
  });
});

// ==================== REFERRALS ENDPOINTS ====================

// POST - Crea nuovo referral
app.post('/api/referrals', verifyToken, (req, res) => {
  const referralData = {
    ...req.body
  };
  
  const result = referralsCRUD.create(referralData);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Referral registrato con successo',
    data: result.data
  });
});

// GET - Lista referral per referrer
app.get('/api/referrals/referrer/:referrerId', verifyToken, (req, res) => {
  const referrerId = parseInt(req.params.referrerId);
  const referrals = referralsCRUD.readByReferrerId(referrerId);
  
  res.json({
    success: true,
    data: referrals
  });
});

// GET - Lista referral per referred
app.get('/api/referrals/referred/:referredId', verifyToken, (req, res) => {
  const referredId = parseInt(req.params.referredId);
  const referrals = referralsCRUD.readByReferredId(referredId);
  
  res.json({
    success: true,
    data: referrals
  });
});

// ==================== DASHBOARD ENDPOINTS ====================

// GET - Dashboard utente
app.get('/api/dashboard/:userId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  const userResult = usersCRUD.readById(userId);
  
  if (!userResult.success) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  const user = userResult.data;
  const tasks = tasksCRUD.readAll();
  const plans = commissionPlansCRUD.readAll();
  const userSales = salesCRUD.readByUserId(userId);
  const userCommissions = commissionsCRUD.readByUserId(userId);
  const userReferrals = referralsCRUD.readByReferrerId(userId);
  
  // Calcola statistiche
  const totalSales = userSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCommissions = userCommissions.reduce((sum, comm) => sum + comm.amount, 0);
  // Assicurati che completedTasks sia un array
  if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
    user.completedTasks = [];
  }
  
  const completedTasksCount = user.completedTasks.length;
  const availableTasks = tasks.filter(task => !user.completedTasks.includes(task.id));
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        level: user.level,
        points: user.points,
        tokens: user.tokens,
        referralCode: user.referralCode,
        wallet: user.wallet,
        badges: user.badges,
        completedTasks: user.completedTasks,
        onboardingLevel: user.onboardingLevel,
        isOnboardingComplete: user.isOnboardingComplete
      },
      stats: {
        totalSales,
        totalCommissions,
        completedTasksCount,
        availableTasksCount: availableTasks.length,
        referralsCount: userReferrals.length
      },
      tasks: availableTasks,
      plans,
      recentSales: userSales.slice(-5),
      recentCommissions: userCommissions.slice(-5)
    }
  });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('✅ Server avviato su porta', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('🔐 Login test: POST http://localhost:' + PORT + '/api/auth/login');
  console.log('📋 Credenziali: testuser / password');
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