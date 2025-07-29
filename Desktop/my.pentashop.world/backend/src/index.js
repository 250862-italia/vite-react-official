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
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
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

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Credenziali: testuser / password`);
  console.log(`🎬 Quiz test: GET http://localhost:${PORT}/api/tasks/2/quiz`);
}); 