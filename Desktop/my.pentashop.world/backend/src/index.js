const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: { error: 'Troppe richieste da questo IP, riprova più tardi.' }
});
app.use(limiter);

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
  } catch (error) {
    console.error('❌ Errore salvataggio utenti:', error);
  }
}

function saveTasksToFile(tasks) {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('❌ Errore salvataggio task:', error);
  }
}

// Verifica token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Token di accesso richiesto'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token di accesso richiesto'
    });
  }
  
  try {
    // Per ora usiamo un token semplice per sviluppo
    if (token.startsWith('test-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const timestamp = parseInt(parts[4]);
      
      // Verifica che il token non sia scaduto (24 ore)
      const now = Date.now();
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        return res.status(401).json({
          success: false,
          error: 'Token scaduto'
        });
      }
      
      const users = loadUsersFromFile();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utente non trovato'
        });
      }
      
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }
  } catch (error) {
    console.error('❌ Errore verifica token:', error);
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
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

// API - Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password sono richiesti'
      });
    }
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }
    
    const token = `test-jwt-token-${user.id}-${Date.now()}`;
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Dashboard
app.get('/api/dashboard', verifyToken, (req, res) => {
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
      videoUrl: task.content.videoUrl || '',
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
    
    const surveyData = {
      id: task.id,
      title: task.title,
      description: task.description,
      questions: task.content.surveyQuestions || [],
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
    
    user.updatedAt = new Date().toISOString();
    saveUsersToFile(users);
    
    res.json({
      success: true,
      data: {
        message: 'Task completato con successo',
        rewards: task.rewards,
        updatedUser: {
          points: user.points,
          tokens: user.tokens,
          experience: user.experience,
          completedTasks: user.completedTasks
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
      city
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
app.get('/api/admin/kyc', verifyToken, (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere.'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    const users = loadUsersFromFile();

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

    console.log('📋 Admin: Richiesta lista KYC');
    console.log('📊 KYC disponibili:', enrichedKYC.length);

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
    const kyc = kycSubmissions.find(k => k.kycId === kycId);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }

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

    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono modificare lo stato KYC.'
      });
    }

    // Validazione status
    const validStatuses = ['approved', 'rejected', 'pending', 'paused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Stato non valido. Stati permessi: approved, rejected, pending, paused'
      });
    }

    const kycSubmissions = loadKYCSubmissions();
    const kycIndex = kycSubmissions.findIndex(k => k.kycId === kycId);

    if (kycIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }

    const kyc = kycSubmissions[kycIndex];
    const oldStatus = kyc.status;

    // Aggiorna lo stato
    kyc.status = status;
    kyc.processedAt = new Date().toISOString();
    kyc.processedBy = req.user.id;
    if (notes) {
      kyc.adminNotes = notes;
    }

    // Se approvato, aggiorna l'utente
    if (status === 'approved' && oldStatus !== 'approved') {
      const users = loadUsersFromFile();
      const userIndex = users.findIndex(u => u.id === kyc.userId);
      
      if (userIndex !== -1) {
        users[userIndex].isKYCApproved = true;
        users[userIndex].kycApprovedAt = new Date().toISOString();
        users[userIndex].updatedAt = new Date().toISOString();
        saveUsersToFile(users);
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
    const kycIndex = kycSubmissions.findIndex(k => k.kycId === kycId);

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

// API - Ottieni tutte le vendite (Admin)
app.get('/api/admin/sales', verifyToken, (req, res) => {
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
      commissionAmount: parseFloat(totalAmount) * (commissionRate || ambassador.commissionRate || 0.05),
      status: status || 'pending',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sales.push(newSale);

    if (saveSales(sales)) {
      console.log(`✅ Admin: Creata vendita ${newSale.saleId} da ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          message: 'Vendita creata con successo',
          sale: newSale
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
      sale.commissionAmount = sale.totalAmount * (sale.commissionRate || ambassador?.commissionRate || 0.05);
    }
    if (commissionRate !== undefined) {
      sale.commissionRate = parseFloat(commissionRate);
      sale.commissionAmount = sale.totalAmount * sale.commissionRate;
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
      totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalCommissions: sales.reduce((sum, sale) => sum + sale.commissionAmount, 0),
      pending: sales.filter(s => s.status === 'pending').length,
      completed: sales.filter(s => s.status === 'completed').length,
      cancelled: sales.filter(s => s.status === 'cancelled').length,
      today: sales.filter(s => {
        const today = new Date().toDateString();
        const saleDate = new Date(s.createdAt).toDateString();
        return today === saleDate;
      }).length,
      thisWeek: sales.filter(s => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const saleDate = new Date(s.createdAt);
        return saleDate >= weekAgo;
      }).length,
      thisMonth: sales.filter(s => {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const saleDate = new Date(s.createdAt);
        return saleDate >= monthAgo;
      }).length,
      averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0
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

// API - Lista utenti (Admin)
app.get('/api/admin/users', verifyToken, (req, res) => {
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
app.get('/api/admin/tasks', verifyToken, (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli amministratori possono accedere alla lista task.'
      });
    }

    const tasks = loadTasksFromFile();

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

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Credenziali: testuser / password`);
  console.log(`🎬 Quiz test: GET http://localhost:${PORT}/api/tasks/2/quiz`);
}); 