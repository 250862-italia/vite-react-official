const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// WebSocket per notifiche in tempo reale
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

// Store per le connessioni attive
const activeConnections = new Map();

const app = express();

// JWT Secret - In produzione usare variabile d'ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'wash-world-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://*.vercel.app',
    'https://*.netlify.app',
    'https://*.herokuapp.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurazione Multer per upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagine sono permessi'), false);
    }
  }
});

// Rate limiting - TEMPORANEAMENTE AUMENTATO per sviluppo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Temporarily increased to 1000 requests per windowMs
  message: { error: 'Troppe richieste da questo IP, riprova più tardi.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint per Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Funzioni di utilità
function loadUsersFromFile() {
  try {
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
      const data = fs.readFileSync(usersPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Errore caricamento utenti:', error);
  }
  return [];
}

function loadTasksFromFile() {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    if (fs.existsSync(tasksPath)) {
      const data = fs.readFileSync(tasksPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Errore caricamento task:', error);
  }
  return [];
}

function saveUsersToFile(users) {
  try {
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio utenti:', error);
    return false;
  }
}

function saveTasksToFile(tasks) {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio task:', error);
    return false;
  }
}

// 🔥 VERIFICA TOKEN ROBUSTA
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  console.log('🔐 Verifica token - Header:', authHeader ? 'Presente' : 'Mancante');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Header Authorization mancante o non valido');
    return res.status(401).json({
      success: false,
      error: 'Token di accesso richiesto'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token || token.trim() === '') {
    console.log('❌ Token mancante o vuoto');
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
  
  try {
    // Verifica JWT reale
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT decodificato:', decoded);
    
    // Verifica che l'utente esista ancora
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      console.log('❌ Utente non trovato con ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    console.log('✅ Utente trovato:', user.username, 'Ruolo:', user.role);
    
    // Verifica che l'utente sia attivo
    if (!user.isActive) {
      console.log('❌ Utente non attivo:', user.username);
      return res.status(401).json({
        success: false,
        error: 'Account disattivato'
      });
    }
    
    req.user = {
      id: user.id,
      userId: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    console.log('✅ Token verificato per utente:', req.user.username, 'Ruolo:', req.user.role);
    next();
  } catch (error) {
    console.error('❌ Errore verifica token:', error);
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
}

// 🔥 MIDDLEWARE PER RUOLI
function requireRole(role) {
  return (req, res, next) => {
    console.log('🔐 Verifica ruolo:', role);
    console.log('👤 Utente richiesta:', req.user);
    
    if (!req.user) {
      console.log('❌ Nessun utente nella richiesta');
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }
    
    console.log('🔍 Ruolo richiesto:', role, 'Ruolo utente:', req.user.role);
    
    if (req.user.role !== role) {
      console.log('❌ Accesso negato - Ruolo insufficiente:', req.user.role, 'vs', role);
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Permessi insufficienti.'
      });
    }
    
    console.log('✅ Accesso autorizzato per ruolo:', role);
    next();
  };
}

// 🔥 VALIDAZIONE INPUT
function validateInput(schema) {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi'
      });
    }
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// 🔥 API - LOGIN CON BCRYPT
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔍 Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Username e password sono richiesti'
      });
    }
    
    console.log('📊 Loading users...');
    const users = loadUsersFromFile();
    console.log(`📊 Loaded ${users.length} users`);
    
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }
    
    console.log('✅ User found:', user.username, 'Role:', user.role);
    
    // 🔥 VERIFICA PASSWORD CON BCRYPT
    console.log('🔐 Verifying password...');
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password verification result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', username);
        return res.status(401).json({
          success: false,
          error: 'Credenziali non valide'
        });
      }
    } catch (bcryptError) {
      console.error('❌ Bcrypt error:', bcryptError);
      return res.status(500).json({
        success: false,
        error: 'Errore verifica password'
      });
    }
    
    // Verifica che l'utente sia attivo
    if (!user.isActive) {
      console.log('❌ User account disabled:', username);
      return res.status(401).json({
        success: false,
        error: 'Account disattivato'
      });
    }
    
    console.log('✅ User is active, generating JWT...');
    
    // 🔥 GENERA JWT REALE
    try {
      const token = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      console.log('✅ JWT generated successfully');
      
      // Aggiorna ultimo login
      user.lastLogin = new Date().toISOString();
      saveUsersToFile(users);
      
      console.log(`✅ Login successful: ${user.username} (${user.role})`);
      
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        }
      });
    } catch (jwtError) {
      console.error('❌ JWT error:', jwtError);
      return res.status(500).json({
        success: false,
        error: 'Errore generazione token'
      });
    }
  } catch (error) {
    console.error('❌ Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - RECUPERO PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email è richiesta'
      });
    }
    
    console.log('📧 Password recovery request for email:', email);
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({
        success: false,
        error: 'Nessun utente trovato con questa email'
      });
    }
    
    // Genera token di reset temporaneo (24 ore)
    const resetToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        type: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Salva il token di reset nell'utente
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    saveUsersToFile(users);
    
    console.log('✅ Password reset token generated for user:', user.username);
    
    // In produzione, qui invieresti una email reale
    // Per ora simuliamo l'invio
    console.log('📧 Simulazione invio email di reset password a:', email);
    console.log('🔗 Link di reset (simulato):', `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${resetToken}`);
    
    res.json({
      success: true,
      message: 'Email di recupero password inviata. Controlla la tua casella email.'
    });
  } catch (error) {
    console.error('❌ Errore recupero password:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - RESET PASSWORD CON TOKEN
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token e nuova password sono richiesti'
      });
    }
    
    // Verifica il token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        success: false,
        error: 'Token di reset non valido o scaduto'
      });
    }
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Token non valido per reset password'
      });
    }
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user || user.passwordResetToken !== token) {
      return res.status(400).json({
        success: false,
        error: 'Token di reset non valido'
      });
    }
    
    // Verifica che il token non sia scaduto
    if (new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({
        success: false,
        error: 'Token di reset scaduto'
      });
    }
    
    // Hash della nuova password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Aggiorna password e rimuovi token di reset
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedAt = new Date().toISOString();
    
    saveUsersToFile(users);
    
    console.log('✅ Password reset successful for user:', user.username);
    
    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  } catch (error) {
    console.error('❌ Errore reset password:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - GET CURRENT USER
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Get current user request for:', req.user.username);
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      console.log('❌ User not found in database:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    console.log('✅ User found:', user.username, 'Role:', user.role);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        referralCode: user.referralCode,
        sponsorCode: user.sponsorCode,
        sponsorId: user.sponsorId,
        level: user.level,
        points: user.points,
        experience: user.experience,
        totalSales: user.totalSales,
        totalCommissions: user.totalCommissions,
        wallet: user.wallet,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('❌ Errore get current user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - REGISTRAZIONE CON BCRYPT E VALIDAZIONE CODICE REFERRAL
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, sponsorCode } = req.body;
    
    if (!username || !email || !password || !firstName || !lastName || !sponsorCode) {
      return res.status(400).json({
        success: false,
        error: 'Tutti i campi sono richiesti, incluso il codice referral'
      });
    }
    
    // Validazione codice referral obbligatorio
    if (!sponsorCode || sponsorCode.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Il codice referral di un ambassador iscritto è obbligatorio per la registrazione'
      });
    }
    
    const users = loadUsersFromFile();
    
    // Verifica username unico
    if (users.find(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        error: 'Username già in uso'
      });
    }
    
    // Verifica email unica
    if (users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: 'Email già registrata'
      });
    }
    
    // Validazione codice referral - deve esistere un ambassador con questo codice
    const sponsorUser = users.find(u => u.referralCode === sponsorCode);
    if (!sponsorUser) {
      return res.status(400).json({
        success: false,
        error: 'Codice referral non valido. È necessario il codice di un ambassador già iscritto'
      });
    }
    
    // Verifica che lo sponsor sia un ambassador attivo
    if (sponsorUser.role !== 'ambassador' && sponsorUser.role !== 'entry_ambassador' && sponsorUser.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Il codice referral deve appartenere a un ambassador iscritto'
      });
    }
    
    // 🔥 HASH PASSWORD CON BCRYPT
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword, // 🔥 PASSWORD HASHATA
      firstName,
      lastName,
      sponsorId: sponsorUser.id, // ID dello sponsor
      sponsorCode: sponsorCode, // Codice referral dello sponsor
      role: 'guest',
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      onboardingLevel: 1,
      points: 0,
      tokens: 0,
      commissionRate: 0.05,
      referralCode: `${username.toUpperCase()}${Math.random().toString(36).substr(2, 9)}`,
      totalSales: 0,
      totalCommissions: 0,
      wallet: {
        balance: 0,
        transactions: []
      },
      badges: [],
      completedTasks: [],
      purchasedPackages: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasSeenWelcome: false,
      subscriptionActive: false,
      kycStatus: 'not_submitted',
      contractStatus: 'not_signed',
      state: 'pending_approval',
      adminApproved: false,
      canPurchasePackages: false
    };
    
    users.push(newUser);
    saveUsersToFile(users);
    
    // 🔥 GENERA JWT REALE
    const token = jwt.sign(
      { 
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    console.log(`✅ Registration successful: ${newUser.username}`);
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore registrazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - PROMOZIONE GUEST AD AMBASSADOR
app.post('/api/auth/promote-guest', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID utente richiesto'
      });
    }
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Solo gli utenti guest possono essere promossi'
      });
    }
    
    // Promuovi da guest ad ambassador
    user.role = 'ambassador';
    user.updatedAt = new Date().toISOString();
    
    // Aggiorna il file degli utenti
    saveUsersToFile(users);
    
    console.log(`✅ Guest promosso ad ambassador: ${user.username}`);
    
    res.json({
      success: true,
      data: {
        message: 'Utente promosso con successo ad ambassador',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore promozione guest:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Dashboard
app.get('/api/dashboard', verifyToken, requireGuestApproval, (req, res) => {
  try {
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const tasks = loadTasksFromFile();
    const availableTasks = tasks.filter(task => 
      task.isActive && !user.completedTasks?.includes(task.id)
    );
    
    const completedTasks = tasks.filter(task => 
      user.completedTasks?.includes(task.id)
    );
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          level: user.level,
          experience: user.experience,
          experienceToNextLevel: user.experienceToNextLevel,
          onboardingLevel: user.onboardingLevel,
          points: user.points,
          tokens: user.tokens,
          role: user.role,
          referralCode: user.referralCode,
          commissionRate: user.commissionRate,
          totalSales: user.totalSales,
          totalCommissions: user.totalCommissions
        },
        progress: {
          percentage: user.completedTasks ? Math.round((user.completedTasks.length / tasks.length) * 100) : 0,
          completedTasks: user.completedTasks?.length || 0,
          totalTasks: tasks.length,
          currentTask: availableTasks[0] || null
        },
        availableTasks,
        completedTasks,
        badges: user.badges || [],
        availableBadges: [
          {
            id: 1,
            name: 'first_task',
            title: 'Primo Task',
            description: 'Completa il tuo primo task'
          },
          {
            id: 2,
            name: 'onboarding_complete',
            title: 'Onboarding Completo',
            description: 'Completa tutti i task di onboarding'
          },
          {
            id: 3,
            name: 'ambassador',
            title: 'Ambassador',
            description: 'Diventa un ambassador'
          },
          {
            id: 4,
            name: 'top_performer',
            title: 'Top Performer',
            description: 'Raggiungi risultati eccellenti'
          }
        ],
        isOnboardingComplete: user.isOnboardingComplete || false
      }
    });
  } catch (error) {
    console.error('❌ Errore dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni quiz per task
app.get('/api/tasks/:taskId/quiz', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è un quiz'
      });
    }
    
    const quizData = {
      id: task.id,
      title: task.title,
      description: task.description,
      questions: task.content.quizQuestions || [],
      rewards: task.rewards
    };
    
    res.json({
      success: true,
      data: quizData
    });
  } catch (error) {
    console.error('❌ Errore caricamento quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Valida risposte quiz
app.post('/api/tasks/:taskId/quiz/validate', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const { answers } = req.body;
    
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è un quiz'
      });
    }
    
    const questions = task.content.quizQuestions || [];
    let correctAnswers = 0;
    
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70; // 70% per passare
    
    if (passed) {
      // Aggiorna l'utente
      const users = loadUsersFromFile();
      const userIndex = users.findIndex(u => u.id === req.user.id);
      
      if (userIndex !== -1) {
        const user = users[userIndex];
        
        // Aggiungi task completato
        if (!user.completedTasks) {
          user.completedTasks = [];
        }
        if (!user.completedTasks.includes(task.id)) {
          user.completedTasks.push(task.id);
        }
        
        // Aggiungi ricompense
        if (task.rewards) {
          user.points = (user.points || 0) + (task.rewards.points || 0);
          user.tokens = (user.tokens || 0) + (task.rewards.tokens || 0);
          user.experience = (user.experience || 0) + (task.rewards.experience || 0);
        }
        
        user.updatedAt = new Date().toISOString();
        saveUsersToFile(users);
      }
    }
    
    res.json({
      success: true,
      data: {
        score,
        passed,
        correctAnswers,
        totalQuestions: questions.length,
        rewards: passed ? task.rewards : null
      }
    });
  } catch (error) {
    console.error('❌ Errore validazione quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni video per task
app.get('/api/tasks/:taskId/video', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'video') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è un video'
      });
    }
    
    const videoData = {
      id: task.id,
      title: task.title,
      description: task.description,
      videoUrl: task.videoUrl || task.content?.videoUrl || '',
      rewards: task.rewards
    };
    
    res.json({
      success: true,
      data: videoData
    });
  } catch (error) {
    console.error('❌ Errore caricamento video:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni documento per task
app.get('/api/tasks/:taskId/document', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'document') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è un documento'
      });
    }
    
    const documentData = {
      id: task.id,
      title: task.title,
      description: task.description,
      content: task.content.documentContent || '',
      rewards: task.rewards
    };
    
    res.json({
      success: true,
      data: documentData
    });
  } catch (error) {
    console.error('❌ Errore caricamento documento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni survey per task
app.get('/api/tasks/:taskId/survey', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'survey') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è una survey'
      });
    }
    
    // Formatta le domande per il frontend
    const formattedQuestions = (task.content.surveyQuestions || []).map((question, index) => ({
      id: index + 1,
      question: question,
      type: 'text', // Default a text per le domande esistenti
      options: []
    }));

    const surveyData = {
      id: task.id,
      title: task.title,
      description: task.description,
      questions: formattedQuestions,
      rewards: task.rewards
    };
    
    res.json({
      success: true,
      data: surveyData
    });
  } catch (error) {
    console.error('❌ Errore caricamento survey:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Invia survey
app.post('/api/tasks/:taskId/survey/submit', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const { answers } = req.body;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'survey') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è una survey'
      });
    }
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const user = users[userIndex];
    
    // Aggiungi task completato
    if (!user.completedTasks) {
      user.completedTasks = [];
    }
    if (!user.completedTasks.includes(task.id)) {
      user.completedTasks.push(task.id);
    }
    
    // Aggiungi ricompense
    if (task.rewards) {
      user.points = (user.points || 0) + (task.rewards.points || 0);
      user.tokens = (user.tokens || 0) + (task.rewards.tokens || 0);
      user.experience = (user.experience || 0) + (task.rewards.experience || 0);
    }
    
    // Salva le risposte della survey (opzionale)
    if (!user.surveyResponses) {
      user.surveyResponses = {};
    }
    user.surveyResponses[task.id] = {
      answers,
      submittedAt: new Date().toISOString()
    };
    
    saveUsersToFile(users);
    
    res.json({
      success: true,
      data: {
        completed: true,
        rewards: task.rewards,
        message: 'Survey completata con successo!'
      }
    });
  } catch (error) {
    console.error('❌ Errore invio survey:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Completa task
app.post('/api/tasks/:taskId/complete', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = loadTasksFromFile();
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const user = users[userIndex];
    
    // Aggiungi task completato
    if (!user.completedTasks) {
      user.completedTasks = [];
    }
    if (!user.completedTasks.includes(task.id)) {
      user.completedTasks.push(task.id);
    }
    
    // Aggiungi ricompense
    if (task.rewards) {
      user.points = (user.points || 0) + (task.rewards.points || 0);
      user.tokens = (user.tokens || 0) + (task.rewards.tokens || 0);
      user.experience = (user.experience || 0) + (task.rewards.experience || 0);
    }
    
    // Controlla se l'utente ha completato tutti i task
    const allTasks = loadTasksFromFile();
    const activeTasks = allTasks.filter(t => t.isActive);
    const isAllTasksCompleted = activeTasks.every(t => user.completedTasks?.includes(t.id));
    
    // Se ha completato tutti i task, aggiungi il badge speciale
    let specialBadge = null;
    if (isAllTasksCompleted && !user.badges?.includes('ambassador_complete')) {
      if (!user.badges) user.badges = [];
      user.badges.push('ambassador_complete');
      specialBadge = {
        name: 'ambassador_complete',
        title: '🏆 Ambasciatore MY.PENTASHOP.WORLD',
        description: 'Hai completato tutti i task e sei diventato un Ambasciatore ufficiale di MY.PENTASHOP.WORLD!',
        icon: '🏆',
        color: 'gold'
      };
    }
    
    user.updatedAt = new Date().toISOString();
    saveUsersToFile(users);
    
    res.json({
      success: true,
      data: {
        message: isAllTasksCompleted ? '🎉 Congratulazioni! Hai completato tutti i task e sei diventato un Ambasciatore ufficiale di MY.PENTASHOP.WORLD!' : 'Task completato con successo',
        rewards: task.rewards,
        specialBadge: specialBadge,
        isAllTasksCompleted: isAllTasksCompleted,
        updatedUser: {
          points: user.points,
          tokens: user.tokens,
          experience: user.experience,
          completedTasks: user.completedTasks,
          badges: user.badges
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore completamento task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni profilo utente
app.get('/api/profile', verifyToken, (req, res) => {
  try {
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const tasks = loadTasksFromFile();
    const completedTasks = tasks.filter(task => user.completedTasks?.includes(task.id));
    const availableTasks = tasks.filter(task => 
      task.isActive && !user.completedTasks?.includes(task.id)
    );
    
    const profileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      country: user.country,
      city: user.city,
      userType: user.userType || 'private',
      fiscalCode: user.fiscalCode || '',
      vatNumber: user.vatNumber || '',
      iban: user.iban || '',
      role: user.role,
      level: user.level,
      points: user.points || 0,
      tokens: user.tokens || 0,
      experience: user.experience || 0,
      experienceToNextLevel: user.experienceToNextLevel || 100,
      onboardingLevel: user.onboardingLevel || 1,
      isActive: user.isActive,
      isOnboardingComplete: user.isOnboardingComplete || false,
      referralCode: user.referralCode,
      sponsorCode: user.sponsorCode,
      sponsorId: user.sponsorId,
      commissionRate: user.commissionRate || 0.05,
      totalSales: user.totalSales || 0,
      totalCommissions: user.totalCommissions || 0,
      wallet: user.wallet || { balance: 0, transactions: [] },
      badges: user.badges || [],
      completedTasks: completedTasks,
      availableTasks: availableTasks,
      progress: {
        percentage: user.completedTasks ? Math.round((user.completedTasks.length / tasks.length) * 100) : 0,
        completedTasks: user.completedTasks?.length || 0,
        totalTasks: tasks.length,
        currentTask: availableTasks[0] || null
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    };
    
    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('❌ Errore caricamento profilo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna profilo utente
app.put('/api/profile', verifyToken, (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      userType,
      fiscalCode,
      vatNumber,
      iban
    } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const user = users[userIndex];
    
    // Aggiorna i campi se forniti
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (country) user.country = country;
    if (city) user.city = city;
    if (userType) user.userType = userType;
    if (fiscalCode !== undefined) user.fiscalCode = fiscalCode;
    if (vatNumber !== undefined) user.vatNumber = vatNumber;
    if (iban) user.iban = iban;
    
    user.updatedAt = new Date().toISOString();
    saveUsersToFile(users);
    
    res.json({
      success: true,
      data: {
        message: 'Profilo aggiornato con successo',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          city: user.city,
          userType: user.userType,
          fiscalCode: user.fiscalCode,
          vatNumber: user.vatNumber,
          iban: user.iban,
          role: user.role,
          level: user.level,
          points: user.points,
          tokens: user.tokens,
          experience: user.experience,
          referralCode: user.referralCode,
          commissionRate: user.commissionRate,
          totalSales: user.totalSales,
          totalCommissions: user.totalCommissions
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni statistiche utente
app.get('/api/profile/stats', verifyToken, (req, res) => {
  try {
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const tasks = loadTasksFromFile();
    const completedTasks = user.completedTasks?.length || 0;
    const totalTasks = tasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const stats = {
      totalPoints: user.points || 0,
      totalTokens: user.tokens || 0,
      totalExperience: user.experience || 0,
      completedTasks: completedTasks,
      totalTasks: totalTasks,
      progressPercentage: progressPercentage,
      level: user.level || 1,
      role: user.role || 'entry_ambassador',
      isActive: user.isActive || false,
      totalSales: user.totalSales || 0,
      totalCommissions: user.totalCommissions || 0,
      commissionRate: user.commissionRate || 0.05,
      referralCode: user.referralCode,
      walletBalance: user.wallet?.balance || 0,
      badgesCount: user.badges?.length || 0,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Errore caricamento statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni wallet utente
app.get('/api/profile/wallet', verifyToken, (req, res) => {
  try {
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const walletData = {
      balance: user.wallet?.balance || 0,
      transactions: user.wallet?.transactions || [],
      totalEarnings: user.totalCommissions || 0,
      pendingAmount: 0, // Calcolato in base alle commissioni pendenti
      lastTransaction: user.wallet?.transactions?.[user.wallet.transactions.length - 1] || null
    };
    
    res.json({
      success: true,
      data: walletData
    });
  } catch (error) {
    console.error('❌ Errore caricamento wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni badge utente
app.get('/api/profile/badges', verifyToken, (req, res) => {
  try {
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const availableBadges = [
      {
        id: 1,
        name: 'first_task',
        title: 'Primo Task',
        description: 'Completa il tuo primo task',
        icon: '🎯',
        unlocked: user.completedTasks?.length > 0
      },
      {
        id: 2,
        name: 'onboarding_complete',
        title: 'Onboarding Completo',
        description: 'Completa tutti i task di onboarding',
        icon: '🎓',
        unlocked: user.isOnboardingComplete
      },
      {
        id: 3,
        name: 'ambassador',
        title: 'Ambassador',
        description: 'Diventa un ambassador',
        icon: '👑',
        unlocked: user.role === 'ambassador'
      },
      {
        id: 4,
        name: 'top_performer',
        title: 'Top Performer',
        description: 'Raggiungi risultati eccellenti',
        icon: '🏆',
        unlocked: user.points >= 100
      },
      {
        id: 5,
        name: 'sales_master',
        title: 'Sales Master',
        description: 'Completa 10 vendite',
        icon: '💰',
        unlocked: user.totalSales >= 10
      }
    ];
    
    const userBadges = user.badges || [];
    
    res.json({
      success: true,
      data: {
        userBadges: userBadges,
        availableBadges: availableBadges,
        totalBadges: availableBadges.filter(badge => badge.unlocked).length,
        totalAvailable: availableBadges.length
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento badge:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ==================== KYC CRUD SYSTEM ====================

// Funzione per caricare le richieste KYC
function loadKYCSubmissions() {
  try {
    const kycPath = path.join(__dirname, '../data/kyc-submissions.json');
    const kycData = fs.readFileSync(kycPath, 'utf8');
    return JSON.parse(kycData);
  } catch (error) {
    console.error('❌ Errore caricamento KYC:', error);
    return [];
  }
}

// Funzione per salvare le richieste KYC
function saveKYCSubmissions(kycData) {
  try {
    const kycPath = path.join(__dirname, '../data/kyc-submissions.json');
    fs.writeFileSync(kycPath, JSON.stringify(kycData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio KYC:', error);
    return false;
  }
}

// API - Ottieni tutte le richieste KYC (Admin)
app.get('/api/admin/kyc', verifyToken, requireRole('admin'), (req, res) => {
  try {
    console.log('📋 Admin: Richiesta lista KYC da', req.user.username);
    console.log('🔍 Token presente:', !!req.headers.authorization);
    console.log('👤 Utente autenticato:', req.user);
    
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      console.log('❌ Accesso negato per ruolo:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    const users = loadUsersFromFile();
    
    console.log('📊 KYC caricati dal file:', kycSubmissions.length);
    console.log('👥 Utenti caricati:', users.length);

    // Arricchisci i dati KYC con le informazioni utente
    const enrichedKYC = kycSubmissions.map(kyc => {
      const user = users.find(u => u.id === kyc.userId);
      return {
        ...kyc,
        userInfo: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      };
    });

    console.log('📊 KYC arricchiti:', enrichedKYC.length);

    res.json({
      success: true,
      data: enrichedKYC
    });
  } catch (error) {
    console.error('❌ Errore caricamento KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni singola richiesta KYC (Admin)
app.get('/api/admin/kyc/:kycId', verifyToken, (req, res) => {
  try {
    const { kycId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    console.log('🔍 Cercando KYC con ID:', kycId);
    
    // Cerca KYC con diversi formati di ID
    const kyc = kycSubmissions.find(k => {
      const matchById = k.id == kycId;
      const matchByKycId = k.kycId === kycId;
      return matchById || matchByKycId;
    });

    if (!kyc) {
      console.log('❌ KYC non trovato con ID:', kycId);
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }

    console.log('✅ KYC trovato:', { id: kyc.id, kycId: kyc.kycId, userId: kyc.userId });

    const users = loadUsersFromFile();
    const user = users.find(u => u.id === kyc.userId);

    const enrichedKYC = {
      ...kyc,
      userInfo: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      } : null
    };

    res.json({
      success: true,
      data: enrichedKYC
    });
  } catch (error) {
    console.error('❌ Errore caricamento KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna stato KYC (Approvare/Rifiutare/Pausa)
app.put('/api/admin/kyc/:kycId/status', verifyToken, async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status, notes } = req.body;
    
    console.log('🔄 Admin: Aggiornamento stato KYC', { kycId, status, notes, user: req.user.username });

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      console.log('❌ Accesso negato per aggiornamento KYC - ruolo:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare lo stato KYC.'
      });
    }

    // Validazione status
    const validStatuses = ['approved', 'rejected', 'pending', 'paused', 'accepted', 'modified', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Stato non valido. Stati permessi: approved, rejected, pending, paused, accepted, modified, cancelled'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    console.log('📊 KYC submissions caricate:', kycSubmissions.length);
    console.log('🔍 Cercando KYC con ID:', kycId);
    
    // Cerca KYC con diversi formati di ID
    const kycIndex = kycSubmissions.findIndex(k => {
      const matchById = k.id == kycId;
      const matchByKycId = k.kycId === kycId;
      console.log(`🔍 KYC ${k.id || k.kycId}: id=${k.id}, kycId=${k.kycId}, matchById=${matchById}, matchByKycId=${matchByKycId}`);
      return matchById || matchByKycId;
    });

    if (kycIndex === -1) {
      console.log('❌ KYC non trovato con ID:', kycId);
      console.log('📋 KYC disponibili:', kycSubmissions.map(k => ({ id: k.id, kycId: k.kycId, userId: k.userId })));
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }

    const kyc = kycSubmissions[kycIndex];
    const oldStatus = kyc.status;
    
    console.log('✅ KYC trovato:', { 
      id: kyc.id, 
      kycId: kyc.kycId, 
      userId: kyc.userId, 
      oldStatus, 
      newStatus: status 
    });

    // Aggiorna lo stato
    kyc.status = status;
    kyc.processedAt = new Date().toISOString();
    kyc.processedBy = req.user.id;
    if (notes) {
      kyc.adminNotes = notes;
    }

    // Se approvato o accettato, aggiorna l'utente
    if ((status === 'approved' || status === 'accepted') && oldStatus !== 'approved' && oldStatus !== 'accepted') {
      console.log('🔓 Approvazione KYC - aggiornamento utente...');
      const users = loadUsersFromFile();
      const userIndex = users.findIndex(u => u.id === kyc.userId);
      
      if (userIndex !== -1) {
        users[userIndex].isKYCApproved = true;
        users[userIndex].kycApprovedAt = new Date().toISOString();
        users[userIndex].updatedAt = new Date().toISOString();
        saveUsersToFile(users);
        console.log('✅ Utente aggiornato con approvazione KYC');
      } else {
        console.log('⚠️ Utente non trovato per aggiornamento KYC');
      }
    }

    // Salva le modifiche
    if (saveKYCSubmissions(kycSubmissions)) {
      console.log(`✅ Admin: KYC ${kycId} ${status} da ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          message: `Stato KYC aggiornato con successo a ${status}`,
          kyc: kyc
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio delle modifiche'
      });
    }
  } catch (error) {
    console.error('❌ Errore aggiornamento stato KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - SUBMIT KYC (Guest)
app.post('/api/kyc/submit', verifyToken, async (req, res) => {
  try {
    const { documents, personalInfo } = req.body;
    const userId = req.user.userId;
    
    console.log('📋 Guest: Submit KYC per utente:', userId);
    
    if (!documents || !personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Documenti e informazioni personali sono richiesti'
      });
    }
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Solo gli utenti guest possono inviare KYC'
      });
    }
    
    // Crea nuova submission KYC
    const kycSubmission = {
      kycId: `KYC_${Date.now()}_${userId}`,
      userId: userId,
      status: 'submitted',
      documents: documents,
      personalInfo: personalInfo,
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      notes: ''
    };
    
    // Salva KYC submission
    const kycSubmissions = loadKYCSubmissions();
    kycSubmissions.push(kycSubmission);
    saveKYCSubmissions(kycSubmissions);
    
    // Aggiorna stato utente
    user.kycStatus = 'submitted';
    user.state = 'pending_admin_approval';
    user.updatedAt = new Date().toISOString();
    saveUsersToFile(users);
    
    console.log(`✅ KYC submitted per utente: ${user.username}`);
    
    res.json({
      success: true,
      data: {
        message: 'KYC inviato con successo',
        kycId: kycSubmission.kycId,
        status: 'submitted'
      }
    });
  } catch (error) {
    console.error('❌ Errore submit KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - GET KYC STATUS (Guest)
app.get('/api/kyc/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('📋 Guest: Status KYC per utente:', userId);
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const kycSubmissions = loadKYCSubmissions();
    const userKYC = kycSubmissions.find(k => k.userId === userId);
    
    res.json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        contractStatus: user.contractStatus,
        state: user.state,
        adminApproved: user.adminApproved,
        canPurchasePackages: user.canPurchasePackages,
        kycSubmission: userKYC || null
      }
    });
  } catch (error) {
    console.error('❌ Errore status KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ==================== CONTRACT SYSTEM ====================

// 🔥 API - SIGN CONTRACT (Guest)
app.post('/api/contract/sign', verifyToken, async (req, res) => {
  try {
    const { contractType, ipAddress, userAgent } = req.body;
    const userId = req.user.userId;
    
    console.log('📋 Guest: Sign contract per utente:', userId);
    
    if (!contractType) {
      return res.status(400).json({
        success: false,
        error: 'Tipo contratto richiesto'
      });
    }
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Solo gli utenti guest possono firmare contratti'
      });
    }
    
    // Crea nuovo contratto
    const contract = {
      contractId: `CONTRACT_${Date.now()}_${userId}`,
      userId: userId,
      contractType: contractType || 'ambassador_agreement',
      status: 'signed',
      signedAt: new Date().toISOString(),
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers['user-agent'],
      approvedAt: null,
      approvedBy: null,
      notes: ''
    };
    
    // Salva contratto (per ora in memoria, poi creeremo file dedicato)
    // TODO: Creare file contracts.json
    
    // Aggiorna stato utente
    user.contractStatus = 'signed';
    user.state = 'pending_admin_approval';
    user.updatedAt = new Date().toISOString();
    saveUsersToFile(users);
    
    console.log(`✅ Contract signed per utente: ${user.username}`);
    
    res.json({
      success: true,
      data: {
        message: 'Contratto firmato con successo',
        contractId: contract.contractId,
        status: 'signed'
      }
    });
  } catch (error) {
    console.error('❌ Errore sign contract:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - GET CONTRACT STATUS (Guest)
app.get('/api/contract/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('📋 Guest: Status contract per utente:', userId);
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    res.json({
      success: true,
      data: {
        contractStatus: user.contractStatus,
        kycStatus: user.kycStatus,
        state: user.state,
        adminApproved: user.adminApproved,
        canPurchasePackages: user.canPurchasePackages
      }
    });
  } catch (error) {
    console.error('❌ Errore status contract:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ==================== ADMIN PENDING USERS ====================

// 🔥 API - GET PENDING USERS (Admin)
app.get('/api/admin/pending-users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('📋 Admin: Richiesta utenti pending da', req.user.username);
    
    const users = loadUsersFromFile();
    const kycSubmissions = loadKYCSubmissions();
    
    // Filtra utenti guest in attesa di approvazione
    const pendingUsers = users.filter(user => 
      user.role === 'guest' && 
      (user.state === 'pending_approval' || user.state === 'pending_admin_approval')
    );
    
    // Arricchisci con informazioni KYC e contract
    const enrichedPendingUsers = pendingUsers.map(user => {
      const kyc = kycSubmissions.find(k => k.userId === user.id);
      return {
        ...user,
        kycSubmission: kyc || null,
        hasKYC: kyc ? kyc.status === 'submitted' : false,
        hasContract: user.contractStatus === 'signed'
      };
    });
    
    console.log(`📊 Trovati ${enrichedPendingUsers.length} utenti pending`);
    
    res.json({
      success: true,
      data: enrichedPendingUsers
    });
  } catch (error) {
    console.error('❌ Errore caricamento utenti pending:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - APPROVE USER (Admin)
app.put('/api/admin/approve-user/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    
    console.log('📋 Admin: Approva utente', { userId, admin: req.user.username });
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Solo gli utenti guest possono essere approvati'
      });
    }
    
    // Verifica che KYC e contratto siano completati
    if (user.kycStatus !== 'submitted' && user.kycStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'KYC deve essere completato prima dell\'approvazione'
      });
    }
    
    if (user.contractStatus !== 'signed') {
      return res.status(400).json({
        success: false,
        error: 'Contratto deve essere firmato prima dell\'approvazione'
      });
    }
    
    // Approva utente
    user.state = 'approved';
    user.adminApproved = true;
    user.canPurchasePackages = true;
    user.kycStatus = 'approved';
    user.contractStatus = 'approved';
    user.updatedAt = new Date().toISOString();
    user.approvedAt = new Date().toISOString();
    user.approvedBy = req.user.id;
    user.adminNotes = notes || '';
    
    saveUsersToFile(users);
    
    console.log(`✅ Utente ${user.username} approvato da ${req.user.username}`);
    
    res.json({
      success: true,
      data: {
        message: 'Utente approvato con successo',
        user: {
          id: user.id,
          username: user.username,
          state: user.state,
          adminApproved: user.adminApproved
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore approvazione utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - REJECT USER (Admin)
app.put('/api/admin/reject-user/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    console.log('📋 Admin: Rifiuta utente', { userId, admin: req.user.username, reason });
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({
        success: false,
        error: 'Solo gli utenti guest possono essere rifiutati'
      });
    }
    
    // Rifiuta utente
    user.state = 'rejected';
    user.adminApproved = false;
    user.canPurchasePackages = false;
    user.updatedAt = new Date().toISOString();
    user.rejectedAt = new Date().toISOString();
    user.rejectedBy = req.user.id;
    user.rejectionReason = reason || '';
    
    saveUsersToFile(users);
    
    console.log(`❌ Utente ${user.username} rifiutato da ${req.user.username}`);
    
    res.json({
      success: true,
      data: {
        message: 'Utente rifiutato',
        user: {
          id: user.id,
          username: user.username,
          state: user.state,
          adminApproved: user.adminApproved
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore rifiuto utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ==================== KYC USER ENDPOINTS ====================

// API - Invia richiesta KYC (Utente)
app.post('/api/kyc/submit', verifyToken, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🆔 Utente: Richiesta invio KYC');
    
    const userId = req.user.id;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Verifica se l'utente ha già inviato una richiesta KYC
    const kycSubmissions = loadKYCSubmissions();
    const existingKYC = kycSubmissions.find(k => k.userId === userId);
    
    if (existingKYC && existingKYC.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Hai già inviato una richiesta KYC. Attendi la risposta dell\'amministratore.'
      });
    }

    // Validazione dati
    const requiredFields = ['birthDate', 'address', 'city', 'country', 'citizenship', 'iban'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo obbligatorio mancante: ${field}`
        });
      }
    }

    // Validazione file
    const requiredFiles = ['idFront', 'idBack', 'selfie'];
    for (const fileField of requiredFiles) {
      if (!req.files[fileField] || req.files[fileField].length === 0) {
        return res.status(400).json({
          success: false,
          error: `File obbligatorio mancante: ${fileField}`
        });
      }
    }

    // Validazione contratto
    if (req.body.contractAccepted !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Devi accettare il contratto di collaborazione per procedere'
      });
    }

    // Genera ID KYC unico
    const kycId = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepara i dati KYC
    const kycData = {
      kycId,
      userId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      personalData: {
        birthDate: req.body.birthDate,
        address: req.body.address,
        city: req.body.city,
        country: req.body.country,
        citizenship: req.body.citizenship,
        fiscalCode: req.body.fiscalCode || '',
        iban: req.body.iban
      },
      companyData: req.body.isCompany === 'true' ? {
        companyName: req.body.companyName,
        vatNumber: req.body.vatNumber,
        sdiCode: req.body.sdiCode
      } : null,
      contractAccepted: req.body.contractAccepted === 'true',
      contractAcceptedAt: req.body.contractAccepted === 'true' ? new Date().toISOString() : null,
      files: {
        idFront: req.files.idFront[0].filename,
        idBack: req.files.idBack[0].filename,
        selfie: req.files.selfie[0].filename
      },
      adminNotes: '',
      processedAt: null,
      processedBy: null
    };

    // Salva la richiesta KYC
    kycSubmissions.push(kycData);
    
    if (saveKYCSubmissions(kycSubmissions)) {
      // Aggiorna lo stato utente
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].kycStatus = 'pending';
        users[userIndex].kycSubmittedAt = new Date().toISOString();
        saveUsersToFile(users);
      }

      console.log(`✅ KYC inviato con successo da ${user.username} (ID: ${kycId})`);
      
      res.json({
        success: true,
        message: 'Richiesta KYC inviata con successo',
        data: {
          kycId,
          status: 'pending',
          submittedAt: kycData.submittedAt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio della richiesta KYC'
      });
    }
  } catch (error) {
    console.error('❌ Errore invio KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni stato KYC (Utente)
app.get('/api/kyc/status', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const kycSubmissions = loadKYCSubmissions();
    const userKYC = kycSubmissions.find(k => k.userId === userId);
    
    if (!userKYC) {
      return res.json({
        success: true,
        kyc: {
          status: 'not_submitted',
          submittedAt: null
        }
      });
    }

    res.json({
      success: true,
      kyc: {
        status: userKYC.status,
        submittedAt: userKYC.submittedAt,
        processedAt: userKYC.processedAt,
        adminNotes: userKYC.adminNotes
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento stato KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Elimina richiesta KYC (Admin)
app.delete('/api/admin/kyc/:kycId', verifyToken, (req, res) => {
  try {
    const { kycId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono eliminare le richieste KYC.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    const kycIndex = kycSubmissions.findIndex(k => k.kycId === kycId || k.id == kycId);

    if (kycIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }

    const deletedKYC = kycSubmissions[kycIndex];
    kycSubmissions.splice(kycIndex, 1);

    if (saveKYCSubmissions(kycSubmissions)) {
      console.log(`🗑️ Admin: Eliminazione KYC ${kycId} da ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          message: 'Richiesta KYC eliminata con successo',
          deletedKYC: deletedKYC
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio delle modifiche'
      });
    }
  } catch (error) {
    console.error('❌ Errore eliminazione KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Filtra richieste KYC (Admin)
app.get('/api/admin/kyc/filter', verifyToken, (req, res) => {
  try {
    const { status, search } = req.query;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono filtrare le richieste KYC.'
      });
    }

    let kycSubmissions = loadKYCSubmissions();
    const users = loadUsersFromFile();

    // Filtra per status
    if (status && status !== 'all') {
      kycSubmissions = kycSubmissions.filter(kyc => kyc.status === status);
    }

    // Filtra per ricerca
    if (search) {
      kycSubmissions = kycSubmissions.filter(kyc => {
        const user = users.find(u => u.id === kyc.userId);
        if (!user) return false;
        
        return user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
               user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
               user.email?.toLowerCase().includes(search.toLowerCase()) ||
               kyc.kycId?.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Arricchisci i dati
    const enrichedKYC = kycSubmissions.map(kyc => {
      const user = users.find(u => u.id === kyc.userId);
      return {
        ...kyc,
        userInfo: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      };
    });

    res.json({
      success: true,
      data: enrichedKYC
    });
  } catch (error) {
    console.error('❌ Errore filtro KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Statistiche KYC (Admin)
app.get('/api/admin/kyc/stats', verifyToken, (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle statistiche KYC.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    
    const stats = {
      total: kycSubmissions.length,
      pending: kycSubmissions.filter(k => k.status === 'pending').length,
      approved: kycSubmissions.filter(k => k.status === 'approved').length,
      rejected: kycSubmissions.filter(k => k.status === 'rejected').length,
      paused: kycSubmissions.filter(k => k.status === 'paused').length,
      today: kycSubmissions.filter(k => {
        const today = new Date().toDateString();
        const submissionDate = new Date(k.submittedAt).toDateString();
        return today === submissionDate;
      }).length,
      thisWeek: kycSubmissions.filter(k => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const submissionDate = new Date(k.submittedAt);
        return submissionDate >= weekAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Errore statistiche KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ==================== SALES CRUD SYSTEM ====================

// Funzione per caricare le vendite
function loadSales() {
  try {
    const salesPath = path.join(__dirname, '../data/sales.json');
    const salesData = fs.readFileSync(salesPath, 'utf8');
    return JSON.parse(salesData);
  } catch (error) {
    console.error('❌ Errore caricamento vendite:', error);
    return [];
  }
}

// Funzione per salvare le vendite
function saveSales(salesData) {
  try {
    const salesPath = path.join(__dirname, '../data/sales.json');
    fs.writeFileSync(salesPath, JSON.stringify(salesData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio vendite:', error);
    return false;
  }
}

// Funzioni per gestire i piani di commissioni
const COMMISSION_PLANS_FILE = path.join(__dirname, '../data/commission-plans.json');

function loadCommissionPlansFromFile() {
  try {
    if (fs.existsSync(COMMISSION_PLANS_FILE)) {
      const data = fs.readFileSync(COMMISSION_PLANS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Errore caricamento piani commissioni:', error);
    return [];
  }
}

function saveCommissionPlansToFile(plans) {
  try {
    fs.writeFileSync(COMMISSION_PLANS_FILE, JSON.stringify(plans, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio piani commissioni:', error);
    return false;
  }
}

// Funzioni per gestire le commissioni
const COMMISSIONS_FILE = path.join(__dirname, '../data/commissions.json');

function loadCommissionsFromFile() {
  try {
    if (fs.existsSync(COMMISSIONS_FILE)) {
      const data = fs.readFileSync(COMMISSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Errore caricamento commissioni:', error);
    return [];
  }
}

function saveCommissionsToFile(commissions) {
  try {
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(commissions, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio commissioni:', error);
    return false;
  }
}

// API - Ottieni tutte le vendite (Admin)
app.get('/api/admin/sales', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle vendite.'
      });
    }

    const sales = loadSales();
    const users = loadUsersFromFile();

    // Arricchisci i dati vendite con le informazioni utente
    const enrichedSales = sales.map(sale => {
      // Gestisce entrambi i campi: ambassadorId e userId
      const ambassadorId = sale.ambassadorId || sale.userId;
      const user = users.find(u => u.id === ambassadorId);
      return {
        ...sale,
        ambassadorId: ambassadorId, // Normalizza il campo
        ambassadorInfo: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      };
    });

    console.log('💰 Admin: Richiesta lista vendite');
    console.log('📊 Vendite disponibili:', enrichedSales.length);

    res.json({
      success: true,
      data: enrichedSales
    });
  } catch (error) {
    console.error('❌ Errore caricamento vendite:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Statistiche vendite (Admin)
app.get('/api/admin/sales/stats', verifyToken, (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle statistiche vendite.'
      });
    }

    const sales = loadSales();
    
    const stats = {
      total: sales.length,
      totalAmount: sales.reduce((sum, sale) => {
        // Gestisce entrambe le strutture: amount/totalAmount e commission/commissionAmount
        const amount = sale.totalAmount || sale.amount || 0;
        return sum + amount;
      }, 0),
      totalCommissions: sales.reduce((sum, sale) => {
        // Gestisce entrambe le strutture: commission/commissionAmount
        const commission = sale.commissionAmount || sale.commission || 0;
        return sum + commission;
      }, 0),
      pending: sales.filter(s => s.status === 'pending').length,
      completed: sales.filter(s => s.status === 'completed').length,
      cancelled: sales.filter(s => s.status === 'cancelled').length,
      today: sales.filter(s => {
        const today = new Date().toDateString();
        const saleDate = new Date(s.createdAt || s.date).toDateString();
        return today === saleDate;
      }).length,
      thisWeek: sales.filter(s => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const saleDate = new Date(s.createdAt || s.date);
        return saleDate >= weekAgo;
      }).length,
      thisMonth: sales.filter(s => {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const saleDate = new Date(s.createdAt || s.date);
        return saleDate >= monthAgo;
      }).length,
      averageSale: sales.length > 0 ? sales.reduce((sum, sale) => {
        const amount = sale.totalAmount || sale.amount || 0;
        return sum + amount;
      }, 0) / sales.length : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Errore statistiche vendite:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Statistiche commissioni (Admin)
app.get('/api/admin/commissions/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const commissions = loadCommissionsFromFile();
    const users = loadUsersFromFile();
    
    const stats = {
      total: commissions.length,
      totalCommissions: commissions.reduce((sum, commission) => {
        return sum + (commission.commissionAmount || 0);
      }, 0),
      pendingCommissions: commissions.filter(c => c.status === 'pending').reduce((sum, commission) => {
        return sum + (commission.commissionAmount || 0);
      }, 0),
      paidCommissions: commissions.filter(c => c.status === 'paid').reduce((sum, commission) => {
        return sum + (commission.commissionAmount || 0);
      }, 0),
      totalByUser: {},
      today: commissions.filter(c => {
        const today = new Date().toDateString();
        const commissionDate = new Date(c.date).toDateString();
        return today === commissionDate;
      }).length,
      thisWeek: commissions.filter(c => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const commissionDate = new Date(c.date);
        return commissionDate >= weekAgo;
      }).length,
      thisMonth: commissions.filter(c => {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const commissionDate = new Date(c.date);
        return commissionDate >= monthAgo;
      }).length,
      averageCommission: commissions.length > 0 ? commissions.reduce((sum, commission) => {
        return sum + (commission.commissionAmount || 0);
      }, 0) / commissions.length : 0
    };

    // Calcola statistiche per utente
    commissions.forEach(commission => {
      const userId = commission.userId;
      if (!stats.totalByUser[userId]) {
        const user = users.find(u => u.id === userId);
        stats.totalByUser[userId] = {
          username: user?.username || 'Unknown',
          totalCommissions: 0,
          pendingCommissions: 0,
          paidCommissions: 0,
          commissionCount: 0
        };
      }
      
      stats.totalByUser[userId].totalCommissions += (commission.commissionAmount || 0);
      stats.totalByUser[userId].commissionCount += 1;
      
      if (commission.status === 'pending') {
        stats.totalByUser[userId].pendingCommissions += (commission.commissionAmount || 0);
      } else if (commission.status === 'paid') {
        stats.totalByUser[userId].paidCommissions += (commission.commissionAmount || 0);
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Errore statistiche commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni singola vendita (Admin)
app.get('/api/admin/sales/:saleId', verifyToken, (req, res) => {
  try {
    const { saleId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle vendite.'
      });
    }

    const sales = loadSales();
    const sale = sales.find(s => s.saleId === saleId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Vendita non trovata'
      });
    }

    const users = loadUsersFromFile();
    const user = users.find(u => u.id === sale.ambassadorId);

    const enrichedSale = {
      ...sale,
      ambassadorInfo: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      } : null
    };

    res.json({
      success: true,
      data: enrichedSale
    });
  } catch (error) {
    console.error('❌ Errore caricamento vendita:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Crea nuova vendita (Admin)
app.post('/api/admin/sales', verifyToken, (req, res) => {
  try {
    const { ambassadorId, customerName, customerEmail, products, totalAmount, commissionRate, status, notes } = req.body;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono creare vendite.'
      });
    }

    // Validazione dati
    if (!ambassadorId || !customerName || !products || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: ambassadorId, customerName, products, totalAmount'
      });
    }

    const sales = loadSales();
    const users = loadUsersFromFile();
    
    // Verifica che l'ambassador esista
    const ambassador = users.find(u => u.id === ambassadorId && u.role === 'ambassador');
    if (!ambassador) {
      return res.status(400).json({
        success: false,
        error: 'Ambassador non trovato o non valido'
      });
    }

    const newSale = {
      saleId: `SALE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ambassadorId: parseInt(ambassadorId),
      customerName,
      customerEmail: customerEmail || '',
      products: Array.isArray(products) ? products : [products],
      totalAmount: parseFloat(totalAmount),
      commissionRate: commissionRate || ambassador.commissionRate || 0.05,
      // Calcolo commissione sull'importo MENO 22% IVA
      commissionAmount: (parseFloat(totalAmount) / 1.22) * (commissionRate || ambassador.commissionRate || 0.05),
      status: status || 'pending',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sales.push(newSale);

    if (saveSales(sales)) {
      console.log(`✅ Admin: Creata vendita ${newSale.saleId} da ${req.user.username}`);
      
      // 🔥 GENERA COMMISSIONE AUTOMATICAMENTE
      const commissions = loadCommissionsFromFile();
      const newCommission = {
        id: commissions.length + 1,
        userId: parseInt(ambassadorId),
        ambassadorName: ambassador.username,
        type: 'direct_sale',
        amount: parseFloat(totalAmount),
        commissionRate: newSale.commissionRate,
        commissionAmount: newSale.commissionAmount,
        status: newSale.status === 'completed' ? 'paid' : 'pending',
        date: newSale.createdAt,
        description: `Commissione per vendita ${newSale.saleId} - ${customerName}`,
        level: 0,
        plan: 'manual',
        saleId: newSale.saleId
      };
      
      commissions.push(newCommission);
      saveCommissionsToFile(commissions);
      
      // Aggiorna totalCommissions dell'ambassador
      const userIndex = users.findIndex(u => u.id === parseInt(ambassadorId));
      if (userIndex !== -1) {
        users[userIndex].totalCommissions = (users[userIndex].totalCommissions || 0) + newSale.commissionAmount;
        saveUsersToFile(users);
      }
      
      console.log(`💰 Commissione generata automaticamente: €${newSale.commissionAmount} per ${ambassador.username}`);
      
      res.json({
        success: true,
        data: {
          message: 'Vendita creata con successo',
          sale: newSale,
          commission: newCommission
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio della vendita'
      });
    }
  } catch (error) {
    console.error('❌ Errore creazione vendita:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna vendita (Admin)
app.put('/api/admin/sales/:saleId', verifyToken, (req, res) => {
  try {
    const { saleId } = req.params;
    const { customerName, customerEmail, products, totalAmount, commissionRate, status, notes } = req.body;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare le vendite.'
      });
    }

    const sales = loadSales();
    const saleIndex = sales.findIndex(s => s.saleId === saleId);

    if (saleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Vendita non trovata'
      });
    }

    const sale = sales[saleIndex];
    const users = loadUsersFromFile();
    const ambassador = users.find(u => u.id === sale.ambassadorId);

    // Aggiorna i campi
    if (customerName !== undefined) sale.customerName = customerName;
    if (customerEmail !== undefined) sale.customerEmail = customerEmail;
    if (products !== undefined) sale.products = Array.isArray(products) ? products : [products];
    if (totalAmount !== undefined) {
      sale.totalAmount = parseFloat(totalAmount);
      // Calcolo commissione sull'importo MENO 22% IVA
      sale.commissionAmount = (sale.totalAmount / 1.22) * (sale.commissionRate || ambassador?.commissionRate || 0.05);
    }
    if (commissionRate !== undefined) {
      sale.commissionRate = parseFloat(commissionRate);
      // Calcolo commissione sull'importo MENO 22% IVA
      sale.commissionAmount = (sale.totalAmount / 1.22) * sale.commissionRate;
    }
    if (status !== undefined) sale.status = status;
    if (notes !== undefined) sale.notes = notes;
    
    sale.updatedAt = new Date().toISOString();

    if (saveSales(sales)) {
      console.log(`✅ Admin: Aggiornata vendita ${saleId} da ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          message: 'Vendita aggiornata con successo',
          sale: sale
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio delle modifiche'
      });
    }
  } catch (error) {
    console.error('❌ Errore aggiornamento vendita:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Elimina vendita (Admin)
app.delete('/api/admin/sales/:saleId', verifyToken, (req, res) => {
  try {
    const { saleId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono eliminare le vendite.'
      });
    }

    const sales = loadSales();
    const saleIndex = sales.findIndex(s => s.saleId === saleId);

    if (saleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Vendita non trovata'
      });
    }

    const deletedSale = sales[saleIndex];
    sales.splice(saleIndex, 1);

    if (saveSales(sales)) {
      console.log(`🗑️ Admin: Eliminazione vendita ${saleId} da ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          message: 'Vendita eliminata con successo',
          deletedSale: deletedSale
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio delle modifiche'
      });
    }
  } catch (error) {
    console.error('❌ Errore eliminazione vendita:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Filtra vendite (Admin)
app.get('/api/admin/sales/filter', verifyToken, (req, res) => {
  try {
    const { status, ambassadorId, dateFrom, dateTo, search } = req.query;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono filtrare le vendite.'
      });
    }

    let sales = loadSales();
    const users = loadUsersFromFile();

    // Filtra per status
    if (status && status !== 'all') {
      sales = sales.filter(sale => sale.status === status);
    }

    // Filtra per ambassador
    if (ambassadorId && ambassadorId !== 'all') {
      sales = sales.filter(sale => sale.ambassadorId === parseInt(ambassadorId));
    }

    // Filtra per data
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      sales = sales.filter(sale => new Date(sale.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      sales = sales.filter(sale => new Date(sale.createdAt) <= toDate);
    }

    // Filtra per ricerca
    if (search) {
      sales = sales.filter(sale => {
        const ambassador = users.find(u => u.id === sale.ambassadorId);
        return sale.customerName?.toLowerCase().includes(search.toLowerCase()) ||
               sale.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
               sale.saleId?.toLowerCase().includes(search.toLowerCase()) ||
               ambassador?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
               ambassador?.lastName?.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Arricchisci i dati
    const enrichedSales = sales.map(sale => {
      const user = users.find(u => u.id === sale.ambassadorId);
      return {
        ...sale,
        ambassadorInfo: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      };
    });

    res.json({
      success: true,
      data: enrichedSales
    });
  } catch (error) {
    console.error('❌ Errore filtro vendite:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});



// API - Lista utenti (Admin)
app.get('/api/admin/users', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alla lista utenti.'
      });
    }

    const users = loadUsersFromFile();
    
    // Rimuovi le password per sicurezza
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: safeUsers
    });
  } catch (error) {
    console.error('❌ Errore lista utenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Lista task (Admin)
app.get('/api/admin/tasks', verifyToken, requireRole('admin'), (req, res) => {
  try {
    console.log('📋 Admin: Richiesta lista task da', req.user.username);
    
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      console.log('❌ Accesso negato per utente:', req.user.username, 'ruolo:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alla lista task.'
      });
    }

    const tasks = loadTasksFromFile();
    console.log('📊 Task caricati:', tasks.length);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Errore lista task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Lista task pubblica
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = loadTasksFromFile();
    
    // Filtra solo i task attivi
    const activeTasks = tasks.filter(task => task.isActive);

    res.json({
      success: true,
      data: activeTasks
    });
  } catch (error) {
    console.error('❌ Errore lista task pubblica:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Statistiche admin (Admin)
app.get('/api/admin/stats', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle statistiche.'
      });
    }

    const users = loadUsersFromFile();
    const tasks = loadTasksFromFile();
    const kycSubmissions = loadKYCSubmissions();
    const sales = loadSales();
    const allCommissions = loadCommissionsFromFile();

    // Calcola statistiche base
    const totalUsers = users.length;
    const totalTasks = tasks.length;
    const activeAmbassadors = users.filter(u => u.role === 'ambassador' && u.isActive !== false).length;
    
    // Calcola commissioni totali dalle commissioni reali
    const totalCommissions = allCommissions.reduce((sum, commission) => sum + (commission.commissionAmount || 0), 0);
    const pendingCommissions = allCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, commission) => sum + (commission.commissionAmount || 0), 0);
    
    const pendingKYC = kycSubmissions.filter(k => k.status === 'pending').length;
    const totalSales = sales.length;
    
    // Calcola vendite totali del mese corrente
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySales = sales
      .filter(sale => {
        const saleDate = new Date(sale.date || sale.createdAt || 0);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + (sale.amount || sale.totalAmount || 0), 0);

    // Verifica coordinazione vendite-commissioni
    const salesWithCommissions = sales.filter(sale => {
      return allCommissions.some(commission => 
        commission.saleId === (sale.id || sale.saleId)
      );
    });

    const coordinationRate = sales.length > 0 ? (salesWithCommissions.length / sales.length) * 100 : 0;

    // Attività recente degli ambassador
    const ambassadorActivities = [];
    
    // 1. Vendite recenti degli ambassador
    const recentSales = sales
      .filter(sale => {
        const saleDate = new Date(sale.date || sale.createdAt || 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return saleDate > weekAgo;
      })
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      .slice(0, 5)
      .map(sale => ({
        id: sale.id,
        type: 'sale',
        title: `Vendita di €${sale.amount} da ${sale.username}`,
        message: sale.description || 'Vendita pacchetto',
        icon: '🛍️',
        time: new Date(sale.date || sale.createdAt || 0).toLocaleString('it-IT'),
        timestamp: sale.date || sale.createdAt || new Date().toISOString()
      }));
    
    ambassadorActivities.push(...recentSales);
    
    // 2. Commissioni generate recentemente
    const commissions = loadCommissionsFromFile();
    const recentCommissions = commissions
      .filter(commission => {
        const commissionDate = new Date(commission.date || commission.createdAt || 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return commissionDate > weekAgo;
      })
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      .slice(0, 5)
      .map(commission => ({
        id: commission.id,
        type: 'commission',
        title: `Commissione di €${commission.amount} per ${commission.ambassadorName}`,
        message: commission.description || 'Commissione generata',
        icon: '💰',
        time: new Date(commission.date || commission.createdAt || 0).toLocaleString('it-IT'),
        timestamp: commission.date || commission.createdAt || new Date().toISOString()
      }));
    
    ambassadorActivities.push(...recentCommissions);
    
    // 3. KYC recenti degli ambassador
    const recentKYC = kycSubmissions
      .filter(kyc => {
        const kycDate = new Date(kyc.submittedAt || kyc.createdAt || 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return kycDate > weekAgo;
      })
      .sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
      .slice(0, 3)
      .map(kyc => {
        // Trova il nome dell'utente dal userId
        const user = users.find(u => u.id === kyc.userId);
        const userName = user ? user.username : `Utente ${kyc.userId}`;
        
        return {
          id: kyc.kycId,
          type: 'kyc',
          title: `KYC ${kyc.status} per ${userName}`,
          message: `Stato: ${kyc.status}`,
          icon: '🔐',
          time: new Date(kyc.submittedAt || kyc.createdAt || 0).toLocaleString('it-IT'),
          timestamp: kyc.submittedAt || kyc.createdAt || new Date().toISOString()
        };
      });
    
    ambassadorActivities.push(...recentKYC);
    
    // 4. Nuovi ambassador registrati
    const recentAmbassadors = users
      .filter(user => user.role === 'ambassador')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3)
      .map(user => ({
        id: user.id,
        type: 'ambassador_registration',
        title: `Nuovo Ambassador: ${user.username}`,
        message: 'Registrato come ambassador',
        icon: '⭐',
        time: new Date(user.createdAt || 0).toLocaleString('it-IT'),
        timestamp: user.createdAt || new Date().toISOString()
      }));
    
    ambassadorActivities.push(...recentAmbassadors);
    
    // Ordina tutte le attività per timestamp e prendi le più recenti
    const recentActivity = ambassadorActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        activeAmbassadors,
        totalCommissions,
        pendingCommissions,
        pendingKYC,
        totalSales,
        monthlySales,
        coordinationRate,
        salesWithCommissions: salesWithCommissions.length,
        totalCommissionsCount: allCommissions.length,
        recentActivity
      }
    });
  } catch (error) {
    console.error('❌ Errore statistiche admin:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Notifiche admin (Admin)
app.get('/api/admin/notifications', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alle notifiche.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    const users = loadUsersFromFile();

    // Genera notifiche basate sui dati
    const notifications = [];

    // Notifiche KYC pendenti
    const pendingKYC = kycSubmissions.filter(k => k.status === 'pending');
    if (pendingKYC.length > 0) {
      notifications.push({
        id: 'kyc_pending',
        type: 'warning',
        title: 'KYC in Attesa',
        message: `${pendingKYC.length} richieste KYC in attesa di approvazione`,
        icon: '🔐',
        timestamp: new Date().toISOString()
      });
    }

    // Notifiche nuovi utenti (ultimi 7 giorni)
    const recentUsers = users.filter(u => {
      const userDate = new Date(u.createdAt || 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return userDate > weekAgo;
    });

    if (recentUsers.length > 0) {
      notifications.push({
        id: 'new_users',
        type: 'info',
        title: 'Nuovi Utenti',
        message: `${recentUsers.length} nuovi utenti registrati questa settimana`,
        icon: '👥',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('❌ Errore notifiche admin:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Lista piani di commissioni (Admin)
app.get('/api/admin/commission-plans', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere ai piani di commissioni.'
      });
    }

    const plans = loadCommissionPlansFromFile();
    console.log('💰 Admin: Richiesta lista piani commissioni');
    console.log('📊 Piani disponibili:', plans.length);

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('❌ Errore lista piani commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni singolo piano di commissioni (Admin)
app.get('/api/admin/commission-plans/:planId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { planId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere ai piani di commissioni.'
      });
    }

    const plans = loadCommissionPlansFromFile();
    const plan = plans.find(p => p.id === parseInt(planId));

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Piano di commissioni non trovato'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('❌ Errore piano commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Crea nuovo piano di commissioni (Admin)
app.post('/api/admin/commission-plans', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono creare piani di commissioni.'
      });
    }

    const plans = loadCommissionPlansFromFile();
    const newPlan = {
      id: plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    plans.push(newPlan);
    saveCommissionPlansToFile(plans);

    console.log('✅ Nuovo piano commissioni creato:', newPlan.name);

    // 🔄 NOTIFICA TEMPO REALE - Nuovo piano commissioni
    broadcastNotification('COMMISSION_PLAN_CREATED', {
      plan: newPlan,
      message: `Nuovo piano commissioni: ${newPlan.name}`
    });

    res.status(201).json({
      success: true,
      data: newPlan
    });
  } catch (error) {
    console.error('❌ Errore creazione piano commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna piano di commissioni (Admin)
app.put('/api/admin/commission-plans/:planId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { planId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare piani di commissioni.'
      });
    }

    const plans = loadCommissionPlansFromFile();
    const planIndex = plans.findIndex(p => p.id === parseInt(planId));

    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Piano di commissioni non trovato'
      });
    }

    const updatedPlan = {
      ...plans[planIndex],
      ...req.body,
      id: parseInt(planId),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    plans[planIndex] = updatedPlan;
    saveCommissionPlansToFile(plans);

    console.log('✅ Piano commissioni aggiornato:', updatedPlan.name);

    // 🔄 NOTIFICA TEMPO REALE - Piano commissioni aggiornato
    broadcastNotification('COMMISSION_PLAN_UPDATED', {
      plan: updatedPlan,
      message: `Piano commissioni aggiornato: ${updatedPlan.name}`
    });

    res.json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento piano commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Elimina piano di commissioni (Admin)
app.delete('/api/admin/commission-plans/:planId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { planId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono eliminare piani di commissioni.'
      });
    }

    const plans = loadCommissionPlansFromFile();
    const planIndex = plans.findIndex(p => p.id === parseInt(planId));

    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Piano di commissioni non trovato'
      });
    }

    const deletedPlan = plans[planIndex];
    plans.splice(planIndex, 1);
    saveCommissionPlansToFile(plans);

    console.log('✅ Piano commissioni eliminato:', deletedPlan.name);

    res.json({
      success: true,
      message: 'Piano di commissioni eliminato con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione piano commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Crea nuovo task (Admin)
app.post('/api/admin/tasks', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono creare task.'
      });
    }

    const tasks = loadTasksFromFile();
    const newTask = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    tasks.push(newTask);
    saveTasksToFile(tasks);

    console.log('✅ Nuovo task creato:', newTask.title);

    // 🔄 NOTIFICA TEMPO REALE - Nuovo task disponibile
    broadcastNotification('TASK_CREATED', {
      task: newTask,
      message: `Nuovo task disponibile: ${newTask.title}`
    });

    res.status(201).json({
      success: true,
      data: newTask
    });
  } catch (error) {
    console.error('❌ Errore creazione task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna task (Admin)
app.put('/api/admin/tasks/:taskId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { taskId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare task.'
      });
    }

    const tasks = loadTasksFromFile();
    const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...req.body,
      id: parseInt(taskId),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    tasks[taskIndex] = updatedTask;
    saveTasksToFile(tasks);

    console.log('✅ Task aggiornato:', updatedTask.title);

    // 🔄 NOTIFICA TEMPO REALE - Task aggiornato
    broadcastNotification('TASK_UPDATED', {
      task: updatedTask,
      message: `Task aggiornato: ${updatedTask.title}`
    });

    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Elimina task (Admin)
app.delete('/api/admin/tasks/:taskId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { taskId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono eliminare task.'
      });
    }

    const tasks = loadTasksFromFile();
    const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    saveTasksToFile(tasks);

    console.log('✅ Task eliminato:', deletedTask.title);

    res.json({
      success: true,
      message: 'Task eliminato con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Crea nuovo utente (Admin)
app.post('/api/admin/users', verifyToken, requireRole('admin'), (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono creare utenti.'
      });
    }

    const users = loadUsersFromFile();
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    saveUsersToFile(users);

    console.log('✅ Nuovo utente creato:', newUser.username);

    // 🔄 NOTIFICA TEMPO REALE - Nuovo utente creato
    broadcastNotification('USER_CREATED', {
      user: newUser,
      message: `Nuovo utente creato: ${newUser.username}`
    });

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    console.error('❌ Errore creazione utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna utente (Admin)
app.put('/api/admin/users/:userId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare utenti.'
      });
    }

    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const updatedUser = {
      ...users[userIndex],
      ...req.body,
      id: parseInt(userId),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    users[userIndex] = updatedUser;
    saveUsersToFile(users);

    console.log('✅ Utente aggiornato:', updatedUser.username);

    // 🔄 NOTIFICA TEMPO REALE - Utente aggiornato
    broadcastNotification('USER_UPDATED', {
      user: updatedUser,
      message: `Utente aggiornato: ${updatedUser.username}`
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Elimina utente (Admin)
app.delete('/api/admin/users/:userId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono eliminare utenti.'
      });
    }

    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    saveUsersToFile(users);

    console.log('✅ Utente eliminato:', deletedUser.username);

    res.json({
      success: true,
      message: 'Utente eliminato con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni pacchetti disponibili per l'acquisto
app.get('/api/packages/available', verifyToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica i piani di commissioni dall'admin
    const commissionPlans = loadCommissionPlansFromFile();
    
    // Converti i piani di commissioni in pacchetti disponibili
    const availablePackages = commissionPlans
      .filter(plan => plan.isActive)
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        cost: plan.cost, // Cambiato da price a cost
        price: plan.cost, // Mantenuto per compatibilità
        commissionRate: plan.directSale,
        isAuthorized: plan.isAuthorized || false, // Campo per autorizzazione
        features: [
          `Commissioni dirette: ${(plan.directSale * 100).toFixed(1)}%`,
          `Commissioni livello 1: ${(plan.level1 * 100).toFixed(1)}%`,
          `Commissioni livello 2: ${(plan.level2 * 100).toFixed(1)}%`,
          `Commissioni livello 3: ${(plan.level3 * 100).toFixed(1)}%`,
          `Commissioni livello 4: ${(plan.level4 * 100).toFixed(1)}%`,
          `Commissioni livello 5: ${(plan.level5 * 100).toFixed(1)}%`,
          `Punti minimi richiesti: ${plan.minPoints}`,
          `Task minimi richiesti: ${plan.minTasks}`,
          `Vendite minime richieste: €${plan.minSales}`
        ],
        level: plan.code.toUpperCase(),
        code: plan.code,
        directSale: plan.directSale,
        level1: plan.level1,
        level2: plan.level2,
        level3: plan.level3,
        level4: plan.level4,
        level5: plan.level5,
        minPoints: plan.minPoints,
        minTasks: plan.minTasks,
        minSales: plan.minSales
      }));

    // Filtra i pacchetti già acquistati
    const purchasedPackageIds = (user.purchasedPackages || []).map(p => p.packageId);
    const filteredPackages = availablePackages.filter(p => !purchasedPackageIds.includes(p.id));

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        packages: filteredPackages
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento pacchetti disponibili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Funzione per aggiornare il ruolo dell'utente basato sul pacchetto
function updateUserRoleFromPackage(user, packageCode) {
  const roleMapping = {
    'WTW_AMBASSADOR': 'wtw_ambassador',
    'MLM_AMBASSADOR': 'mlm_ambassador',
    'PENTAGAME_AMBASSADOR': 'pentagame_ambassador'
  };
  
  const levelMapping = {
    'WTW_AMBASSADOR': 'WTW',
    'MLM_AMBASSADOR': 'MLM',
    'PENTAGAME_AMBASSADOR': 'PENTAGAME'
  };
  
  // Aggiorna ruolo - se è guest, promuovi ad ambassador
  if (user.role === 'guest') {
    user.role = 'ambassador';
  } else {
    user.role = roleMapping[packageCode] || 'entry_ambassador';
  }
  
  // Aggiorna livello
  user.level = levelMapping[packageCode] || 'ENTRY';
  
  // Aggiorna commission rate dal pacchetto
  const commissionPlans = loadCommissionPlansFromFile();
  const plan = commissionPlans.find(p => p.code === packageCode);
  if (plan) {
    user.commissionRate = plan.directSale;
  }
  
  return user;
}

// API - Acquista pacchetto
app.post('/api/packages/purchase', verifyToken, async (req, res) => {
  try {
    const { userId, packageId, paymentMethod } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const user = users[userIndex];
    
    // 🔥 VERIFICA STATO GUEST
    if (user.role === 'guest') {
      if (!user.adminApproved || !user.canPurchasePackages) {
        return res.status(403).json({
          success: false,
          error: 'Utente guest non ancora approvato. Completa KYC e contratto, poi attendi approvazione admin.'
        });
      }
      
      if (user.state !== 'approved') {
        return res.status(403).json({
          success: false,
          error: `Utente in stato: ${user.state}. Deve essere approvato dall'admin.`
        });
      }
    }

    // Carica i piani di commissioni dall'admin
    const commissionPlans = loadCommissionPlansFromFile();
    const packageToPurchase = commissionPlans.find(p => p.id === parseInt(packageId) && p.isActive);
    
    if (!packageToPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }

    // Crea il nuovo pacchetto acquistato
    const newPackage = {
      packageId: packageToPurchase.id,
      packageName: packageToPurchase.name,
      purchaseDate: new Date().toISOString(),
      cost: packageToPurchase.cost,
      commissionRates: {
        directSale: packageToPurchase.directSale,
        level1: packageToPurchase.level1,
        level2: packageToPurchase.level2,
        level3: packageToPurchase.level3,
        level4: packageToPurchase.level4,
        level5: packageToPurchase.level5
      },
      paymentMethod: paymentMethod || 'card',
      code: packageToPurchase.code,
      minPoints: packageToPurchase.minPoints,
      minTasks: packageToPurchase.minTasks,
      minSales: packageToPurchase.minSales
    };

    // Aggiungi il pacchetto all'utente
    if (!users[userIndex].purchasedPackages) {
      users[userIndex].purchasedPackages = [];
    }

    users[userIndex].purchasedPackages.push(newPackage);
    
    // 🔥 AGGIORNA RUOLO BASATO SUL PACCHETTO
    users[userIndex] = updateUserRoleFromPackage(users[userIndex], packageToPurchase.code);

    saveUsersToFile(users);

    console.log(`✅ Pacchetto acquistato e ruolo aggiornato:`, {
      userId: users[userIndex].id,
      username: users[userIndex].username,
      packageName: packageToPurchase.name,
      newRole: users[userIndex].role,
      newLevel: users[userIndex].level,
      newCommissionRate: users[userIndex].commissionRate
    });

    res.json({
      success: true,
      data: {
        message: `Pacchetto ${packageToPurchase.name} acquistato con successo!`,
        package: newPackage,
        user: users[userIndex]
      }
    });
  } catch (error) {
    console.error('❌ Errore acquisto pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni status ambassador
app.get('/api/ambassador/status/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica il piano commissioni dell'utente
    const commissionPlans = loadCommissionPlansFromFile();
    const userPlan = commissionPlans.find(plan => plan.code.toLowerCase() === (user.plan || 'mlm2025').toLowerCase());

    // Calcola status basato sui dati utente
    const statusData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      level: userPlan ? userPlan.code.toUpperCase() : 'ENTRY',
      plan: userPlan,
      points: user.points || 0,
      totalSales: user.totalSales || 0,
      completedTasks: user.completedTasks?.length || 0,
      totalCommissions: user.totalCommissions || 0,
      isActive: user.isActive !== false,
      joinDate: user.createdAt || new Date().toISOString(),
      requirements: {
        minPoints: userPlan ? userPlan.minPoints : 100,
        minTasks: userPlan ? userPlan.minTasks : 3,
        minSales: userPlan ? userPlan.minSales : 500,
        currentPoints: user.points || 0,
        currentTasks: user.completedTasks?.length || 0,
        currentSales: user.totalSales || 0
      }
    };

    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('❌ Errore caricamento status ambassador:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni network ambassador
app.get('/api/ambassador/network/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Simula dati network (in un sistema reale questi verrebbero da un database)
    const networkMembers = user.referrals?.map(r => ({
      id: r.id || Math.random(),
      userId: r.userId || Math.random(),
      user: {
        firstName: r.firstName || r.username?.split(' ')[0] || 'User',
        lastName: r.lastName || r.username?.split(' ')[1] || '',
        email: r.email || 'user@example.com'
      },
      plan: r.plan || 'ambassador',
      level: r.level || 1,
      isActive: r.isActive || true,
      totalCommissions: r.totalCommissions || 0,
      commissionEarned: r.commissionEarned || 0,
      downline: r.downline || [],
      joinDate: r.joinDate || new Date().toISOString()
    })) || [];

    const networkByLevel = {};
    networkMembers.forEach(member => {
      const level = member.level || 1;
      if (!networkByLevel[level]) {
        networkByLevel[level] = [];
      }
      networkByLevel[level].push(member);
    });

    const networkData = {
      userNetwork: {
        userId: user.id,
        username: user.username,
        firstName: user.firstName || user.username.split(' ')[0] || 'User',
        lastName: user.lastName || user.username.split(' ')[1] || '',
        role: user.role || 'ambassador',
        totalCommissions: user.totalCommissions || 0
      },
      networkMembers: networkMembers,
      networkByLevel: networkByLevel,
      totalMembers: networkMembers.length,
      levels: Object.keys(networkByLevel).length || 1,
      stats: {
        totalReferrals: user.referrals?.length || 0,
        activeReferrals: user.referrals?.filter(r => r.isActive)?.length || 0,
        totalCommissionsEarned: user.totalCommissions || 0,
        averageCommissionPerReferral: user.referrals?.length > 0 ? (user.totalCommissions || 0) / user.referrals.length : 0
      }
    };

    res.json({
      success: true,
      data: networkData
    });
  } catch (error) {
    console.error('❌ Errore caricamento network ambassador:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni performance ambassador
app.get('/api/ambassador/performance/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica le commissioni dell'utente
    const commissions = loadCommissionsFromFile();
    const userCommissions = commissions.filter(c => c.userId === parseInt(userId));

    // Calcola performance con struttura completa
    const totalCommissions = userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = userCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = userCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
    const currentMonthCommissions = userCommissions.filter(c => new Date(c.date).getMonth() === new Date().getMonth()).reduce((sum, c) => sum + c.commissionAmount, 0);
    const lastMonthCommissions = userCommissions.filter(c => new Date(c.date).getMonth() === new Date().getMonth() - 1).reduce((sum, c) => sum + c.commissionAmount, 0);
    
    const performanceData = {
      userId: user.id,
      username: user.username,
      networkGrowth: {
        totalGrowth: user.referrals?.length || 0,
        monthlyGrowth: Math.floor((user.referrals?.length || 0) * 0.1), // Simulato
        weeklyGrowth: Math.floor((user.referrals?.length || 0) * 0.05), // Simulato
        growthRate: user.referrals?.length > 0 ? 15 : 0 // Simulato
      },
      commissionPerformance: {
        totalEarned: totalCommissions,
        monthlyAverage: currentMonthCommissions,
        weeklyAverage: Math.floor(currentMonthCommissions / 4), // Simulato
        commissionPerReferral: user.referrals?.length > 0 ? totalCommissions / user.referrals.length : 0
      },
      conversionMetrics: {
        conversionRate: user.referrals?.length > 0 ? 75 : 0, // Simulato
        retentionRate: user.referrals?.length > 0 ? 85 : 0, // Simulato
        activationRate: user.referrals?.length > 0 ? 90 : 0 // Simulato
      },
      salesPerformance: {
        totalSales: user.totalSales || 0,
        monthlySales: currentMonthCommissions,
        weeklySales: Math.floor(currentMonthCommissions / 4), // Simulato
        averageOrderValue: userCommissions.length > 0 ? totalCommissions / userCommissions.length : 0
      },
      // Dati originali per compatibilità
      totalCommissions: totalCommissions,
      paidCommissions: paidCommissions,
      pendingCommissions: pendingCommissions,
      totalSales: user.totalSales || 0,
      totalTransactions: userCommissions.length,
      averageCommission: userCommissions.length > 0 ? totalCommissions / userCommissions.length : 0,
      monthlyStats: {
        currentMonth: currentMonthCommissions,
        lastMonth: lastMonthCommissions
      }
    };

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('❌ Errore caricamento performance ambassador:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni piani commissioni per ambassador
app.get('/api/ambassador/commission-plans', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica tutti i piani commissioni
    const commissionPlans = loadCommissionPlansFromFile();
    
    // Filtra solo i piani attivi
    const activePlans = commissionPlans.filter(plan => plan.isActive);

    res.json({
      success: true,
      data: {
        userPlan: user.plan || 'mlm2025',
        availablePlans: activePlans,
        currentPlan: activePlans.find(plan => plan.code.toLowerCase() === (user.plan || 'mlm2025').toLowerCase())
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento piani commissioni ambassador:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 🔥 API - GET COMMISSIONS FOR AMBASSADOR
app.get('/api/commissions', verifyToken, requireGuestApproval, async (req, res) => {
  try {
    console.log('💰 Richiesta commissioni per utente:', req.user.id);
    
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // Carica commissioni dal file
    const commissions = loadCommissionsFromFile();
    const userCommissions = commissions.filter(c => c.userId === currentUser.id);

    console.log(`💰 ${userCommissions.length} commissioni trovate per ${currentUser.username}`);
    
    // Calcola statistiche dettagliate
    const stats = {
      totalEarned: userCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      totalPending: userCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      totalPaid: userCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      commissionRate: currentUser.commissionRate || 0.05,
      totalCommissions: userCommissions.length,
      pendingCommissions: userCommissions.filter(c => c.status === 'pending').length,
      paidCommissions: userCommissions.filter(c => c.status === 'paid').length,
      averageCommission: userCommissions.length > 0 ? userCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0) / userCommissions.length : 0,
      thisMonth: userCommissions.filter(c => {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const commissionDate = new Date(c.date);
        return commissionDate >= monthAgo;
      }).reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      thisWeek: userCommissions.filter(c => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const commissionDate = new Date(c.date);
        return commissionDate >= weekAgo;
      }).reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      today: userCommissions.filter(c => {
        const today = new Date().toDateString();
        const commissionDate = new Date(c.date).toDateString();
        return today === commissionDate;
      }).reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
    };

    res.json({
      success: true,
      commissions: userCommissions,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Errore caricamento commissioni:', error);
    res.status(500).json({ success: false, error: 'Errore nel caricamento delle commissioni' });
  }
});

// API - Ottieni commissioni MLM dell'utente
app.get('/api/mlm/commissions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica le commissioni dal file
    const commissions = loadCommissionsFromFile();
    const userCommissions = commissions.filter(c => c.userId === userId);
    
    // Calcola statistiche
    const totalCommissions = userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = userCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = userCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
    
    // Commissioni per livello
    const commissionsByLevel = {};
    userCommissions.forEach(commission => {
      const level = commission.level;
      if (!commissionsByLevel[level]) {
        commissionsByLevel[level] = {
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }
      commissionsByLevel[level].total += commission.commissionAmount;
      commissionsByLevel[level].count += 1;
      if (commission.status === 'paid') {
        commissionsByLevel[level].paid += commission.commissionAmount;
      } else {
        commissionsByLevel[level].pending += commission.commissionAmount;
      }
    });

    // Carica il piano commissioni dell'utente
    const commissionPlans = loadCommissionPlansFromFile();
    const userPlan = commissionPlans.find(plan => plan.code.toLowerCase() === (user.plan || 'mlm2025').toLowerCase());

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        plan: userPlan,
        stats: {
          totalCommissions,
          paidCommissions,
          pendingCommissions,
          totalTransactions: userCommissions.length,
          paidTransactions: userCommissions.filter(c => c.status === 'paid').length,
          pendingTransactions: userCommissions.filter(c => c.status === 'pending').length
        },
        commissions: userCommissions,
        commissionsByLevel,
        points: user.points || 0,
        remainingPoints: userPlan ? userPlan.minPoints - (user.points || 0) : 0,
        minPoints: userPlan ? userPlan.minPoints : 0,
        minTasks: userPlan ? userPlan.minTasks : 0,
        minSales: userPlan ? userPlan.minSales : 0,
        completedTasks: user.completedTasks?.length || 0,
        totalSales: user.totalSales || 0
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento commissioni MLM:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni dati avanzati MLM
app.get('/api/mlm/commissions-advanced', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Carica le commissioni dal file
    const commissions = loadCommissionsFromFile();
    const userCommissions = commissions.filter(c => c.userId === userId);
    
    // Carica il piano commissioni dell'utente
    const commissionPlans = loadCommissionPlansFromFile();
    const userPlan = commissionPlans.find(plan => plan.code.toLowerCase() === (user.plan || 'mlm2025').toLowerCase());

    // Calcola statistiche avanzate
    const stats = {
      totalCommissions: userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      paidCommissions: userCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
      pendingCommissions: userCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
      totalTransactions: userCommissions.length,
      paidTransactions: userCommissions.filter(c => c.status === 'paid').length,
      pendingTransactions: userCommissions.filter(c => c.status === 'pending').length,
      averageCommission: userCommissions.length > 0 ? userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0) / userCommissions.length : 0,
      highestCommission: userCommissions.length > 0 ? Math.max(...userCommissions.map(c => c.commissionAmount)) : 0,
      points: user.points || 0,
      remainingPoints: userPlan ? userPlan.minPoints - (user.points || 0) : 0,
      minPoints: userPlan ? userPlan.minPoints : 0,
        minTasks: userPlan ? userPlan.minTasks : 0,
        minSales: userPlan ? userPlan.minSales : 0,
        completedTasks: user.completedTasks?.length || 0,
        totalSales: user.totalSales || 0
    };

    // Commissioni per livello
    const commissionsByLevel = {};
    userCommissions.forEach(commission => {
      const level = commission.level;
      if (!commissionsByLevel[level]) {
        commissionsByLevel[level] = {
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
          average: 0
        };
      }
      commissionsByLevel[level].total += commission.commissionAmount;
      commissionsByLevel[level].count += 1;
      if (commission.status === 'paid') {
        commissionsByLevel[level].paid += commission.commissionAmount;
      } else {
        commissionsByLevel[level].pending += commission.commissionAmount;
      }
    });

    // Calcola la media per livello
    Object.keys(commissionsByLevel).forEach(level => {
      if (commissionsByLevel[level].count > 0) {
        commissionsByLevel[level].average = commissionsByLevel[level].total / commissionsByLevel[level].count;
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        commissions: userCommissions,
        commissionsByLevel,
        plan: userPlan,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          points: user.points || 0,
          totalSales: user.totalSales || 0,
          completedTasks: user.completedTasks?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento dati MLM avanzati:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni pacchetti acquistati da un utente
app.get('/api/packages/purchased/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const purchasedPackages = user.purchasedPackages || [];

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        packages: purchasedPackages
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento pacchetti utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiungi pacchetto a un utente (Admin)
app.post('/api/admin/users/:userId/packages', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId } = req.params;
    const { packageId, packageName, cost, commissionRates, packageCode } = req.body;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono aggiungere pacchetti.'
      });
    }

    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const newPackage = {
      packageId: packageId,
      packageName: packageName,
      purchaseDate: new Date().toISOString(),
      cost: cost,
      commissionRates: commissionRates || {
        directSale: 0.1,
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      },
      code: packageCode
    };

    if (!users[userIndex].purchasedPackages) {
      users[userIndex].purchasedPackages = [];
    }

    users[userIndex].purchasedPackages.push(newPackage);
    
    // 🔥 AGGIORNA RUOLO SE PACKAGE_CODE FORNITO
    if (packageCode) {
      users[userIndex] = updateUserRoleFromPackage(users[userIndex], packageCode);
    }
    
    saveUsersToFile(users);

    console.log(`✅ Pacchetto aggiunto e ruolo aggiornato:`, {
      userId: users[userIndex].id,
      username: users[userIndex].username,
      packageName: packageName,
      newRole: users[userIndex].role,
      newLevel: users[userIndex].level
    });

    res.status(201).json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('❌ Errore aggiunta pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Rimuovi pacchetto da un utente (Admin)
app.delete('/api/admin/users/:userId/packages/:packageId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId, packageId } = req.params;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono rimuovere pacchetti.'
      });
    }

    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    if (!users[userIndex].purchasedPackages) {
      return res.status(404).json({
        success: false,
        error: 'Nessun pacchetto trovato per questo utente'
      });
    }

    const packageIndex = users[userIndex].purchasedPackages.findIndex(p => p.packageId === parseInt(packageId));

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }

    const removedPackage = users[userIndex].purchasedPackages[packageIndex];
    users[userIndex].purchasedPackages.splice(packageIndex, 1);
    saveUsersToFile(users);

    console.log(`✅ Pacchetto rimosso da ${users[userIndex].username}:`, removedPackage.packageName);

    res.json({
      success: true,
      message: 'Pacchetto rimosso con successo'
    });
  } catch (error) {
    console.error('❌ Errore rimozione pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna pacchetto di un utente (Admin)
app.put('/api/admin/users/:userId/packages/:packageId', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId, packageId } = req.params;
    const { packageName, cost, commissionRates } = req.body;

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare pacchetti.'
      });
    }

    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    if (!users[userIndex].purchasedPackages) {
      return res.status(404).json({
        success: false,
        error: 'Nessun pacchetto trovato per questo utente'
      });
    }

    const packageIndex = users[userIndex].purchasedPackages.findIndex(p => p.packageId === parseInt(packageId));

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }

    const updatedPackage = {
      ...users[userIndex].purchasedPackages[packageIndex],
      packageName: packageName || users[userIndex].purchasedPackages[packageIndex].packageName,
      cost: cost || users[userIndex].purchasedPackages[packageIndex].cost,
      commissionRates: commissionRates || users[userIndex].purchasedPackages[packageIndex].commissionRates
    };

    users[userIndex].purchasedPackages[packageIndex] = updatedPackage;
    saveUsersToFile(users);

    console.log(`✅ Pacchetto aggiornato per ${users[userIndex].username}:`, updatedPackage.packageName);

    res.json({
      success: true,
      data: updatedPackage
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Sistema di messaggistica bidirezionale Admin-Ambassador
app.post('/api/admin/send-message', verifyToken, async (req, res) => {
  try {
    const { recipientId, message, type, priority } = req.body;
    
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono inviare messaggi.'
      });
    }

    // Validazione dati
    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: recipientId, message'
      });
    }

    const users = loadUsersFromFile();
    const recipient = users.find(u => u.id === parseInt(recipientId));
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Destinatario non trovato'
      });
    }

    // Crea il messaggio
    const newMessage = {
      id: Date.now(),
      senderId: req.user.id,
      senderName: req.user.username,
      recipientId: parseInt(recipientId),
      recipientName: recipient.username,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Carica messaggi esistenti o crea array vuoto
    const messagesPath = path.join(__dirname, '../data/messages.json');
    let messages = [];
    if (fs.existsSync(messagesPath)) {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    }

    messages.push(newMessage);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      data: newMessage
    });
  } catch (error) {
    console.error('❌ Errore invio messaggio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni messaggi per utente
app.get('/api/messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const messagesPath = path.join(__dirname, '../data/messages.json');
    
    if (!fs.existsSync(messagesPath)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    const userMessages = messages.filter(m => 
      m.recipientId === userId || m.senderId === userId
    );

    res.json({
      success: true,
      data: userMessages
    });
  } catch (error) {
    console.error('❌ Errore caricamento messaggi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Segna messaggio come letto
app.put('/api/messages/:messageId/read', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const messagesPath = path.join(__dirname, '../data/messages.json');
    
    if (!fs.existsSync(messagesPath)) {
      return res.status(404).json({
        success: false,
        error: 'Nessun messaggio trovato'
      });
    }

    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    const messageIndex = messages.findIndex(m => 
      m.id === parseInt(messageId) && m.recipientId === userId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Messaggio non trovato'
      });
    }

    messages[messageIndex].isRead = true;
    messages[messageIndex].readAt = new Date().toISOString();
    
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

    res.json({
      success: true,
      message: 'Messaggio segnato come letto'
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento messaggio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ambassador invia richiesta/feedback all'admin
app.post('/api/ambassador/contact-admin', verifyToken, async (req, res) => {
  try {
    const { subject, message, type, priority } = req.body;
    
    // Verifica che l'utente sia ambassador
    if (req.user.role !== 'ambassador') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli ambassador possono contattare l\'admin.'
      });
    }

    // Validazione dati
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: subject, message'
      });
    }

    // Crea la richiesta
    const newRequest = {
      id: Date.now(),
      ambassadorId: req.user.id,
      ambassadorName: req.user.username,
      subject,
      message,
      type: type || 'request',
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Carica richieste esistenti o crea array vuoto
    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    let requests = [];
    if (fs.existsSync(requestsPath)) {
      requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    }

    requests.push(newRequest);
    fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));

    res.json({
      success: true,
      message: 'Richiesta inviata con successo',
      data: newRequest
    });
  } catch (error) {
    console.error('❌ Errore invio richiesta:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Admin ottiene richieste ambassador
app.get('/api/admin/ambassador-requests', verifyToken, async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono visualizzare le richieste.'
      });
    }

    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    
    if (!fs.existsSync(requestsPath)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('❌ Errore caricamento richieste:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ambassador ottiene le proprie richieste
app.get('/api/ambassador/requests', verifyToken, async (req, res) => {
  try {
    // Verifica che l'utente sia ambassador
    if (req.user.role !== 'ambassador') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli ambassador possono visualizzare le proprie richieste.'
      });
    }

    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    
    if (!fs.existsSync(requestsPath)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    const userRequests = requests.filter(r => r.ambassadorId === req.user.id);
    
    res.json({
      success: true,
      data: userRequests
    });
  } catch (error) {
    console.error('❌ Errore caricamento richieste ambassador:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Admin risponde a richiesta ambassador
app.put('/api/admin/ambassador-requests/:requestId/respond', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response, status } = req.body;
    
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono rispondere alle richieste.'
      });
    }

    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    
    if (!fs.existsSync(requestsPath)) {
      return res.status(404).json({
        success: false,
        error: 'Nessuna richiesta trovata'
      });
    }

    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    const requestIndex = requests.findIndex(r => r.id === parseInt(requestId));

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta non trovata'
      });
    }

    // Aggiorna la richiesta
    requests[requestIndex].adminResponse = response;
    requests[requestIndex].status = status || 'responded';
    requests[requestIndex].respondedAt = new Date().toISOString();
    requests[requestIndex].adminId = req.user.id;
    requests[requestIndex].adminName = req.user.username;
    
    fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));

    res.json({
      success: true,
      message: 'Risposta inviata con successo',
      data: requests[requestIndex]
    });
  } catch (error) {
    console.error('❌ Errore risposta richiesta:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Notifiche in tempo reale per utente
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationsPath = path.join(__dirname, '../data/notifications.json');
    
    if (!fs.existsSync(notificationsPath)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
    const userNotifications = notifications.filter(n => n.userId === userId);

    res.json({
      success: true,
      data: userNotifications
    });
  } catch (error) {
    console.error('❌ Errore caricamento notifiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Lista richieste admin (Admin)
app.get('/api/admin/requests', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    
    if (!fs.existsSync(requestsPath)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    
    // Ordina per data più recente
    const sortedRequests = requests.sort((a, b) => 
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json({
      success: true,
      data: sortedRequests
    });
  } catch (error) {
    console.error('❌ Errore caricamento richieste admin:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Rispondi a richiesta (Admin)
app.put('/api/admin/requests/:requestId/respond', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response, status } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        error: 'Risposta richiesta'
      });
    }

    const requestsPath = path.join(__dirname, '../data/admin-requests.json');
    
    if (!fs.existsSync(requestsPath)) {
      return res.status(404).json({
        success: false,
        error: 'Nessuna richiesta trovata'
      });
    }

    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta non trovata'
      });
    }

    // Aggiorna la richiesta
    requests[requestIndex].response = response;
    requests[requestIndex].status = status || 'responded';
    requests[requestIndex].respondedAt = new Date().toISOString();
    requests[requestIndex].respondedBy = req.user.id;

    fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));

    res.json({
      success: true,
      message: 'Risposta inviata con successo',
      data: requests[requestIndex]
    });
  } catch (error) {
    console.error('❌ Errore risposta richiesta:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Invia messaggio da admin (Admin)
app.post('/api/admin/send-message', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { recipientId, message, type, priority } = req.body;
    
    // Validazione dati
    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: recipientId, message'
      });
    }

    const users = loadUsersFromFile();
    const recipient = users.find(u => u.id === parseInt(recipientId));
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Destinatario non trovato'
      });
    }

    // Crea il messaggio
    const newMessage = {
      id: Date.now(),
      senderId: req.user.id,
      senderName: req.user.username,
      recipientId: parseInt(recipientId),
      recipientName: recipient.username,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Carica messaggi esistenti o crea array vuoto
    const messagesPath = path.join(__dirname, '../data/messages.json');
    let messages = [];
    if (fs.existsSync(messagesPath)) {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    }

    messages.push(newMessage);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      data: newMessage
    });
  } catch (error) {
    console.error('❌ Errore invio messaggio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - CRUD Commissioni (Admin)
// GET - Lista tutte le commissioni
app.get('/api/admin/commissions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const commissions = loadCommissionsFromFile();
    const users = loadUsersFromFile();
    
    // Aggiungi informazioni utente alle commissioni
    const commissionsWithUserInfo = commissions.map(commission => {
      const user = users.find(u => u.id === commission.userId);
      return {
        ...commission,
        userEmail: user?.email || '',
        userRole: user?.role || '',
        userStatus: user?.isActive ? 'active' : 'inactive'
      };
    });

    res.json({
      success: true,
      data: commissionsWithUserInfo
    });
  } catch (error) {
    console.error('❌ Errore caricamento commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// POST - Crea nuova commissione
app.post('/api/admin/commissions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId, type, amount, commissionRate, description, status, level, plan } = req.body;
    
    // Validazione dati
    if (!userId || !type || !amount || !commissionRate) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: userId, type, amount, commissionRate'
      });
    }

    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Calcola commissione
    const commissionAmount = amount * commissionRate;

    // Crea commissione
    const newCommission = {
      id: Date.now(),
      userId: parseInt(userId),
      ambassadorName: user.username,
      type: type || 'direct_sale',
      amount: parseFloat(amount),
      commissionRate: parseFloat(commissionRate),
      commissionAmount: parseFloat(commissionAmount),
      status: status || 'pending',
      date: new Date().toISOString(),
      description: description || 'Commissione creata manualmente',
      level: level || 0,
      plan: plan || 'manual'
    };

    // Carica commissioni esistenti
    const commissions = loadCommissionsFromFile();
    commissions.push(newCommission);
    saveCommissionsToFile(commissions);

    // Aggiorna totalCommissions dell'utente
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    if (userIndex !== -1) {
      users[userIndex].totalCommissions = (users[userIndex].totalCommissions || 0) + commissionAmount;
      saveUsersToFile(users);
    }

    res.json({
      success: true,
      message: 'Commissione creata con successo',
      data: newCommission
    });
  } catch (error) {
    console.error('❌ Errore creazione commissione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// PUT - Aggiorna commissione
app.put('/api/admin/commissions/:commissionId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { type, amount, commissionRate, description, status, level, plan } = req.body;
    
    const commissions = loadCommissionsFromFile();
    const commissionIndex = commissions.findIndex(c => c.id === parseInt(commissionId));
    
    if (commissionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Commissione non trovata'
      });
    }

    const oldCommission = commissions[commissionIndex];
    const oldAmount = oldCommission.commissionAmount;

    // Aggiorna commissione
    commissions[commissionIndex] = {
      ...oldCommission,
      type: type || oldCommission.type,
      amount: parseFloat(amount) || oldCommission.amount,
      commissionRate: parseFloat(commissionRate) || oldCommission.commissionRate,
      commissionAmount: parseFloat(amount || oldCommission.amount) * parseFloat(commissionRate || oldCommission.commissionRate),
      status: status || oldCommission.status,
      description: description || oldCommission.description,
      level: level || oldCommission.level,
      plan: plan || oldCommission.plan,
      updatedAt: new Date().toISOString()
    };

    const newAmount = commissions[commissionIndex].commissionAmount;

    saveCommissionsToFile(commissions);

    // Aggiorna totalCommissions dell'utente
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === oldCommission.userId);
    if (userIndex !== -1) {
      users[userIndex].totalCommissions = (users[userIndex].totalCommissions || 0) - oldAmount + newAmount;
      saveUsersToFile(users);
    }

    res.json({
      success: true,
      message: 'Commissione aggiornata con successo',
      data: commissions[commissionIndex]
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento commissione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// DELETE - Elimina commissione
app.delete('/api/admin/commissions/:commissionId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { commissionId } = req.params;
    
    const commissions = loadCommissionsFromFile();
    const commissionIndex = commissions.findIndex(c => c.id === parseInt(commissionId));
    
    if (commissionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Commissione non trovata'
      });
    }

    const commission = commissions[commissionIndex];
    const commissionAmount = commission.commissionAmount;

    // Rimuovi commissione
    commissions.splice(commissionIndex, 1);
    saveCommissionsToFile(commissions);

    // Aggiorna totalCommissions dell'utente
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === commission.userId);
    if (userIndex !== -1) {
      users[userIndex].totalCommissions = Math.max(0, (users[userIndex].totalCommissions || 0) - commissionAmount);
      saveUsersToFile(users);
    }

    res.json({
      success: true,
      message: 'Commissione eliminata con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione commissione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Debug commissioni (solo per sviluppo)
app.get('/api/admin/debug/commissions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const commissions = loadCommissionsFromFile();
    const totalCommissions = commissions.reduce((sum, commission) => sum + (commission.commissionAmount || 0), 0);
    
    res.json({
      success: true,
      data: {
        totalCommissions,
        commissionCount: commissions.length,
        commissions: commissions.map(c => ({
          id: c.id,
          amount: c.amount,
          commissionAmount: c.commissionAmount,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('❌ Errore debug commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Debug vendite mensili (solo per sviluppo)
app.get('/api/admin/debug/monthly-sales', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const sales = loadSales();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales = sales
      .filter(sale => {
        const saleDate = new Date(sale.date || sale.createdAt || 0);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + (sale.amount || sale.total || 0), 0);
    
    const monthlySalesList = sales
      .filter(sale => {
        const saleDate = new Date(sale.date || sale.createdAt || 0);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .map(sale => ({
        id: sale.id,
        amount: sale.amount,
        date: sale.date,
        username: sale.username,
        description: sale.description
      }));
    
    res.json({
      success: true,
      data: {
        monthlySales,
        currentMonth,
        currentYear,
        totalSales: sales.length,
        monthlySalesList
      }
    });
  } catch (error) {
    console.error('❌ Errore debug vendite mensili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Autorizza pacchetto per tutti gli ambassador
app.put('/api/admin/packages/:packageId/authorize', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { packageId } = req.params;
    const { isAuthorized } = req.body;
    
    const commissionPlans = loadCommissionPlansFromFile();
    const planIndex = commissionPlans.findIndex(p => p.id === parseInt(packageId));
    
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }
    
    // Aggiorna lo stato di autorizzazione
    commissionPlans[planIndex].isAuthorized = isAuthorized;
    
    // Salva le modifiche
    saveCommissionPlansToFile(commissionPlans);
    
    res.json({
      success: true,
      message: `Pacchetto ${isAuthorized ? 'autorizzato' : 'disautorizzato'} con successo`,
      data: {
        packageId: parseInt(packageId),
        isAuthorized: isAuthorized
      }
    });
  } catch (error) {
    console.error('❌ Errore autorizzazione pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Autorizza pagamento commissioni per tutti gli ambassador
app.put('/api/admin/commission-payment/authorize', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { isPaymentAuthorized } = req.body;
    
    // Carica le impostazioni globali (creiamo un file per questo)
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/settings.json');
    
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    // Aggiorna lo stato di autorizzazione pagamento
    settings.isPaymentAuthorized = isPaymentAuthorized;
    
    // Salva le impostazioni
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    res.json({
      success: true,
      message: `Pagamento commissioni ${isPaymentAuthorized ? 'autorizzato' : 'disautorizzato'} con successo`,
      data: {
        isPaymentAuthorized: isPaymentAuthorized
      }
    });
  } catch (error) {
    console.error('❌ Errore autorizzazione pagamento commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni stato autorizzazione pagamento commissioni
app.get('/api/admin/commission-payment/authorization-status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/settings.json');
    
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    res.json({
      success: true,
      data: {
        isPaymentAuthorized: settings.isPaymentAuthorized || false
      }
    });
  } catch (error) {
    console.error('❌ Errore stato autorizzazione pagamento commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni stato autorizzazione pagamento commissioni (per ambassador)
app.get('/api/ambassador/commission-payment/authorization-status', verifyToken, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/settings.json');
    
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    // Controlla anche l'autorizzazione individuale dell'utente
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(req.user.userId));
    const userPaymentAuthorized = user ? (user.isPaymentAuthorized || false) : false;
    

    
    res.json({
      success: true,
      data: {
        isPaymentAuthorized: settings.isPaymentAuthorized || false,
        userPaymentAuthorized: userPaymentAuthorized
      }
    });
  } catch (error) {
    console.error('❌ Errore stato autorizzazione pagamento commissioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni lista utenti con stato autorizzazione pagamento
app.get('/api/admin/users/payment-authorization', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = loadUsersFromFile();
    const ambassadorUsers = users.filter(user => user.role === 'ambassador' || user.role === 'entry_ambassador');
    
    const usersWithPaymentStatus = ambassadorUsers.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isPaymentAuthorized: user.isPaymentAuthorized || false,
      totalCommissions: user.totalCommissions || 0,
      lastLogin: user.lastLogin
    }));
    
    res.json({
      success: true,
      data: usersWithPaymentStatus
    });
  } catch (error) {
    console.error('❌ Errore caricamento utenti autorizzazione pagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Cambia autorizzazione pagamento per utente specifico
app.put('/api/admin/users/:userId/payment-authorization', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPaymentAuthorized } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Aggiorna l'autorizzazione dell'utente
    users[userIndex].isPaymentAuthorized = isPaymentAuthorized;
    
    // Salva le modifiche
    saveUsersToFile(users);
    
    res.json({
      success: true,
      message: `Autorizzazione pagamento ${isPaymentAuthorized ? 'abilitata' : 'disabilitata'} per ${users[userIndex].username}`,
      data: {
        userId: parseInt(userId),
        username: users[userIndex].username,
        isPaymentAuthorized: isPaymentAuthorized
      }
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento autorizzazione pagamento utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni stato autorizzazione pacchetti
app.get('/api/admin/packages/authorization-status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const commissionPlans = loadCommissionPlansFromFile();
    
    const authorizationStatus = commissionPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      isAuthorized: plan.isAuthorized || false,
      isActive: plan.isActive
    }));
    
    res.json({
      success: true,
      data: authorizationStatus
    });
  } catch (error) {
    console.error('❌ Errore stato autorizzazione pacchetti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Crea notifica per utente
app.post('/api/admin/create-notification', verifyToken, async (req, res) => {
  try {
    const { userId, title, message, type, priority } = req.body;
    
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono creare notifiche.'
      });
    }

    // Validazione dati
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti. Richiesti: userId, title, message'
      });
    }

    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Crea la notifica
    const newNotification = {
      id: Date.now(),
      userId: parseInt(userId),
      title,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Carica notifiche esistenti o crea array vuoto
    const notificationsPath = path.join(__dirname, '../data/notifications.json');
    let notifications = [];
    if (fs.existsSync(notificationsPath)) {
      notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
    }

    notifications.push(newNotification);
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));

    res.json({
      success: true,
      message: 'Notifica creata con successo',
      data: newNotification
    });
  } catch (error) {
    console.error('❌ Errore creazione notifica:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Endpoint per ottenere l'albero della rete MLM (Admin)
app.get('/api/admin/network-tree', verifyToken, requireRole('admin'), (req, res) => {
  try {
    console.log('🌳 Admin: Richiesta albero rete MLM');
    
    const users = loadUsersFromFile();
    
    // Funzione per costruire l'albero della rete
    const buildNetworkTree = (users) => {
      const userMap = new Map();
      const rootUsers = [];
      
      // Prima passata: crea mappa utenti
      users.forEach(user => {
        userMap.set(user.id, {
          ...user,
          children: []
        });
      });
      
      // Seconda passata: costruisci relazioni padre-figlio
      users.forEach(user => {
        const userNode = userMap.get(user.id);
        
        if (user.sponsorId && userMap.has(user.sponsorId)) {
          // Aggiungi come figlio dello sponsor
          const sponsorNode = userMap.get(user.sponsorId);
          sponsorNode.children.push(userNode);
        } else {
          // Utente senza sponsor o sponsor non trovato -> utente root
          rootUsers.push(userNode);
        }
      });
      
      return rootUsers;
    };
    
    const networkTree = buildNetworkTree(users);
    console.log(`📊 Albero rete costruito: ${networkTree.length} utenti root`);
    
    res.json(networkTree);
  } catch (error) {
    console.error('❌ Errore costruzione albero rete:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella costruzione dell\'albero della rete'
    });
  }
});

// Endpoint per ottenere la rete MLM personale (Ambassador)
app.get('/api/mlm/network', verifyToken, (req, res) => {
  try {
    console.log('🌳 Ambassador: Richiesta rete MLM personale');
    
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Funzione per costruire la rete personale dell'ambassador
    const buildPersonalNetwork = (users, ambassadorId) => {
      const userMap = new Map();
      const ambassadorNode = null;
      
      // Prima passata: crea mappa utenti
      users.forEach(user => {
        userMap.set(user.id, {
          ...user,
          children: []
        });
      });
      
      // Trova l'ambassador e i suoi figli diretti
      const ambassador = userMap.get(ambassadorId);
      if (!ambassador) {
        return null;
      }
      
      // Trova tutti i figli diretti dell'ambassador
      const directChildren = users.filter(user => user.sponsorId === ambassadorId);
      
      // Aggiungi i figli diretti all'ambassador
      directChildren.forEach(child => {
        const childNode = userMap.get(child.id);
        ambassador.children.push(childNode);
      });
      
      return ambassador;
    };
    
    const personalNetwork = buildPersonalNetwork(users, currentUser.id);
    console.log(`📊 Rete personale costruita per ${currentUser.username}: ${personalNetwork?.children?.length || 0} figli diretti`);
    
    res.json(personalNetwork);
  } catch (error) {
    console.error('❌ Errore costruzione rete personale:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella costruzione della rete personale'
    });
  }
});

// Endpoint per ottenere lo status KYC personale (Ambassador)
app.get('/api/kyc/status', verifyToken, (req, res) => {
  try {
    console.log('🆔 Ambassador: Richiesta status KYC personale');
    
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Carica i dati KYC esistenti
    const kycPath = path.join(__dirname, '../data/kyc.json');
    let kycSubmissions = [];
    if (fs.existsSync(kycPath)) {
      kycSubmissions = JSON.parse(fs.readFileSync(kycPath, 'utf8'));
    }
    
    // Trova il KYC dell'utente corrente
    const userKYC = kycSubmissions.find(kyc => kyc.userId === currentUser.id);
    
    const kycData = {
      userId: currentUser.id,
      username: currentUser.username,
      status: userKYC ? userKYC.status : 'not_submitted',
      submittedAt: userKYC ? userKYC.submittedAt : null,
      documents: userKYC ? userKYC.documents : [],
      personalInfo: userKYC ? userKYC.personalInfo : null,
      isComplete: userKYC ? userKYC.isComplete : false
    };
    
    console.log(`📊 Status KYC per ${currentUser.username}: ${kycData.status}`);
    
    res.json({
      success: true,
      kyc: kycData
    });
  } catch (error) {
    console.error('❌ Errore caricamento status KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento dello status KYC'
    });
  }
});

// Endpoint per ottenere i referral dell'utente
app.get('/api/referrals', verifyToken, (req, res) => {
  try {
    console.log('👥 Richiesta referral per utente:', req.user.id);
    
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Trova tutti i referral dell'utente (utenti che hanno questo utente come sponsor)
    const userReferrals = users.filter(user => user.sponsorId === currentUser.id);
    
    // Carica i dati referral esistenti
    const referralsPath = path.join(__dirname, '../data/referrals.json');
    let referralsData = [];
    if (fs.existsSync(referralsPath)) {
      referralsData = JSON.parse(fs.readFileSync(referralsPath, 'utf8'));
    }
    
    // Combina i dati utente con i dati referral
    const referrals = userReferrals.map(referral => {
      const referralData = referralsData.find(r => r.userId === referral.id) || {};
      return {
        id: referral.id,
        username: referral.username,
        firstName: referral.firstName,
        lastName: referral.lastName,
        email: referral.email,
        role: referral.role,
        isActive: referral.isActive,
        joinDate: referral.joinDate,
        referralCode: referral.referralCode,
        sponsorId: referral.sponsorId,
        // Dati aggiuntivi dal file referrals.json
        status: referralData.status || 'active',
        commissionEarned: referralData.commissionEarned || 0,
        lastActivity: referralData.lastActivity || referral.joinDate,
        notes: referralData.notes || ''
      };
    });
    
    console.log(`📊 ${referrals.length} referral trovati per ${currentUser.username}`);
    
    res.json({
      success: true,
      referrals: referrals,
      stats: {
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter(r => r.isActive).length,
        totalCommissionEarned: referrals.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
        averageCommissionPerReferral: referrals.length > 0 ? 
          referrals.reduce((sum, r) => sum + (r.commissionEarned || 0), 0) / referrals.length : 0
      }
    });
  } catch (error) {
    console.error('❌ Errore caricamento referral:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento dei referral'
    });
  }
});

// Endpoint per inviare inviti referral
app.post('/api/referrals/invite', verifyToken, (req, res) => {
  try {
    console.log('📧 Richiesta invito referral');
    
    const { email, firstName, lastName } = req.body;
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Validazione input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Tutti i campi sono obbligatori'
      });
    }
    
    // Verifica che l'email non sia già registrata
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Un utente con questa email è già registrato'
      });
    }
    
    // Simula l'invio dell'invito
    console.log(`📧 Invito inviato a ${email} da ${currentUser.username}`);
    console.log(`📧 Codice referral: ${currentUser.referralCode}`);
    
    // In un sistema reale, qui si invierebbe una email
    // Per ora, simuliamo il successo
    
    res.json({
      success: true,
      message: 'Invito inviato con successo',
      data: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        referralCode: currentUser.referralCode,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Errore invio invito:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio dell\'invito'
    });
  }
});

// Endpoint per ottenere i piani disponibili
app.get('/api/plans', (req, res) => {
  try {
    console.log('📦 Richiesta piani disponibili');
    
    // Carica i piani ufficiali di Wash The World
    const plansPath = path.join(__dirname, '../data/commission-plans.json');
    let plans = [];
    
    if (fs.existsSync(plansPath)) {
      const plansData = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
      
      // Converti i piani nel formato richiesto dal frontend
      plans = plansData.filter(plan => plan.isActive && plan.isAuthorized).map(plan => ({
        id: plan.code.toLowerCase(),
        name: plan.name,
        description: plan.description,
        price: plan.cost,
        currency: 'EUR',
        features: [
          `Commissione diretta: ${(plan.directSale * 100).toFixed(1)}%`,
          `Livello 1: ${(plan.level1 * 100).toFixed(1)}%`,
          `Livello 2: ${(plan.level2 * 100).toFixed(1)}%`,
          `Livello 3: ${(plan.level3 * 100).toFixed(1)}%`,
          `Livello 4: ${(plan.level4 * 100).toFixed(1)}%`,
          `Livello 5: ${(plan.level5 * 100).toFixed(1)}%`,
          `Punti minimi: ${plan.minPoints}`,
          `Task minimi: ${plan.minTasks}`,
          `Vendite minime: €${plan.minSales}`
        ],
        duration: 'Permanente',
        popular: plan.code === 'MLM_AMBASSADOR', // Il piano MLM è il più popolare
        originalData: plan // Mantieni i dati originali per riferimento
      }));
    }
    
    console.log(`📊 ${plans.length} piani ufficiali caricati`);
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('❌ Errore caricamento piani:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento dei piani'
    });
  }
});

// Endpoint per selezionare un piano
app.post('/api/plans/select', verifyToken, (req, res) => {
  try {
    console.log('📦 Richiesta selezione piano');
    
    const { planId, paymentMethod } = req.body;
    const users = loadUsersFromFile();
    const currentUser = users.find(u => u.id === req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Carica i piani ufficiali per trovare quello selezionato
    const plansPath = path.join(__dirname, '../data/commission-plans.json');
    let plans = [];
    
    if (fs.existsSync(plansPath)) {
      plans = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
    }
    
    const selectedPlan = plans.find(plan => plan.code.toLowerCase() === planId);
    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        error: 'Piano non trovato'
      });
    }
    
    console.log(`📊 Utente ${currentUser.username} seleziona piano ${planId} con metodo ${paymentMethod}`);
    
    // Simula il processo di pagamento
    if (paymentMethod === 'bank_transfer') {
      // Per bonifico, restituisce i dettagli bancari
      res.json({
        success: true,
        data: {
          type: 'bank_transfer',
          bankDetails: {
            accountName: 'Wash The World SRL',
            accountNumber: 'IT60 X054 2811 1010 0000 0123 456',
            bankName: 'Banca Popolare di Milano',
            swiftCode: 'BPMIITMM',
            iban: 'IT60 X054 2811 1010 0000 0123 456',
            amount: selectedPlan.price,
            currency: 'EUR',
            reference: `WTW-${currentUser.id}-${Date.now()}`
          }
        }
      });
    } else {
      // Per altri metodi, restituisce URL di checkout (simulato)
      res.json({
        success: true,
        data: {
          type: 'checkout',
          checkoutUrl: `https://checkout.washtheworld.org/payment?plan=${planId}&user=${currentUser.id}&amount=${selectedPlan.price}`
        }
      });
    }
  } catch (error) {
    console.error('❌ Errore selezione piano:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la selezione del piano'
    });
  }
});

// Endpoint per aggiornamento profilo
app.put('/api/auth/update-profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, country, birthDate, fiscalCode } = req.body;
    const userId = req.user.id;

    // Carica gli utenti
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }

    // Aggiorna i dati del profilo
    users[userIndex] = {
      ...users[userIndex],
      firstName: firstName || users[userIndex].firstName,
      lastName: lastName || users[userIndex].lastName,
      email: email || users[userIndex].email,
      phone: phone || users[userIndex].phone,
      address: address || users[userIndex].address,
      city: city || users[userIndex].city,
      country: country || users[userIndex].country,
      birthDate: birthDate || users[userIndex].birthDate,
      fiscalCode: fiscalCode || users[userIndex].fiscalCode,
      updatedAt: new Date().toISOString()
    };

    // Salva gli utenti
    saveUsersToFile(users);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: users[userIndex]
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento profilo:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// Avvia il server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Credenziali: testuser / password`);
  console.log(`🎬 Quiz test: GET http://localhost:${PORT}/api/tasks/2/quiz`);
}); 

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const token = req.url.split('token=')[1];
  
  if (!token) {
    ws.close();
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    
    // Salva la connessione per l'utente
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, []);
    }
    activeConnections.get(userId).push(ws);
    
    console.log(`🔗 WebSocket connesso per utente: ${userId}`);
    
    // Gestione disconnessione
    ws.on('close', () => {
      const userConnections = activeConnections.get(userId) || [];
      const index = userConnections.indexOf(ws);
      if (index > -1) {
        userConnections.splice(index, 1);
      }
      if (userConnections.length === 0) {
        activeConnections.delete(userId);
      }
      console.log(`🔌 WebSocket disconnesso per utente: ${userId}`);
    });
    
  } catch (error) {
    console.error('❌ Errore autenticazione WebSocket:', error);
    ws.close();
  }
});

// Upgrade HTTP a WebSocket
app.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Funzione per inviare notifiche a tutti i client
function broadcastNotification(type, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// Funzione per inviare notifica a utente specifico
function sendNotificationToUser(userId, type, data) {
  const userConnections = activeConnections.get(userId) || [];
  userConnections.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// TEST - Crea commissioni di esempio per testing
app.post('/api/admin/test/create-sample-commissions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = loadUsersFromFile();
    const ambassadors = users.filter(u => u.role === 'ambassador');
    const commissions = loadCommissionsFromFile();
    
    const sampleCommissions = [
      {
        id: Date.now() + 1,
        userId: 2, // Gianni 62
        ambassadorName: "Gianni 62",
        type: "direct_sale",
        amount: 150.00,
        commissionRate: 0.1,
        commissionAmount: 15.00,
        status: "paid",
        date: new Date().toISOString(),
        description: "Commissione vendita WELCOME KIT MLM - Gianni 62",
        level: 1,
        plan: "mlm2025"
      },
      {
        id: Date.now() + 2,
        userId: 2, // Gianni 62
        ambassadorName: "Gianni 62",
        type: "referral",
        amount: 200.00,
        commissionRate: 0.05,
        commissionAmount: 10.00,
        status: "pending",
        date: new Date().toISOString(),
        description: "Commissione referral - Gianni 62",
        level: 1,
        plan: "mlm2025"
      },
      {
        id: Date.now() + 3,
        userId: 3, // PAPA1
        ambassadorName: "PAPA1",
        type: "direct_sale",
        amount: 300.00,
        commissionRate: 0.1,
        commissionAmount: 30.00,
        status: "paid",
        date: new Date().toISOString(),
        description: "Commissione vendita Ambassador PENTAGAME - PAPA1",
        level: 2,
        plan: "mlm2025"
      },
      {
        id: Date.now() + 4,
        userId: 4, // FIGLIO1
        ambassadorName: "FIGLIO1",
        type: "direct_sale",
        amount: 100.00,
        commissionRate: 0.1,
        commissionAmount: 10.00,
        status: "pending",
        date: new Date().toISOString(),
        description: "Commissione vendita WELCOME KIT - FIGLIO1",
        level: 1,
        plan: "mlm2025"
      }
    ];
    
    // Aggiungi le commissioni di esempio
    sampleCommissions.forEach(commission => {
      commissions.push(commission);
    });
    
    saveCommissionsToFile(commissions);
    
    res.json({
      success: true,
      message: 'Commissioni di esempio create con successo',
      data: sampleCommissions
    });
  } catch (error) {
    console.error('❌ Errore creazione commissioni di esempio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// TEST - Crea vendite di esempio per testing
app.post('/api/admin/test/create-sample-sales', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const sales = loadSales();
    
    const sampleSales = [
      {
        saleId: "SALE_TEST_1",
        ambassadorId: 2,
        customerName: "Cliente Test 1",
        customerEmail: "cliente1@test.com",
        products: ["WELCOME KIT MLM"],
        totalAmount: 150,
        commissionRate: 0.1,
        commissionAmount: 15,
        status: "completed",
        notes: "Vendita di test per Gianni 62",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        saleId: "SALE_TEST_2",
        ambassadorId: 3,
        customerName: "Cliente Test 2",
        customerEmail: "cliente2@test.com",
        products: ["Ambassador PENTAGAME"],
        totalAmount: 300,
        commissionRate: 0.1,
        commissionAmount: 30,
        status: "completed",
        notes: "Vendita di test per PAPA1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        saleId: "SALE_TEST_3",
        ambassadorId: 4,
        customerName: "Cliente Test 3",
        customerEmail: "cliente3@test.com",
        products: ["WELCOME KIT PENTAGAME"],
        totalAmount: 100,
        commissionRate: 0.1,
        commissionAmount: 10,
        status: "pending",
        notes: "Vendita di test per FIGLIO1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Aggiungi le vendite di esempio
    sampleSales.forEach(sale => {
      sales.push(sale);
    });
    
    saveSales(sales);
    
    res.json({
      success: true,
      message: 'Vendite di esempio create con successo',
      data: sampleSales
    });
  } catch (error) {
    console.error('❌ Errore creazione vendite di esempio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Funzione per verificare se un guest è stato approvato dall'admin
function requireGuestApproval(req, res, next) {
  const user = req.user;
  
  if (user.role === 'guest') {
    // Verifica se il guest è stato approvato dall'admin
    if (!user.adminApproved || user.state !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Il tuo account è in attesa di approvazione da parte dell\'amministratore.'
      });
    }
  }
  
  next();
}

// ==================== AUTHENTICATION ====================