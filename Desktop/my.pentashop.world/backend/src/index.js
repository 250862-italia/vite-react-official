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
    user: 'info@washtw.com', // Sostituire con credenziali reali
    pass: 'password123' // Sostituire con password reale
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

// Rate limiting - Configurazione più permissiva per sviluppo
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // limite molto alto per sviluppo
  message: {
    error: 'Troppe richieste da questo IP, riprova più tardi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Salta il rate limiting per richieste localhost
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

// Funzione per verificare il token JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }
  
  try {
    // Per ora usiamo una verifica semplice del token
    // In produzione dovremmo verificare il JWT con jwt.verify()
    if (token.startsWith('test-jwt-token-')) {
      // Estrai ID utente e timestamp dal token
      const tokenParts = token.replace('test-jwt-token-', '').split('-');
      let userId = null;
      let timestamp = null;
      
      // Gestisce sia il formato nuovo (ID-timestamp) che vecchio (solo timestamp)
      if (tokenParts.length >= 2) {
        userId = parseInt(tokenParts[0]);
        timestamp = tokenParts[1];
        console.log('🔍 Token userId:', userId, 'timestamp:', timestamp);
      } else {
        // Formato vecchio: solo timestamp
        timestamp = tokenParts[0];
        console.log('🔍 Token formato vecchio, timestamp:', timestamp);
      }
      
      // Carica gli utenti per determinare il ruolo
      const users = usersCRUD.readAll();
      
      // Trova l'utente specifico dal token (se disponibile)
      let user = null;
      if (userId) {
        user = users.find(u => u.id === userId);
      }
      
      // Se non trova l'utente specifico, usa fallback
      if (!user) {
        user = users.find(u => u.role === 'entry_ambassador') || 
               users.find(u => u.role === 'ambassador') || 
               users.find(u => u.role === 'mlm_ambassador');
        
        // Se non trova ambassador, usa admin come fallback
        if (!user) {
          user = users.find(u => u.username === 'admin');
        }
      }
      
      if (user) {
        req.user = { 
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
        console.log('👤 User authenticated:', req.user.username, req.user.role);
      } else {
        // Fallback per test
        req.user = { 
          id: 1,
          username: 'testuser',
          role: 'entry_ambassador',
          firstName: 'Mario',
          lastName: 'Rossi'
        };
        console.log('👤 Fallback user authenticated:', req.user.username, req.user.role);
      }
      next();
    } else {
      // Per debug, accettiamo anche token senza timestamp
      console.log('🔍 Token ricevuto:', token);
      
      // In un sistema reale, dovremmo decodificare il JWT per ottenere l'utente
      // Per ora, accettiamo solo token che iniziano con 'test-jwt-token-'
      console.log('❌ Token non valido - deve iniziare con test-jwt-token-');
      return res.status(401).json({
        success: false,
        error: 'Token non valido - formato non riconosciuto'
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

// USERS - Caricato da file JSON
let users = [];

// Funzione per caricare gli utenti usando il sistema CRUD
function loadUsersFromFile() {
  try {
    const users = usersCRUD.readAll();
    console.log('✅ Utenti caricati da file:', users.length);
    return users;
  } catch (error) {
    console.error('❌ Errore caricamento utenti:', error);
    return [];
  }
}

// Funzione per generare referral code univoco e complesso
function generateReferralCode(firstName, lastName) {
  // Caratteri disponibili per il codice
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const specialChars = '!@#$%^&*';
  
  // Base dal nome (primi 2 caratteri di nome e cognome)
  const nameBase = `${firstName.toUpperCase().substring(0, 2)}${lastName.toUpperCase().substring(0, 2)}`;
  
  // Timestamp univoco (ultimi 6 caratteri)
  const timestamp = Date.now().toString().slice(-6);
  
  // Stringa casuale di 4 caratteri
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Carattere speciale casuale
  const specialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Checksum basato sui caratteri del nome
  const nameSum = (firstName + lastName).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const checksum = (nameSum % 36).toString(36).toUpperCase();
  
  // Formato: NAMETIMESTAMP-RANDOM-SPECIAL-CHECKSUM
  return `${nameBase}${timestamp}-${randomStr}-${specialChar}-${checksum}`;
}

// Funzione per verificare se un referral code è univoco
function isReferralCodeUnique(code, excludeUserId = null) {
  return !users.some(user => 
    user.referralCode === code && user.id !== excludeUserId
  );
}

// Funzione per generare referral code univoco per un utente
function generateUniqueReferralCode(user) {
  let attempts = 0;
  let code;
  
  do {
    code = generateReferralCode(user.firstName, user.lastName);
    attempts++;
    
    if (attempts > 10) {
      // Se dopo 10 tentativi non è univoco, usa un approccio diverso con UUID
      const crypto = require('crypto');
      const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
      const nameBase = `${user.firstName.toUpperCase().substring(0, 2)}${user.lastName.toUpperCase().substring(0, 2)}`;
      const timestamp = Date.now().toString().slice(-6);
      const specialChar = '!@#$%^&*'[Math.floor(Math.random() * 8)];
      code = `${nameBase}${timestamp}-${uuid}-${specialChar}-REF`;
    }
  } while (!isReferralCodeUnique(code, user.id));
  
  return code;
}

// Funzione per salvare gli utenti usando il sistema CRUD
function saveUsersToFile(usersToSave) {
  try {
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    
    // Crea la directory se non esiste
    const dataDir = path.dirname(usersPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Salva gli utenti su file
    fs.writeFileSync(usersPath, JSON.stringify(usersToSave, null, 2));
    console.log('✅ Utenti salvati su file:', usersToSave.length);
  } catch (error) {
    console.error('❌ Errore salvataggio utenti:', error);
  }
}

// TASKS - Caricato da file JSON
let tasks = [];

// Funzione per caricare i task da file JSON
function loadTasksFromFile() {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    console.log('📁 Percorso file tasks:', tasksPath);
    console.log('📁 File esiste:', fs.existsSync(tasksPath));
    
    // Crea la directory se non esiste
    const dataDir = path.dirname(tasksPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (fs.existsSync(tasksPath)) {
      const tasksData = fs.readFileSync(tasksPath, 'utf8');
      console.log('📄 Dati letti dal file:', tasksData.substring(0, 200) + '...');
      const loadedTasks = JSON.parse(tasksData);
      console.log('✅ Task caricati da file:', loadedTasks.length);
      console.log('📊 Primi 2 task:', loadedTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title })));
      return loadedTasks;
    } else {
      // Crea file con i 6 task completi di onboarding
      tasks = [
        {
          "id": 1,
          "title": "🎬 Introduzione a Wash The World",
          "description": "Scopri la missione, i valori e la visione di Wash The World. Impara cosa ci rende diversi e perché i nostri prodotti sono la scelta migliore per l'ambiente.",
          "type": "video",
          "level": 1,
          "rewards": {
            "points": 25,
            "tokens": 15,
            "experience": 30
          },
          "content": {
            "videoUrl": "/videos/intro-wash-world.mp4",
            "quizQuestions": [],
            "documentContent": "",
            "surveyQuestions": []
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": 2,
          "title": "🧪 Quiz sui Prodotti Ecologici",
          "description": "Testa la tua conoscenza sui nostri prodotti ecologici. Rispondi alle domande per dimostrare di aver compreso le caratteristiche e i benefici dei nostri detergenti sostenibili.",
          "type": "quiz",
          "level": 1,
          "rewards": {
            "points": 30,
            "tokens": 20,
            "experience": 35
          },
          "content": {
            "videoUrl": "",
            "quizQuestions": [
              {
                "id": 1,
                "question": "Qual è la caratteristica principale dei prodotti Wash The World?",
                "options": [
                  "Sono più economici dei prodotti tradizionali",
                  "Sono biodegradabili al 100% e rispettano l'ambiente",
                  "Hanno profumi più intensi",
                  "Sono disponibili solo online"
                ],
                "correctAnswer": 1
              },
              {
                "id": 2,
                "question": "I prodotti Wash The World contengono:",
                "options": [
                  "Solo sostanze chimiche aggressive",
                  "Solo ingredienti naturali e biodegradabili",
                  "Una miscela di prodotti chimici e naturali",
                  "Solo profumi artificiali"
                ],
                "correctAnswer": 1
              },
              {
                "id": 3,
                "question": "Quale valore è più importante per Wash The World?",
                "options": [
                  "Massimizzare i profitti",
                  "La sostenibilità ambientale",
                  "La velocità di produzione",
                  "La quantità di prodotti venduti"
                ],
                "correctAnswer": 1
              },
              {
                "id": 4,
                "question": "I nostri prodotti sono sicuri per:",
                "options": [
                  "Solo adulti",
                  "Adulti e bambini, ma non animali",
                  "Adulti, bambini e animali domestici",
                  "Solo per uso esterno"
                ],
                "correctAnswer": 2
              }
            ],
            "documentContent": "",
            "surveyQuestions": []
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": 3,
          "title": "📚 Guida Completa Ambasciatore",
          "description": "Leggi la guida completa per diventare un ambasciatore efficace. Impara le strategie di vendita, la gestione dei clienti e come costruire la tua rete di successo.",
          "type": "document",
          "level": 2,
          "rewards": {
            "points": 40,
            "tokens": 25,
            "experience": 45
          },
          "content": {
            "videoUrl": "",
            "quizQuestions": [],
            "documentContent": "# 🚀 Guida Completa Ambasciatore Wash The World\n\n## La Tua Missione\n\nCome ambasciatore Wash The World, la tua missione è diffondere i valori della sostenibilità e aiutare le persone a fare scelte consapevoli per l'ambiente.\n\n## I Nostri Valori\n\n### 🌱 Sostenibilità\n- Rispetto per l'ambiente\n- Prodotti biodegradabili al 100%\n- Imballaggi riciclabili\n- Processi produttivi eco-friendly\n\n### 💚 Qualità\n- Ingredienti naturali di alta qualità\n- Efficacia testata e certificata\n- Sicurezza per tutta la famiglia\n- Profumi delicati e naturali\n\n### 🤝 Trasparenza\n- Onestà nei nostri processi\n- Informazioni chiare sui prodotti\n- Tracciabilità della filiera\n- Comunicazione aperta\n\n## Strategie di Vendita\n\n### 1. Conosci i Tuoi Prodotti\n- Studia le caratteristiche di ogni prodotto\n- Impara i benefici per l'ambiente\n- Conosci le differenze con i competitor\n- Sii pronto a rispondere alle domande\n\n### 2. Racconta la Storia\n- Condividi la missione di Wash The World\n- Spiega l'impatto ambientale positivo\n- Mostra i benefici per la salute\n- Evidenzia il risparmio a lungo termine\n\n### 3. Dimostra i Benefici\n- Usa i prodotti personalmente\n- Condividi la tua esperienza\n- Mostra i risultati concreti\n- Organizza dimostrazioni\n\n## Gestione Clienti\n\n### Comunicazione Efficace\n- Ascolta le esigenze del cliente\n- Personalizza la proposta\n- Fornisci informazioni complete\n- Mantieni un follow-up costante\n\n### Supporto Post-Vendita\n- Assisti nell'uso dei prodotti\n- Risolvi eventuali problemi\n- Mantieni il rapporto\n- Chiedi feedback\n\n## Costruire la Tua Rete\n\n### Networking\n- Partecipa a eventi locali\n- Unisciti a gruppi ambientalisti\n- Collabora con altri ambasciatori\n- Sfrutta i social media\n\n### Marketing Digitale\n- Crea contenuti educativi\n- Condividi la tua esperienza\n- Usa piattaforme social\n- Mantieni un blog o canale\n\n## Strumenti a Tua Disposizione\n\n### Materiali Promozionali\n- Brochure informative\n- Campioni prodotti\n- Video dimostrativi\n- Presentazioni digitali\n\n### Piattaforma Online\n- Dashboard personale\n- Sistema di commissioni\n- Tracciamento vendite\n- Supporto tecnico\n\n## Obiettivi e Metriche\n\n### Metriche di Successo\n- Numero di clienti acquisiti\n- Volume di vendite mensile\n- Soddisfazione clienti\n- Espansione della rete\n\n### Piani di Crescita\n- Imposta obiettivi realistici\n- Monitora i progressi\n- Adatta le strategie\n- Celebra i successi\n\n## Supporto e Risorse\n\n### Team di Supporto\n- Assistenza tecnica\n- Formazione continua\n- Materiali aggiornati\n- Consulenza personalizzata\n\n### Community\n- Forum ambasciatori\n- Eventi di networking\n- Condivisione best practices\n- Mentoring tra pari\n\n## Primi Passi\n\n1. **Completa la formazione** - Assicurati di aver seguito tutti i corsi\n2. **Ordina i campioni** - Prova personalmente i prodotti\n3. **Prepara i materiali** - Organizza brochure e presentazioni\n4. **Identifica i primi contatti** - Inizia con amici e famiglia\n5. **Pianifica la strategia** - Definisci il tuo approccio\n6. **Inizia a vendere** - Metti in pratica quanto appreso\n\n## Ricorda\n\n> *\"Ogni vendita non è solo un prodotto, ma un passo verso un mondo più pulito e sostenibile.\"*\n\nLa tua missione è importante. Ogni cliente che sceglie Wash The World contribuisce a ridurre l'inquinamento e a proteggere l'ambiente per le generazioni future.\n\n**Buona fortuna nel tuo percorso come Ambasciatore Wash The World! 🌍✨**",
            "surveyQuestions": []
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": 4,
          "title": "📊 Survey di Feedback Iniziale",
          "description": "Condividi le tue opinioni e aspettative come nuovo ambasciatore. Il tuo feedback ci aiuterà a migliorare il programma di formazione e supporto.",
          "type": "survey",
          "level": 2,
          "rewards": {
            "points": 20,
            "tokens": 10,
            "experience": 25
          },
          "content": {
            "videoUrl": "",
            "quizQuestions": [],
            "documentContent": "",
            "surveyQuestions": [
              "Come hai conosciuto Wash The World?",
              "Quali sono le tue principali motivazioni per diventare ambasciatore?",
              "Quali prodotti ti interessano di più?",
              "Quali sono le tue preoccupazioni ambientali principali?",
              "Preferisci vendere online o di persona?",
              "Quanto tempo puoi dedicare settimanalmente all'attività?",
              "Hai esperienza precedente in vendita o marketing?",
              "Quali sono i tuoi obiettivi di guadagno mensile?",
              "Come preferisci essere supportato nel tuo percorso?",
              "Quali sono le tue aspettative dal programma ambasciatori?"
            ]
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": 5,
          "title": "🎥 Video Avanzato: Processi Produttivi",
          "description": "Scopri come vengono realizzati i nostri prodotti. Questo video ti mostrerà i processi produttivi sostenibili e l'attenzione alla qualità che mettiamo in ogni fase.",
          "type": "video",
          "level": 3,
          "rewards": {
            "points": 35,
            "tokens": 20,
            "experience": 40
          },
          "content": {
            "videoUrl": "/videos/processi-produttivi.mp4",
            "quizQuestions": [],
            "documentContent": "",
            "surveyQuestions": []
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": 6,
          "title": "🏆 Quiz Finale: Certificazione Ambasciatore",
          "description": "Metti alla prova tutte le tue conoscenze con questo quiz finale. Superalo per ottenere la certificazione ufficiale di Ambasciatore Wash The World.",
          "type": "quiz",
          "level": 3,
          "rewards": {
            "points": 50,
            "tokens": 30,
            "experience": 60
          },
          "content": {
            "videoUrl": "",
            "quizQuestions": [
              {
                "id": 1,
                "question": "Qual è la percentuale di biodegradabilità dei prodotti Wash The World?",
                "options": [
                  "50%",
                  "75%",
                  "100%",
                  "90%"
                ],
                "correctAnswer": 2
              },
              {
                "id": 2,
                "question": "Come si chiama il sistema di commissioni di Wash The World?",
                "options": [
                  "Sistema MLM",
                  "Sistema Pentagame",
                  "Sistema Ambassador",
                  "Sistema Wash Rewards"
                ],
                "correctAnswer": 1
              },
              {
                "id": 3,
                "question": "Quale di questi NON è un valore di Wash The World?",
                "options": [
                  "Sostenibilità",
                  "Qualità",
                  "Trasparenza",
                  "Competizione aggressiva"
                ],
                "correctAnswer": 3
              },
              {
                "id": 4,
                "question": "I prodotti Wash The World sono sicuri per:",
                "options": [
                  "Solo adulti",
                  "Adulti e bambini",
                  "Adulti, bambini e animali",
                  "Solo uso esterno"
                ],
                "correctAnswer": 2
              },
              {
                "id": 5,
                "question": "Qual è il principale vantaggio competitivo di Wash The World?",
                "options": [
                  "Prezzi più bassi",
                  "Prodotti ecologici efficaci come quelli tradizionali",
                  "Disponibilità globale",
                  "Marketing aggressivo"
                ],
                "correctAnswer": 1
              },
              {
                "id": 6,
                "question": "Come dovrebbe un ambasciatore presentare i prodotti?",
                "options": [
                  "Concentrandosi solo sul prezzo",
                  "Evidenziando benefici ambientali e qualità",
                  "Criticando i competitor",
                  "Promettendo risultati miracolosi"
                ],
                "correctAnswer": 1
              },
              {
                "id": 7,
                "question": "Quale strategia è più efficace per un ambasciatore?",
                "options": [
                  "Vendere solo online",
                  "Vendere solo di persona",
                  "Combinare vendita diretta e costruzione rete",
                  "Concentrarsi solo sui social media"
                ],
                "correctAnswer": 2
              },
              {
                "id": 8,
                "question": "Cosa significa essere un 'Ambasciatore' Wash The World?",
                "options": [
                  "Solo vendere prodotti",
                  "Rappresentare i valori e la missione dell'azienda",
                  "Essere un dipendente dell'azienda",
                  "Avere un negozio fisico"
                ],
                "correctAnswer": 1
              }
            ],
            "documentContent": "",
            "surveyQuestions": []
          },
          "isActive": true,
          "createdAt": "2025-01-15T10:00:00Z",
          "updatedAt": "2025-01-15T10:00:00Z"
        }
      ];
      
      // Salva i task di default
      saveTasksToFile(tasks);
      return tasks;
    }
  } catch (error) {
    console.error('❌ Errore caricamento task:', error);
    return [];
  }
}

// Funzione per salvare i task su file JSON
function saveTasksToFile(tasksToSave) {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(tasksToSave, null, 2));
    console.log('✅ Task salvati su file:', tasksToSave.length);
  } catch (error) {
    console.error('❌ Errore salvataggio task:', error);
  }
}

// TASKS ONBOARDING - Caricato da file JSON

// COMMISSIONI E VENDITE
const commissions = [
  {
    id: 1,
    userId: 1,
    type: 'direct_sale',
    amount: 500,
    commissionRate: 0.05,
    commissionAmount: 25,
    status: 'paid',
    date: '2025-07-28',
    description: 'Vendita diretta prodotto eco-friendly'
  },
  {
    id: 2,
    userId: 3,
    type: 'direct_sale',
    amount: 2000,
    commissionRate: 0.10,
    commissionAmount: 200,
    status: 'paid',
    date: '2025-07-28',
    description: 'Commissione referral Giulia Bianchi'
  },
  {
    id: 3,
    userId: 1,
    type: 'bonus',
    amount: 1000,
    commissionRate: 0,
    commissionAmount: 50,
    status: 'paid',
    date: '2025-07-25',
    description: 'Bonus performance mensile'
  }
];

// SISTEMA COMMISSIONI MLM - PIANI E STRUTTURE
const mlmPlans = {
  ambassador: {
    name: 'WASH THE WORLD AMBASSADOR',
    levels: {
      direct_sale: 0.20, // 20% sulla vendita diretta
      level_1: 0.06,     // 6% sul 1° livello
      level_2: 0.05,     // 5% sul 2° livello
      level_3: 0.04,     // 4% sul 3° livello
      level_4: 0.03,     // 3% sul 4° livello
      level_5: 0.02      // 2% sul 5° livello
    },
    requirements: {
      min_points: 100,
      min_tasks: 3,
      min_sales: 500
    }
  },
  pentagame: {
    name: 'PENTAGAME',
    levels: {
      direct_sale: 0.315, // 31,5% sulla vendita diretta
      level_1: 0.055,     // 5,5% sul 1° livello
      level_2: 0.038,     // 3,8% sul 2° livello
      level_3: 0.018,     // 1,8% sul 3° livello
      level_4: 0.01       // 1% sul 4° livello
    },
    requirements: {
      min_points: 200,
      min_tasks: 5,
      min_sales: 1000
    }
  }
};

// DATABASE PIANI COMMISSIONI (CRUD) - Caricato da file JSON

// File path for commission plans persistence
const COMMISSION_PLANS_FILE = path.join(__dirname, '..', 'data', 'commission-plans.json');

// File path for tasks persistence
const TASKS_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

// Function to load commission plans from file
function loadCommissionPlansFromFile() {
  try {
    // Crea la directory se non esiste
    const dataDir = path.dirname(COMMISSION_PLANS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (fs.existsSync(COMMISSION_PLANS_FILE)) {
      const data = fs.readFileSync(COMMISSION_PLANS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading commission plans:', error);
  }
  
  // Default plans if file doesn't exist
  return [
    {
      id: 1,
      name: 'WASH THE WORLD AMBASSADOR',
      code: 'ambassador',
      directSale: 0.20,
      level1: 0.06,
      level2: 0.05,
      level3: 0.04,
      level4: 0.03,
      level5: 0.02,
      minPoints: 100,
      minTasks: 3,
      minSales: 500,
      description: 'Piano base per ambasciatori Wash The World',
      isActive: true,
      createdAt: '2025-01-15',
      updatedAt: '2025-01-15'
    },
    {
      id: 2,
      name: 'PENTAGAME',
      code: 'pentagame',
      directSale: 0.315,
      level1: 0.055,
      level2: 0.038,
      level3: 0.018,
      level4: 0.01,
      level5: 0,
      minPoints: 200,
      minTasks: 5,
      minSales: 1000,
      description: 'Piano avanzato per ambasciatori esperti',
      isActive: true,
      createdAt: '2025-01-15',
      updatedAt: '2025-01-15'
    }
  ];
}

// Function to save commission plans to file
function saveCommissionPlansToFile(plans) {
  try {
    // Crea la directory se non esiste
    const dataDir = path.dirname(COMMISSION_PLANS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(COMMISSION_PLANS_FILE, JSON.stringify(plans, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving commission plans:', error);
    return false;
  }
}



// Function to save tasks to file
function saveTasksToFile(tasksToSave) {
  try {
    const tasksPath = path.join(__dirname, '..', 'data', 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify(tasksToSave, null, 2));
    console.log('✅ Task salvati su file:', tasksToSave.length);
  } catch (error) {
    console.error('❌ Errore salvataggio task:', error);
  }
}

// Function to load commissions from file
function loadCommissionsFromFile() {
  try {
    const commissionsPath = path.join(__dirname, '..', 'data', 'commissions.json');
    if (fs.existsSync(commissionsPath)) {
      const data = fs.readFileSync(commissionsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading commissions:', error);
  }
  
  // Default commissions if file doesn't exist
  return [
    {
      id: 1,
      userId: 1,
      saleId: 1,
      commissionAmount: 25,
      status: 'paid',
      date: '2025-01-15',
      type: 'direct_sale'
    },
    {
      id: 2,
      userId: 1,
      saleId: 2,
      commissionAmount: 15,
      status: 'pending',
      date: '2025-01-20',
      type: 'referral'
    }
  ];
}

// Function to save commissions to file
function saveCommissionsToFile(commissionsToSave) {
  try {
    const commissionsPath = path.join(__dirname, '..', 'data', 'commissions.json');
    fs.writeFileSync(commissionsPath, JSON.stringify(commissionsToSave, null, 2));
    console.log('✅ Commissions salvate su file');
  } catch (error) {
    console.error('❌ Errore salvataggio commissions:', error);
  }
}

// Function to load sales from file
function loadSalesFromFile() {
  try {
    const salesPath = path.join(__dirname, '..', 'data', 'sales.json');
    if (fs.existsSync(salesPath)) {
      const data = fs.readFileSync(salesPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading sales:', error);
  }
  
  // Default sales if file doesn't exist
  return [
    {
      id: 1,
      userId: 1,
      customerName: 'Mario Rossi',
      customerEmail: 'mario@example.com',
      amount: 500,
      commissionEarned: 25,
      date: '2025-01-15',
      status: 'completed'
    },
    {
      id: 2,
      userId: 1,
      customerName: 'Giulia Bianchi',
      customerEmail: 'giulia@example.com',
      amount: 300,
      commissionEarned: 15,
      date: '2025-01-20',
      status: 'completed'
    }
  ];
}

// Function to save sales to file
function saveSalesToFile(salesToSave) {
  try {
    const salesPath = path.join(__dirname, '..', 'data', 'sales.json');
    fs.writeFileSync(salesPath, JSON.stringify(salesToSave, null, 2));
    console.log('✅ Sales salvate su file');
  } catch (error) {
    console.error('❌ Errore salvataggio sales:', error);
  }
}

// Load users from file on startup
users = loadUsersFromFile();

// Load commission plans from file on startup
let commissionPlans = loadCommissionPlansFromFile();

// Load tasks from file on startup
tasks = loadTasksFromFile();

// STRUTTURA RETE MLM - RELAZIONI REFERRAL (DINAMICA)
// I dati della rete vengono calcolati dinamicamente basati sui dati reali degli utenti
// invece di usare dati MOCK hardcoded

// Funzione per calcolare la struttura della rete MLM dinamicamente
function calculateNetworkStructure() {
  const users = loadUsersFromFile();
  const networkStructure = [];
  
  users.forEach(user => {
    if (user.role === 'ambassador' || user.role === 'mlm_ambassador' || user.role === 'entry_ambassador') {
      // Trova sponsor (referrerId)
      const sponsorId = user.sponsorId || null;
      
      // Trova downline (utenti che hanno questo utente come sponsor)
      const downline = users.filter(u => u.sponsorId === user.id).map(u => u.id);
      
      // Calcola livello (quanti livelli sopra)
      let level = 0;
      let upline = [];
      let currentSponsorId = sponsorId;
      
      while (currentSponsorId) {
        level++;
        upline.push(currentSponsorId);
        const sponsor = users.find(u => u.id === currentSponsorId);
        currentSponsorId = sponsor?.sponsorId || null;
      }
      
      networkStructure.push({
        id: user.id,
        userId: user.id,
        sponsorId: sponsorId,
        upline: upline,
        downline: downline,
        level: level,
        plan: user.role === 'mlm_ambassador' ? 'pentagame' : 'ambassador',
        joinDate: user.createdAt || new Date().toISOString()
      });
    }
  });
  
  return networkStructure;
}

// VENDITE E COMMISSIONI DETTAGLIATE (DINAMICHE)
// I dati delle vendite vengono caricati dinamicamente dal file JSON
// invece di usare dati MOCK hardcoded

// Carica vendite dal file JSON
let sales = loadSalesFromFile();

// Carica referrals dal file JSON (se esiste)
let referrals = [];
try {
  const referralsPath = path.join(__dirname, '..', 'data', 'referrals.json');
  if (fs.existsSync(referralsPath)) {
    const referralsData = fs.readFileSync(referralsPath, 'utf8');
    referrals = JSON.parse(referralsData);
  }
} catch (error) {
  console.log('📝 Nessun file referrals.json trovato, usando array vuoto');
}

// BADGES (DINAMICI)
// I badge vengono calcolati dinamicamente basati sui progressi dell'utente
// invece di usare dati MOCK hardcoded

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production'
  });
});

// Route di default
app.get('/', (req, res) => {
  res.json({
    message: '🌊 Wash The World Backend API',
    version: '1.0.0',
    status: 'running',
    environment: 'production',
    endpoints: {
      auth: '/api/auth',
      onboarding: '/api/onboarding',
      health: '/health'
    }
  });
});

// API AUTH
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Login attempt:', { username, password: '***' });

  // Cerca l'utente nel database usando il sistema CRUD
  const users = usersCRUD.readAll();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log('✅ Login successful for user:', username);
    console.log('🔍 User role:', user.role);

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      level: user.level,
      points: user.points,
      tokens: user.tokens,
      onboardingLevel: user.onboardingLevel,
      role: user.role,
      isActive: user.isActive
    };

    console.log('✅ Sending user data:', userResponse);

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: userResponse,
        token: 'test-jwt-token-' + user.id + '-' + Date.now()
      }
    });
  } else {
    console.log('❌ Invalid credentials for username:', username);
    res.status(401).json({
      success: false,
      error: 'Credenziali non valide'
    });
  }
});

// ========================================
// 🔄 ENDPOINTS REFERRAL E REGISTRAZIONE
// ========================================

// 1. Validazione codice referral
app.get('/api/referral/validate/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    // Cerca l'utente con questo codice referral
    const sponsor = users.find(user => user.referralCode === code);
    
    if (!sponsor) {
      return res.json({
        success: false,
        error: 'Codice referral non valido'
      });
    }
    
    // Verifica che l'utente sia attivo
    if (!sponsor.isActive) {
      return res.json({
        success: false,
        error: 'Sponsor non attivo'
      });
    }
    
    // Calcola scadenza (24 ore)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    res.json({
      success: true,
      data: {
        referralCode: code,
        sponsor: {
          id: sponsor.id,
          firstName: sponsor.firstName,
          lastName: sponsor.lastName,
          level: sponsor.level || 1,
          totalSales: sponsor.totalSales || 0
        },
        isValid: true,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Errore validazione referral:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 2. Registrazione nuovo ambassador con referral
app.post('/api/auth/register', (req, res) => {
  const { 
    username, 
    password, 
    email, 
    firstName, 
    lastName,
    phone,
    country,
    city,
    sponsorCode,
    sponsorId,
    referralCode
  } = req.body;

  console.log('🆕 Registrazione Ambassador:', { 
    username, 
    email, 
    firstName, 
    lastName,
    phone,
    country,
    city,
    sponsorCode,
    sponsorId,
    referralCode,
    password: '***' 
  });

  // Validazione campi obbligatori
  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Username, password, email, nome e cognome sono obbligatori'
    });
  }

  // Carica gli utenti dal sistema CRUD
  const users = usersCRUD.readAll();
  
  // Verifica username univoco
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Username già esistente'
    });
  }

  // Verifica email univoca
  const existingEmail = users.find(u => u.email === email);
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      error: 'Email già registrata'
    });
  }

  // Trova sponsor se fornito
  let sponsor = null;
  if (sponsorCode) {
    sponsor = users.find(u => u.username === sponsorCode || u.sponsorCode === sponsorCode);
    if (!sponsor) {
      return res.status(400).json({
        success: false,
        error: 'Codice sponsor non valido'
      });
    }
  }

  // Genera codice sponsor univoco
  const newSponsorCode = 'AMB' + Math.random().toString(36).substr(2, 6).toUpperCase();

  // Crea nuovo Ambassador
  const newAmbassador = {
    username,
    password,
    email,
    firstName,
    lastName,
    phone: phone || '',
    country: country || '',
    city: city || '',
    sponsorCode: newSponsorCode,
    sponsorId: sponsor ? sponsor.id : null,
    role: 'ambassador',
    level: 1,
    points: 0,
    tokens: 0,
    experience: 0,
    onboardingLevel: 1,
    isActive: true,
    isOnboardingComplete: false,
    completedTasks: [],
    badges: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };

  // Usa il sistema CRUD per creare l'utente
  const result = usersCRUD.create(newAmbassador);
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }

  console.log('✅ Ambassador registrato con successo:', result.data.username);

  // Prepara risposta utente (senza password)
  const userResponse = {
    id: result.data.id,
    username: result.data.username,
    email: result.data.email,
    firstName: result.data.firstName,
    lastName: result.data.lastName,
    phone: result.data.phone,
    country: result.data.country,
    city: result.data.city,
    sponsorCode: result.data.sponsorCode,
    sponsorId: result.data.sponsorId,
    level: result.data.level,
    points: result.data.points,
    tokens: result.data.tokens,
    onboardingLevel: result.data.onboardingLevel,
    role: result.data.role,
    isActive: result.data.isActive
  };

  res.status(201).json({
    success: true,
    message: 'Ambassador registrato con successo! Benvenuto in Wash The World!',
    data: {
      user: userResponse,
      token: 'test-jwt-token-' + result.data.id + '-' + Date.now()
    }
  });
});

// API - Lista Utenti (per debug)
app.get('/api/admin/users', verifyToken, (req, res) => {
  console.log('📋 Lista utenti richiesta');
  
  // Usa il sistema CRUD per caricare gli utenti
  const users = usersCRUD.readAll();
  
  const usersList = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    level: user.level,
    points: user.points,
    tokens: user.tokens,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));

  res.json({
    success: true,
    data: usersList
  });
});

// POST - Crea nuovo utente
app.post('/api/admin/users', verifyToken, (req, res) => {
  console.log('🆕 Admin: Creazione nuovo utente');
  
  const {
    username,
    email,
    firstName,
    lastName,
    password,
    role,
    level,
    points,
    tokens
  } = req.body;
  
  // Validazione
  if (!username || !email || !firstName || !lastName || !password) {
    return res.status(400).json({
      success: false,
      error: 'Tutti i campi obbligatori devono essere compilati'
    });
  }
  
  // Verifica username univoco
  const users = usersCRUD.readAll();
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Username già esistente'
    });
  }
  
  // Verifica email univoca
  const existingEmail = users.find(u => u.email === email);
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      error: 'Email già esistente'
    });
  }
  
  // Genera referral code
  const referralCode = generateUniqueReferralCode({ firstName, lastName });
  
  // Crea nuovo utente
  const newUser = {
    id: users.length + 1,
    username,
    email,
    firstName,
    lastName,
    password,
    level: level || 1,
    experience: 0,
    experienceToNextLevel: 100,
    onboardingLevel: 1,
    points: points || 0,
    tokens: tokens || 0,
    role: role || 'entry_ambassador',
    commissionRate: 0.05,
    referralCode,
    totalSales: 0,
    totalCommissions: 0,
    wallet: {
      balance: 0,
      transactions: []
    },
    badges: [],
    completedTasks: [],
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: null,
    updatedAt: new Date().toISOString(),
    hasSeenWelcome: false,
    subscriptionActive: false,
    kycStatus: 'pending'
  };
  
  // Usa il sistema CRUD per salvare
  const success = usersCRUD.create(newUser);
  
  if (success) {
    res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        level: newUser.level,
        points: newUser.points,
        tokens: newUser.tokens,
        referralCode: newUser.referralCode
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'utente'
    });
  }
});

// PUT - Aggiorna utente
app.put('/api/admin/users/:id', verifyToken, (req, res) => {
  console.log(`✏️ Admin: Aggiornamento utente ID ${req.params.id}`);
  
  const userId = parseInt(req.params.id);
  const users = usersCRUD.readAll();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  const {
    username,
    email,
    firstName,
    lastName,
    role,
    level,
    points,
    tokens,
    isActive
  } = req.body;
  
  // Verifica username univoco (escludendo l'utente corrente)
  if (username) {
    const existingUser = users.find(u => u.username === username && u.id !== userId);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username già esistente'
      });
    }
  }
  
  // Verifica email univoca (escludendo l'utente corrente)
  if (email) {
    const existingEmail = users.find(u => u.email === email && u.id !== userId);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email già esistente'
      });
    }
  }
  
  // Aggiorna l'utente
  const updatedUser = {
    ...users[userIndex],
    ...(username && { username }),
    ...(email && { email }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(role && { role }),
    ...(level && { level }),
    ...(points && { points }),
    ...(tokens && { tokens }),
    ...(isActive !== undefined && { isActive }),
    updatedAt: new Date().toISOString()
  };
  
  // Usa il sistema CRUD per aggiornare
  const success = usersCRUD.update(userId, updatedUser);
  
  if (success) {
    res.json({
      success: true,
      message: 'Utente aggiornato con successo',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        level: updatedUser.level,
        points: updatedUser.points,
        tokens: updatedUser.tokens,
        isActive: updatedUser.isActive
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'utente'
    });
  }
});

// DELETE - Elimina utente
app.delete('/api/admin/users/:id', verifyToken, (req, res) => {
  console.log(`🗑️ Admin: Eliminazione utente ID ${req.params.id}`);
  
  const userId = parseInt(req.params.id);
  
  // Verifica che l'utente non sia admin
  const users = usersCRUD.readAll();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Non è possibile eliminare un utente admin'
    });
  }
  
  // Usa il sistema CRUD per eliminare
  const success = usersCRUD.delete(userId);
  
  if (success) {
    res.json({
      success: true,
      message: 'Utente eliminato con successo'
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'utente'
    });
  }
});

// PUT - Autorizza utente
app.put('/api/admin/users/:id/authorize', verifyToken, (req, res) => {
  console.log(`✅ Admin: Autorizzazione utente ID ${req.params.id}`);
  
  const userId = parseInt(req.params.id);
  const users = usersCRUD.readAll();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  // Aggiorna lo stato dell'utente
  users[userIndex].isActive = true;
  users[userIndex].updatedAt = new Date().toISOString();
  
  // Salva le modifiche
  saveUsersToFile(users);
  
  res.json({
    success: true,
    message: 'Utente autorizzato con successo',
    data: users[userIndex]
  });
});

// PUT - Sospendi utente
app.put('/api/admin/users/:id/suspend', verifyToken, (req, res) => {
  console.log(`⏸️ Admin: Sospensione utente ID ${req.params.id}`);
  
  const userId = parseInt(req.params.id);
  const users = usersCRUD.readAll();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  // Non permettere di sospendere l'admin
  if (users[userIndex].role === 'admin') {
    return res.status(400).json({
      success: false,
      error: 'Non è possibile sospendere un utente admin'
    });
  }
  
  // Aggiorna lo stato dell'utente
  users[userIndex].isActive = false;
  users[userIndex].updatedAt = new Date().toISOString();
  
  // Salva le modifiche
  saveUsersToFile(users);
  
  res.json({
    success: true,
    message: 'Utente sospeso con successo',
    data: users[userIndex]
  });
});

// API ONBOARDING - SOLO PER AMBASSADOR
app.get('/api/onboarding/dashboard', verifyToken, (req, res) => {
  console.log('📊 Dashboard request');

  // Carica gli utenti e i task usando il sistema CRUD
  const users = usersCRUD.readAll();
  const tasks = tasksCRUD.readAll();
  
  // Usa l'utente dal token verificato
  const authenticatedUser = req.user;
  console.log('🔍 Authenticated user from token:', authenticatedUser);
  
  // BLOCCA L'ADMIN - Solo ambassador possono accedere
  if (authenticatedUser && authenticatedUser.role === 'admin') {
    console.log('❌ Admin bloccato da dashboard ambassador');
    return res.status(403).json({
      success: false,
      error: 'Accesso negato. Gli admin non possono accedere al dashboard ambassador.'
    });
  }
  
  // Trova l'utente nel database basato sul token
  let user;
  if (authenticatedUser && authenticatedUser.username) {
    user = users.find(u => u.username === authenticatedUser.username);
  }
  
  // Se non trova l'utente dal token, usa solo ambassador
  if (!user) {
    user = users.find(u => u.role === 'ambassador') || users.find(u => u.role === 'entry_ambassador') || users.find(u => u.role === 'mlm_ambassador');
  }
  
  // Se ancora non trova un ambassador, errore
  if (!user || user.role === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Solo gli ambassador possono accedere a questo dashboard.'
    });
  }
  
  console.log('🔍 User for dashboard:', { ...user, password: '***' });
  console.log('🔍 User completedTasks:', user.completedTasks);

  // Assicurati che completedTasks sia sempre un array e rimuovi duplicati
  if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
    user.completedTasks = [];
  } else {
    // Rimuovi duplicati dall'array completedTasks
    user.completedTasks = [...new Set(user.completedTasks)];
  }
  
  // Salva se ci sono stati cambiamenti
  if (!user.completedTasks || !Array.isArray(user.completedTasks) || user.completedTasks.length !== [...new Set(user.completedTasks)].length) {
    saveUsersToFile(users);
  }
  
  // Assicurati che completedTasks sia un array
  if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
    user.completedTasks = [];
    saveUsersToFile(users);
  }
  
  // Calcola i task completati dall'utente
  const completedTasksCount = user.completedTasks ? user.completedTasks.length : 0;
  const completedTasksList = tasks.filter(task => user.completedTasks && user.completedTasks.includes(task.id));
  const availableTasksList = tasks.filter(task => !user.completedTasks || !user.completedTasks.includes(task.id));
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Assicurati che l'utente abbia un referral code
  if (!user.referralCode) {
    user.referralCode = generateUniqueReferralCode(user);
    saveUsersToFile(users);
  }

  // Definizione dei badge disponibili
  const availableBadges = [
    { id: 1, name: 'first_task', title: 'Primo Task', description: 'Completa il tuo primo task' },
    { id: 2, name: 'onboarding_complete', title: 'Onboarding Completo', description: 'Completa tutti i task di onboarding' },
    { id: 3, name: 'ambassador', title: 'Ambassador', description: 'Diventa un ambassador' },
    { id: 4, name: 'top_performer', title: 'Top Performer', description: 'Raggiungi risultati eccellenti' }
  ];

  const dashboardResponse = {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      level: user.level,
      experience: user.experience,
      experienceToNextLevel: 100,
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
      percentage: progressPercentage,
      completedTasks: completedTasksCount,
      totalTasks: tasks.length,
      currentTask: null
    },
    availableTasks: availableTasksList, // MOSTRA SOLO I TASK DISPONIBILI
    completedTasks: completedTasksList,
    badges: user.badges || [],
    availableBadges: availableBadges,
    isOnboardingComplete: completedTasksCount >= tasks.length
  };

  console.log('✅ Dashboard response:', dashboardResponse);

  res.json({
    success: true,
    data: dashboardResponse
  });
});

app.get('/api/onboarding/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    res.json({
      success: true,
      data: task
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Task non trovato'
    });
  }
});

// ========================================
// 🎬 ENDPOINTS ONBOARDING AVANZATO
// ========================================

// 3. Verifica token temporaneo
app.get('/api/auth/verify-token', (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token non fornito'
      });
    }
    
    // Verifica formato token temporaneo
    if (!token.startsWith('temp-token-')) {
      return res.status(400).json({
        success: false,
        error: 'Token non valido'
      });
    }
    
    // Simula verifica token (in produzione dovrebbe essere nel database)
    const user = users.find(u => u.email === 'test@example.com') || users[0];
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          hasSeenWelcome: user.hasSeenWelcome
        },
        redirectTo: user.hasSeenWelcome ? '/dashboard' : '/onboarding'
      }
    });
  } catch (error) {
    console.error('❌ Errore verifica token:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 4. Stato onboarding
app.get('/api/onboarding/status', verifyToken, (req, res) => {
  try {
    // Simula utente dal token
    const user = users.find(u => u.id === 1) || users[0];
    
    res.json({
      success: true,
      data: {
        hasSeenWelcome: user.hasSeenWelcome,
        onboardingLevel: user.onboardingLevel,
        completedTasks: user.completedTasks || [],
        currentTask: user.onboardingLevel === 1 ? {
          id: 1,
          title: "🎬 Video di Benvenuto",
          type: "welcome_video"
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Errore stato onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 5. Completamento task onboarding
app.post('/api/onboarding/complete-task', verifyToken, (req, res) => {
  try {
    const { taskId, completed, rewards } = req.body;
    
    // Simula utente dal token
    const user = users.find(u => u.id === 1) || users[0];
    
    console.log('📋 Completamento task:', { taskId, completed, rewards });
    
    if (completed) {
      // Assicurati che completedTasks sia un array
      if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
        user.completedTasks = [];
      }
      
      // Aggiungi il task completato se non è già presente
      if (!user.completedTasks || !user.completedTasks.includes(taskId)) {
        user.completedTasks.push(taskId);
      }
      
      // Aggiorna ricompense se fornite
      if (rewards) {
        user.points = (user.points || 0) + (rewards.points || 0);
        user.tokens = (user.tokens || 0) + (rewards.tokens || 0);
        user.experience = (user.experience || 0) + (rewards.experience || 0);
      }
      
      // Aggiorna stato utente
      user.hasSeenWelcome = true;
      user.onboardingLevel = Math.min(user.onboardingLevel + 1, 5);
      
      saveUsersToFile(users);
      
      res.json({
        success: true,
        data: {
          user: {
            hasSeenWelcome: user.hasSeenWelcome,
            onboardingLevel: user.onboardingLevel,
            points: user.points,
            tokens: user.tokens,
            experience: user.experience
          },
          rewards: rewards,
          message: 'Task completato con successo!'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Task non completato'
      });
    }
  } catch (error) {
    console.error('❌ Errore completamento task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ========================================
// 🆔 ENDPOINTS KYC
// ========================================

// 6. Invio documenti KYC
app.post('/api/kyc/submit', verifyToken, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🆔 KYC Submit - Dati ricevuti:', req.body);
    console.log('🆔 KYC Submit - File ricevuti:', req.files);
    
    // Validazione dati
    const { birthDate, address, city, country, citizenship, fiscalCode, iban, isCompany, companyName, vatNumber, sdiCode } = req.body;
    
    if (!birthDate || !address || !city || !country || !citizenship || !iban) {
      return res.status(400).json({
        success: false,
        error: 'Dati anagrafici incompleti'
      });
    }
    
    if (!req.files || !req.files.idFront || !req.files.idBack || !req.files.selfie) {
      return res.status(400).json({
        success: false,
        error: 'Tutti i documenti sono obbligatori'
      });
    }
    
    // Validazione per tipo soggetto
    if (isCompany === 'true') {
      if (!companyName || !vatNumber || !sdiCode) {
        return res.status(400).json({
          success: false,
          error: 'Dati aziendali incompleti'
        });
      }
    } else {
      if (!fiscalCode) {
        return res.status(400).json({
          success: false,
          error: 'Codice fiscale obbligatorio per privati'
        });
      }
    }
    
    // Genera KYC ID
    const kycId = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepara dati KYC
    const kycData = {
      kycId,
      userId: req.user?.id || 'unknown',
      timestamp: new Date().toISOString(),
      status: 'pending',
      personalData: {
        birthDate,
        address,
        city,
        country,
        citizenship
      },
      financialData: {
        iban: iban.replace(/\s/g, ''),
        isCompany: isCompany === 'true',
        fiscalCode: isCompany === 'true' ? null : fiscalCode,
        companyName: isCompany === 'true' ? companyName : null,
        vatNumber: isCompany === 'true' ? vatNumber : null,
        sdiCode: isCompany === 'true' ? sdiCode : null
      },
      documents: {
        idFront: req.files.idFront[0].filename,
        idBack: req.files.idBack[0].filename,
        selfie: req.files.selfie[0].filename
      }
    };
    
    // Salva dati KYC
    const kycFilePath = path.join(__dirname, '..', 'data', 'kyc-submissions.json');
    let kycSubmissions = [];
    
    try {
      if (fs.existsSync(kycFilePath)) {
        kycSubmissions = JSON.parse(fs.readFileSync(kycFilePath, 'utf8'));
      }
    } catch (error) {
      console.log('📁 Creazione nuovo file KYC submissions');
    }
    
    kycSubmissions.push(kycData);
    fs.writeFileSync(kycFilePath, JSON.stringify(kycSubmissions, null, 2));
    
    // Invia email di notifica
    try {
      const emailData = {
        kycId,
        userData: kycData.personalData,
        financialData: kycData.financialData,
        documents: kycData.documents,
        isCompany: isCompany === 'true'
      };
      
      await sendKYCNotificationEmail(emailData);
      console.log('📧 Email KYC inviata con successo');
    } catch (emailError) {
      console.error('❌ Errore invio email KYC:', emailError);
      // Non bloccare il processo se l'email fallisce
    }
    
    // Aggiorna stato utente
    const user = users.find(u => u.id === req.user?.id);
    if (user) {
      user.kycStatus = 'pending';
      user.kycData = kycData;
      saveUsersToFile(users);
    }
    
    res.json({
      success: true,
      data: {
        kycId,
        status: 'pending',
        estimatedTime: '24-48 ore lavorative',
        message: 'Documenti ricevuti e in fase di verifica. Riceverai una notifica email quando la verifica sarà completata.'
      }
    });
    
  } catch (error) {
    console.error('❌ Errore invio KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server durante l\'invio del KYC'
    });
  }
});

// Funzione per inviare email di notifica KYC
async function sendKYCNotificationEmail(kycData) {
  const { kycId, userData, financialData, documents, isCompany } = kycData;
  
  const subject = `🆔 Nuova Richiesta KYC - ${kycId}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🆔 Nuova Richiesta KYC</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">📋 Dettagli Richiesta</h3>
        <p><strong>KYC ID:</strong> ${kycId}</p>
        <p><strong>Data Richiesta:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p><strong>Tipo Soggetto:</strong> ${isCompany ? 'Azienda' : 'Privato'}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">👤 Dati Anagrafici</h3>
        <p><strong>Data di Nascita:</strong> ${userData.birthDate}</p>
        <p><strong>Indirizzo:</strong> ${userData.address}</p>
        <p><strong>Città:</strong> ${userData.city}</p>
        <p><strong>Paese:</strong> ${userData.country}</p>
        <p><strong>Cittadinanza:</strong> ${userData.citizenship}</p>
      </div>
      
      <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">💳 Dati Fiscali e Bancari</h3>
        <p><strong>IBAN:</strong> ${financialData.iban}</p>
        ${isCompany ? `
          <p><strong>Nome Azienda:</strong> ${financialData.companyName}</p>
          <p><strong>Partita IVA:</strong> ${financialData.vatNumber}</p>
          <p><strong>Codice SDI:</strong> ${financialData.sdiCode}</p>
        ` : `
          <p><strong>Codice Fiscale:</strong> ${financialData.fiscalCode}</p>
        `}
      </div>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #166534; margin-top: 0;">📄 Documenti Caricati</h3>
        <p><strong>Fronte Documento:</strong> ${documents.idFront}</p>
        <p><strong>Retro Documento:</strong> ${documents.idBack}</p>
        <p><strong>Selfie:</strong> ${documents.selfie}</p>
      </div>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin-top: 0;">⚠️ Azioni Richieste</h3>
        <p>1. <strong>Verifica Documenti:</strong> Controllare la qualità e autenticità dei documenti caricati</p>
        <p>2. <strong>Verifica Dati:</strong> Validare i dati anagrafici e fiscali forniti</p>
        <p>3. <strong>Compliance Check:</strong> Verificare la conformità con le normative anti-money laundering</p>
        <p>4. <strong>Approvazione/Rifiuto:</strong> Aggiornare lo stato KYC nel sistema</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0;">
          <strong>Wash The World</strong><br>
          Sistema di Gestione KYC<br>
          ${new Date().toLocaleString('it-IT')}
        </p>
      </div>
    </div>
  `;
  
  const textContent = `
    🆔 NUOVA RICHIESTA KYC - ${kycId}
    
    📋 DETTAGLI RICHIESTA:
    - KYC ID: ${kycId}
    - Data Richiesta: ${new Date().toLocaleString('it-IT')}
    - Tipo Soggetto: ${isCompany ? 'Azienda' : 'Privato'}
    
    👤 DATI ANAGRAFICI:
    - Data di Nascita: ${userData.birthDate}
    - Indirizzo: ${userData.address}
    - Città: ${userData.city}
    - Paese: ${userData.country}
    - Cittadinanza: ${userData.citizenship}
    
    💳 DATI FISCALI E BANCARI:
    - IBAN: ${financialData.iban}
    ${isCompany ? `
    - Nome Azienda: ${financialData.companyName}
    - Partita IVA: ${financialData.vatNumber}
    - Codice SDI: ${financialData.sdiCode}
    ` : `
    - Codice Fiscale: ${financialData.fiscalCode}
    `}
    
    📄 DOCUMENTI CARICATI:
    - Fronte Documento: ${documents.idFront}
    - Retro Documento: ${documents.idBack}
    - Selfie: ${documents.selfie}
    
    ⚠️ AZIONI RICHIESTE:
    1. Verifica Documenti: Controllare la qualità e autenticità dei documenti caricati
    2. Verifica Dati: Validare i dati anagrafici e fiscali forniti
    3. Compliance Check: Verificare la conformità con le normative anti-money laundering
    4. Approvazione/Rifiuto: Aggiornare lo stato KYC nel sistema
    
    ---
    Wash The World - Sistema di Gestione KYC
    ${new Date().toLocaleString('it-IT')}
  `;
  
  // Email per info@washtw.com
  const infoMailOptions = {
    from: 'noreply@washtw.com',
    to: 'info@washtw.com',
    subject: subject,
    text: textContent,
    html: htmlContent
  };
  
  // Email per admin (gestione clienti)
  const adminMailOptions = {
    from: 'noreply@washtw.com',
    to: 'admin@washtw.com', // Sostituire con email admin reale
    subject: `👥 GESTIONE CLIENTI - Nuova Richiesta KYC ${kycId}`,
    text: textContent,
    html: htmlContent
  };
  
  // Invia entrambe le email
  await Promise.all([
    transporter.sendMail(infoMailOptions),
    transporter.sendMail(adminMailOptions)
  ]);
}

// 7. Stato verifica KYC
app.get('/api/kyc/status', verifyToken, (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Cerca l'utente e il suo stato KYC
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Se l'utente ha dati KYC, restituisci lo stato reale
    if (user.kycData) {
      res.json({
        success: true,
        data: {
          kycId: user.kycData.kycId,
          status: user.kycStatus || 'pending',
          submittedAt: user.kycData.timestamp,
          approvedAt: user.kycStatus === 'approved' ? new Date().toISOString() : null,
          rejectionReason: user.kycStatus === 'rejected' ? user.kycData.rejectionReason : null,
          estimatedTime: '24-48 ore lavorative'
        }
      });
    } else {
      // Se non ha ancora inviato KYC
      res.json({
        success: true,
        data: {
          status: 'not_submitted',
          message: 'KYC non ancora inviato'
        }
      });
    }
  } catch (error) {
    console.error('❌ Errore stato KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ========================================
// 👥 ENDPOINTS ADMIN KYC
// ========================================

// 8. Lista richieste KYC (Admin)
app.get('/api/admin/kyc/requests', verifyToken, (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli admin possono visualizzare le richieste KYC.'
      });
    }
    
    // Carica tutte le richieste KYC
    const kycFilePath = path.join(__dirname, '..', 'data', 'kyc-submissions.json');
    let kycSubmissions = [];
    
    try {
      if (fs.existsSync(kycFilePath)) {
        kycSubmissions = JSON.parse(fs.readFileSync(kycFilePath, 'utf8'));
      }
    } catch (error) {
      console.log('📁 Nessuna richiesta KYC trovata');
    }
    
    // Aggiungi informazioni utente a ogni richiesta
    const kycWithUserInfo = kycSubmissions.map(kyc => {
      const user = users.find(u => u.id === kyc.userId);
      return {
        ...kyc,
        userInfo: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : null
      };
    });
    
    res.json({
      success: true,
      data: {
        total: kycWithUserInfo.length,
        pending: kycWithUserInfo.filter(k => k.status === 'pending').length,
        approved: kycWithUserInfo.filter(k => k.status === 'approved').length,
        rejected: kycWithUserInfo.filter(k => k.status === 'rejected').length,
        requests: kycWithUserInfo
      }
    });
  } catch (error) {
    console.error('❌ Errore lista richieste KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 9. Approva/Rifiuta KYC (Admin)
app.post('/api/admin/kyc/:kycId/status', verifyToken, async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Solo gli admin possono modificare lo stato KYC.'
      });
    }
    
    const { kycId } = req.params;
    const { status, reason } = req.body; // status: 'approved' | 'rejected', reason: string (opzionale)
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Stato non valido. Usa "approved" o "rejected".'
      });
    }
    
    // Carica richieste KYC
    const kycFilePath = path.join(__dirname, '..', 'data', 'kyc-submissions.json');
    let kycSubmissions = [];
    
    try {
      if (fs.existsSync(kycFilePath)) {
        kycSubmissions = JSON.parse(fs.readFileSync(kycFilePath, 'utf8'));
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Nessuna richiesta KYC trovata'
      });
    }
    
    // Trova la richiesta KYC
    const kycIndex = kycSubmissions.findIndex(k => k.kycId === kycId);
    if (kycIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Richiesta KYC non trovata'
      });
    }
    
    // Aggiorna stato KYC
    kycSubmissions[kycIndex].status = status;
    kycSubmissions[kycIndex].processedAt = new Date().toISOString();
    kycSubmissions[kycIndex].processedBy = req.user.id;
    
    if (status === 'rejected' && reason) {
      kycSubmissions[kycIndex].rejectionReason = reason;
    }
    
    // Salva aggiornamenti
    fs.writeFileSync(kycFilePath, JSON.stringify(kycSubmissions, null, 2));
    
    // Aggiorna stato utente
    const userId = kycSubmissions[kycIndex].userId;
    const user = users.find(u => u.id === userId);
    if (user) {
      user.kycStatus = status;
      if (status === 'rejected' && reason) {
        user.kycData.rejectionReason = reason;
      }
      saveUsersToFile(users);
    }
    
    // Invia email di notifica all'utente
    try {
      await sendKYCStatusNotificationEmail(kycSubmissions[kycIndex], status, reason);
      console.log('📧 Email notifica stato KYC inviata');
    } catch (emailError) {
      console.error('❌ Errore invio email notifica KYC:', emailError);
    }
    
    res.json({
      success: true,
      data: {
        kycId,
        status,
        message: status === 'approved' ? 'KYC approvato con successo' : 'KYC rifiutato',
        reason: status === 'rejected' ? reason : null
      }
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento stato KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Funzione per inviare email di notifica stato KYC
async function sendKYCStatusNotificationEmail(kycData, status, reason) {
  const user = users.find(u => u.id === kycData.userId);
  if (!user) return;
  
  const subject = status === 'approved' 
    ? `✅ KYC Approvato - ${kycData.kycId}`
    : `❌ KYC Rifiutato - ${kycData.kycId}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${status === 'approved' ? '#059669' : '#dc2626'};">
        ${status === 'approved' ? '✅ KYC Approvato' : '❌ KYC Rifiutato'}
      </h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">📋 Dettagli Verifica</h3>
        <p><strong>KYC ID:</strong> ${kycData.kycId}</p>
        <p><strong>Data Verifica:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p><strong>Stato:</strong> ${status === 'approved' ? 'Approvato' : 'Rifiutato'}</p>
      </div>
      
      ${status === 'approved' ? `
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-top: 0;">🎉 Verifica Completata</h3>
          <p>La tua verifica identità è stata completata con successo!</p>
          <p>Ora puoi accedere a tutte le funzionalità MLM e ricevere le commissioni.</p>
        </div>
      ` : `
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #991b1b; margin-top: 0;">⚠️ Verifica Rifiutata</h3>
          <p>La tua verifica identità non è stata approvata.</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <p>Puoi inviare una nuova richiesta KYC con documenti corretti.</p>
        </div>
      `}
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0;">
          <strong>Wash The World</strong><br>
          Sistema di Gestione KYC<br>
          ${new Date().toLocaleString('it-IT')}
        </p>
      </div>
    </div>
  `;
  
  const textContent = `
    ${status === 'approved' ? '✅ KYC APPROVATO' : '❌ KYC RIFIUTATO'} - ${kycData.kycId}
    
    📋 DETTAGLI VERIFICA:
    - KYC ID: ${kycData.kycId}
    - Data Verifica: ${new Date().toLocaleString('it-IT')}
    - Stato: ${status === 'approved' ? 'Approvato' : 'Rifiutato'}
    
    ${status === 'approved' ? `
    🎉 VERIFICA COMPLETATA:
    La tua verifica identità è stata completata con successo!
    Ora puoi accedere a tutte le funzionalità MLM e ricevere le commissioni.
    ` : `
    ⚠️ VERIFICA RIFIUTATA:
    La tua verifica identità non è stata approvata.
    ${reason ? `Motivo: ${reason}` : ''}
    Puoi inviare una nuova richiesta KYC con documenti corretti.
    `}
    
    ---
    Wash The World - Sistema di Gestione KYC
    ${new Date().toLocaleString('it-IT')}
  `;
  
  const mailOptions = {
    from: 'noreply@washtw.com',
    to: user.email,
    subject: subject,
    text: textContent,
    html: htmlContent
  };
  
  await transporter.sendMail(mailOptions);
}

// ========================================
// 💳 ENDPOINTS PAGAMENTI
// ========================================

// 8. Lista piani disponibili
app.get('/api/plans', (req, res) => {
  try {
    // Carica i piani dal file JSON invece di dati hardcoded
    const plans = loadCommissionPlansFromFile();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('❌ Errore lista piani:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 9. Selezione piano
app.post('/api/plans/select', verifyToken, (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    
    // Simula creazione checkout
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
    
    res.json({
      success: true,
      data: {
        checkoutUrl,
        sessionId,
        paymentMethod,
        planId
      }
    });
  } catch (error) {
    console.error('❌ Errore selezione piano:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 10. Creazione checkout
app.post('/api/payments/create-checkout', verifyToken, (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    
    // Simula creazione checkout
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
    
    res.json({
      success: true,
      data: {
        checkoutUrl,
        sessionId,
        paymentMethod,
        planId
      }
    });
  } catch (error) {
    console.error('❌ Errore creazione checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 11. Generazione bonifico bancario
app.post('/api/payments/bank-transfer', verifyToken, (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    // Simula generazione bonifico
    const iban = "IT60X0542811101000000123456";
    const causale = `WASHWORLD-AMB-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Scade in 7 giorni
    
    res.json({
      success: true,
      data: {
        iban,
        causale,
        amount,
        expiresAt: expiresAt.toISOString(),
        receipt: {
          pdfUrl: `/receipts/bank-transfer-${Date.now()}.pdf`
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore generazione bonifico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ========================================
// 🔗 WEBHOOKS PAGAMENTI
// ========================================

// 12. Webhook Stripe
app.post('/api/webhooks/stripe', (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log('🔗 Webhook Stripe ricevuto:', type);
    
    if (type === 'checkout.session.completed') {
      const { id, payment_status, customer } = data.object;
      
      console.log('✅ Pagamento completato:', {
        sessionId: id,
        status: payment_status,
        customer
      });
      
      // Aggiorna stato utente
      const user = users.find(u => u.id === 1) || users[0];
      user.subscriptionActive = true;
      user.kycStatus = 'approved';
      user.onboardingLevel = 5;
      
      saveUsersToFile(users);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Errore webhook Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 13. Webhook PayPal
app.post('/api/webhooks/paypal', (req, res) => {
  try {
    console.log('🔗 Webhook PayPal ricevuto');
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Errore webhook PayPal:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// 14. Webhook Crypto
app.post('/api/webhooks/crypto', (req, res) => {
  try {
    console.log('🔗 Webhook Crypto ricevuto');
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Errore webhook Crypto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

app.post('/api/onboarding/tasks/:id/complete', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  const user = users[0]; // Usa il primo utente per demo

  if (task) {
    console.log('✅ Task completato:', task.title);
    
    // Assicurati che completedTasks sia sempre un array
    if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
      user.completedTasks = [];
    }
    
    if (!user.completedTasks || !user.completedTasks.includes(taskId)) {
      user.completedTasks.push(taskId);
      
      // Aggiorna i punti, token ed esperienza dell'utente
      user.points += task.rewards.points;
      user.tokens += task.rewards.tokens;
      user.experience += task.rewards.experience;
      
      // Salva gli utenti aggiornati
      saveUsersToFile(users);
      
      console.log('💾 Utente aggiornato:', {
        completedTasks: user.completedTasks,
        points: user.points,
        tokens: user.tokens,
        experience: user.experience
      });
    }

    res.json({
      success: true,
      message: 'Task completato con successo',
      data: {
        rewards: task.rewards,
        nextTask: tasks.find(t => t.id === taskId + 1),
        user: {
          points: user.points,
          tokens: user.tokens,
          experience: user.experience,
          completedTasks: user.completedTasks
        }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Task non trovato'
    });
  }
});

app.get('/api/onboarding/badges', (req, res) => {
  res.json({
    success: true,
    data: badges
  });
});

// API WALLET
app.get('/api/wallet/balance', (req, res) => {
  const user = users[0];

  res.json({
    success: true,
    data: {
      balance: user.wallet.balance,
      tokens: user.tokens,
      transactions: user.wallet.transactions
    }
  });
});

// API AMBASSADOR
app.post('/api/ambassador/upgrade', verifyToken, (req, res) => {
  console.log('🚀 Upgrade MLM request');

  // Per ora, blocchiamo tutti gli upgrade per sicurezza
  // In un sistema reale, dovremmo mappare correttamente il token all'utente
  return res.status(403).json({
    success: false,
    error: 'Upgrade temporaneamente disabilitato per proteggere gli admin'
  });

  // Codice originale commentato per sicurezza
  /*
  // Verifica che l'utente sia autenticato
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }

  // Trova l'utente autenticato
  const authenticatedUser = users.find(u => u.username === req.user?.username);
  if (!authenticatedUser) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }

  // Verifica che l'utente non sia admin
  if (authenticatedUser.role === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Gli admin non possono essere aggiornati a MLM Ambassador'
    });
  }

  // Aggiorna solo se è entry_ambassador
  if (authenticatedUser.role === 'entry_ambassador') {
    authenticatedUser.role = 'mlm_ambassador';
    authenticatedUser.commissionRate = 0.10; // 10% per MLM Ambassador

    // Salva le modifiche
    saveUsersToFile(users);

    res.json({
      success: true,
      message: 'Upgrade a MLM Ambassador completato!',
      data: {
        newRole: authenticatedUser.role,
        newCommissionRate: authenticatedUser.commissionRate
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Solo gli entry_ambassador possono essere aggiornati'
    });
  }
  */
});

// API ADMIN - Ripristina ruolo admin
app.post('/api/admin/restore-admin', verifyToken, (req, res) => {
  console.log('👑 Restore admin role request');
  
  try {
    // Trova l'utente admin
    const adminUser = users.find(u => u.username === 'admin');
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente admin non trovato'
      });
    }

    // Ripristina il ruolo admin
    adminUser.role = 'admin';
    adminUser.commissionRate = 0.15; // 15% per admin

    // Salva le modifiche
    saveUsersToFile(users);

    res.json({
      success: true,
      message: 'Ruolo admin ripristinato con successo!',
      data: {
        username: adminUser.username,
        role: adminUser.role,
        commissionRate: adminUser.commissionRate
      }
    });
  } catch (error) {
    console.error('❌ Errore ripristino admin:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API ADMIN - Dashboard (RIMOSSO - Admin non deve fare l'ambassador)
// L'admin ora usa solo /api/admin/stats per statistiche pure

// API ADMIN - Lista Utenti (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API ADMIN - Dettagli Utente (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API ADMIN - Aggiorna Utente (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API ADMIN - Crea Nuovo Utente (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API ADMIN - Elimina Utente (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API ADMIN - Statistiche Dettagliate (DUPLICATO RIMOSSO - Usa l'endpoint corretto sopra)

// API REFERRAL SYSTEM
app.get('/api/referral/code/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }

  // Se l'utente non ha un referral code o ha un codice troppo semplice, generane uno nuovo
  if (!user.referralCode || user.referralCode.length < 15 || !user.referralCode.includes('-')) {
    user.referralCode = generateUniqueReferralCode(user);
    saveUsersToFile(users);
    console.log('🔄 Referral code rigenerato per utente:', user.id, 'Nuovo codice:', user.referralCode);
  }

  res.json({
    success: true,
    data: {
      referralCode: user.referralCode,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
});

app.get('/api/referral/list/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }

  // Trova tutti i referral di questo utente
  const referrals = users.filter(u => u.referredBy === userId).map(referral => ({
    id: referral.id,
    firstName: referral.firstName,
    lastName: referral.lastName,
    email: referral.email,
    role: referral.role,
    status: referral.isActive ? 'active' : 'inactive',
    joinDate: referral.createdAt,
    lastActivity: referral.lastLogin,
    commissionEarned: referral.totalCommissions * 0.1, // 10% delle commissioni del referral
    level: referral.level,
    totalSales: referral.totalSales
  }));

  res.json({
    success: true,
    data: {
      referrals: referrals,
      stats: {
        total: referrals.length,
        active: referrals.filter(r => r.status === 'active').length,
        totalCommissionEarned: referrals.reduce((sum, r) => sum + r.commissionEarned, 0)
      }
    }
  });
});

app.post('/api/referral/invite', (req, res) => {
  const { referrerId, email, firstName, lastName } = req.body;
  
  const referrer = users.find(u => u.id === parseInt(referrerId));
  
  if (!referrer) {
    return res.status(404).json({
      success: false,
      error: 'Referrer non trovato'
    });
  }

  // Verifica se l'email esiste già
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Utente con questa email esiste già'
    });
  }

  // Crea nuovo utente con referral
  const newUser = {
    id: users.length + 1,
    username: email.split('@')[0],
    email: email,
    firstName: firstName,
    lastName: lastName,
    password: 'password123', // Password temporanea
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    onboardingLevel: 1,
    points: 0,
    tokens: 0,
    role: 'entry_ambassador',
    commissionRate: 0.05,
    referralCode: generateUniqueReferralCode({ firstName, lastName }),
    referredBy: referrer.id,
    totalSales: 0,
    totalCommissions: 0,
    wallet: {
      balance: 0,
      transactions: []
    },
    badges: [],
    completedTasks: [],
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString()
  };

  users.push(newUser);
  saveUsersToFile(users);

  console.log('✅ Nuovo referral creato:', {
    id: newUser.id,
    email: newUser.email,
    referredBy: referrer.id,
    referralCode: newUser.referralCode
  });

  res.json({
    success: true,
    message: 'Invito referral inviato con successo',
    data: {
      newUser: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        referralCode: newUser.referralCode
      },
      referrer: {
        id: referrer.id,
        firstName: referrer.firstName,
        lastName: referrer.lastName,
        referralCode: referrer.referralCode
      }
    }
  });
});

app.post('/api/referral/validate', (req, res) => {
  const { referralCode } = req.body;
  
  const referrer = users.find(u => u.referralCode === referralCode);
  
  if (!referrer) {
    return res.status(404).json({
      success: false,
      error: 'Codice referral non valido'
    });
  }

  res.json({
    success: true,
    data: {
      referrer: {
        id: referrer.id,
        firstName: referrer.firstName,
        lastName: referrer.lastName,
        role: referrer.role,
        referralCode: referrer.referralCode
      }
    }
  });
});

app.get('/api/referral/stats/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }

  // Trova tutti i referral di questo utente
  const referrals = users.filter(u => u.referredBy === userId);
  
  const stats = {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter(r => r.isActive).length,
    totalCommissionEarned: referrals.reduce((sum, r) => sum + (r.totalCommissions * 0.1), 0),
    averageCommissionPerReferral: referrals.length > 0 ? 
      referrals.reduce((sum, r) => sum + (r.totalCommissions * 0.1), 0) / referrals.length : 0,
    topReferral: referrals.length > 0 ? 
      referrals.reduce((max, r) => r.totalCommissions > max.totalCommissions ? r : max) : null,
    recentReferrals: referrals
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        joinDate: r.createdAt,
        totalSales: r.totalSales,
        totalCommissions: r.totalCommissions
      }))
  };

  res.json({
    success: true,
    data: stats
  });
});

// ===== API GESTIONE COMMISSIONI MLM =====

// API - Dashboard Commissioni
app.get('/api/mlm/commissions', verifyToken, async (req, res) => {
  try {
    console.log('💰 MLM commissions request');
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id) || users[0];
    
    // Carica commissioni dal file
    const commissions = loadCommissionsFromFile();
    const userCommissions = commissions.filter(c => c.userId === user.id);
  
  const stats = {
    totalEarned: userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    pendingAmount: userCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    paidAmount: userCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    thisMonth: userCommissions
      .filter(c => {
        const commissionDate = new Date(c.date);
        const now = new Date();
        return commissionDate.getMonth() === now.getMonth() && 
               commissionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    commissionRate: user.commissionRate,
    role: user.role
  };

    res.json({
      success: true,
      data: {
        stats,
        commissions: userCommissions,
        recentCommissions: userCommissions.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('❌ Errore server:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Storico Vendite
app.get('/api/mlm/sales', verifyToken, async (req, res) => {
  try {
    console.log('📊 MLM sales request');
    
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === req.user.id) || users[0];
    
    // Carica vendite dal file
    const sales = loadSalesFromFile();
    const userSales = sales.filter(s => s.userId === user.id);
  
  const stats = {
    totalSales: userSales.reduce((sum, s) => sum + s.amount, 0),
    totalCommissions: userSales.reduce((sum, s) => sum + s.commissionEarned, 0),
    totalOrders: userSales.length,
    averageOrderValue: userSales.length > 0 ? 
      userSales.reduce((sum, s) => sum + s.amount, 0) / userSales.length : 0
  };

    res.json({
      success: true,
      data: {
        stats,
        sales: userSales
      }
    });
  } catch (error) {
    console.error('❌ Errore server:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Gestione Referral
app.get('/api/mlm/referrals', (req, res) => {
  console.log('👥 MLM referrals request');
  
  const user = users[0];
  const userReferrals = referrals.filter(r => r.referrerId === user.id);
  
  const stats = {
    totalReferrals: userReferrals.length,
    activeReferrals: userReferrals.filter(r => r.status === 'active').length,
    pendingReferrals: userReferrals.filter(r => r.status === 'pending').length,
    totalEarned: userReferrals.reduce((sum, r) => sum + r.commissionEarned, 0),
    referralCode: user.referralCode
  };

  res.json({
    success: true,
    data: {
      stats,
      referrals: userReferrals
    }
  });
});

// API - Nuovo Referral
app.post('/api/mlm/referrals', (req, res) => {
  console.log('➕ New referral request');
  
  const { email, name } = req.body;
  const user = users[0];
  
  const newReferral = {
    id: referrals.length + 1,
    referrerId: user.id,
    referredEmail: email,
    referredName: name,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    commissionEarned: 0
  };
  
  referrals.push(newReferral);
  
  res.json({
    success: true,
    message: 'Referral creato con successo',
    data: newReferral
  });
});

// API - Richiesta Pagamento Commissioni
app.post('/api/mlm/request-payment', (req, res) => {
  console.log('💳 MLM payment request');
  
  const user = users[0];
  const pendingCommissions = commissions.filter(c => 
    c.userId === user.id && c.status === 'pending'
  );
  
  if (pendingCommissions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nessuna commissione in attesa di pagamento'
    });
  }
  
  const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  
  // Simula il processo di pagamento
  pendingCommissions.forEach(commission => {
    commission.status = 'processing';
  });
  
  res.json({
    success: true,
    message: 'Richiesta di pagamento inviata con successo',
    data: {
      totalAmount,
      commissionsCount: pendingCommissions.length,
      estimatedProcessingTime: '3-5 giorni lavorativi'
    }
  });
});

// API per Status Ambasciatore Completo
app.get('/api/ambassador/status/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Calcola tutti i dati dello status
    const statusData = await calculateAmbassadorStatus(user);
    
    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('❌ Errore status ambasciatore:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API per Albero Referral Completo
app.get('/api/ambassador/network/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Calcola l'albero referral completo
    const networkData = await calculateReferralNetwork(user);
    
    res.json({
      success: true,
      data: networkData
    });
  } catch (error) {
    console.error('❌ Errore network referral:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API per Performance Analytics
app.get('/api/ambassador/performance/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Calcola analytics performance
    const performanceData = await calculatePerformanceAnalytics(user);
    
    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('❌ Errore performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Report Commissioni
app.get('/api/mlm/reports', (req, res) => {
  console.log('📈 MLM reports request');
  
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  const user = users[0];
  const userCommissions = commissions.filter(c => c.userId === user.id);
  const userSales = sales.filter(s => s.userId === user.id);
  
  const report = {
    period: 'Ultimi 30 giorni',
    commissions: {
      total: userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      byType: {
        direct_sale: userCommissions
          .filter(c => c.type === 'direct_sale')
          .reduce((sum, c) => sum + c.commissionAmount, 0),
        referral: userCommissions
          .filter(c => c.type === 'referral')
          .reduce((sum, c) => sum + c.commissionAmount, 0),
        bonus: userCommissions
          .filter(c => c.type === 'bonus')
          .reduce((sum, c) => sum + c.commissionAmount, 0)
      }
    },
    sales: {
      total: userSales.reduce((sum, s) => sum + s.amount, 0),
      orders: userSales.length,
      averageOrder: userSales.length > 0 ? 
        userSales.reduce((sum, s) => sum + s.amount, 0) / userSales.length : 0
    },
    performance: {
      commissionRate: user.commissionRate,
      conversionRate: userSales.length > 0 ? 85 : 0, // Simulato
      customerRetention: 92 // Simulato
    }
  };

  res.json({
    success: true,
    data: report
  });
});

// API - Prodotti Disponibili
app.get('/api/mlm/products', (req, res) => {
  console.log('🛍️ MLM products request');
  
  const products = [
    {
      id: 1,
      name: 'Detergente Eco',
      description: 'Detergente multiuso biodegradabile',
      price: 300,
      commission: 15,
      category: 'pulizia',
      image: '🌿'
    },
    {
      id: 2,
      name: 'Spazzolino Biodegradabile',
      description: 'Spazzolino in bambù con setole naturali',
      price: 200,
      commission: 10,
      category: 'igiene',
      image: '🦷'
    },
    {
      id: 3,
      name: 'Kit Completo Eco',
      description: 'Kit completo per casa sostenibile',
      price: 1500,
      commission: 75,
      category: 'kit',
      image: '📦'
    },
    {
      id: 4,
      name: 'Borsa Shopping Riutilizzabile',
      description: 'Borsa in cotone organico',
      price: 500,
      commission: 25,
      category: 'accessori',
      image: '👜'
    }
  ];

  res.json({
    success: true,
    data: products
  });
});

// API - Nuova Vendita
app.post('/api/mlm/sales', (req, res) => {
  console.log('🛒 New sale request');
  
  const { customerName, customerEmail, products } = req.body;
  const user = users[0];
  
  const totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const commissionEarned = totalAmount * user.commissionRate;
  
  const newSale = {
    id: sales.length + 1,
    userId: user.id,
    customerName,
    customerEmail,
    products,
    totalAmount,
    commissionEarned,
    date: new Date().toISOString().split('T')[0],
    status: 'completed'
  };
  
  sales.push(newSale);
  
  // Crea anche la commissione
  const newCommission = {
    id: commissions.length + 1,
    userId: user.id,
    type: 'direct_sale',
    amount: totalAmount,
    commissionRate: user.commissionRate,
    commissionAmount: commissionEarned,
    status: 'pending',
    date: newSale.date,
    description: `Vendita a ${customerName}`
  };
  
  commissions.push(newCommission);
  
  // Aggiorna le statistiche utente
  user.totalSales += totalAmount;
  user.totalCommissions += commissionEarned;
  user.wallet.balance += commissionEarned;
  
  res.json({
    success: true,
    message: 'Vendita registrata con successo',
    data: {
      sale: newSale,
      commission: newCommission
    }
  });
});

// ===== API ADMIN MLM =====

// API ADMIN - Tutte le Commissioni
app.get('/api/admin/commissions', verifyToken, (req, res) => {
  try {
    console.log('👑 Admin commissions request');
    
    // Carica commissioni dal file
    const commissions = loadCommissionsFromFile();
    const users = loadUsersFromFile();
    
    const allCommissions = commissions.map(commission => {
      const user = users.find(u => u.id === commission.userId);
      return {
        ...commission,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto',
        userEmail: user ? user.email : 'N/A'
      };
    });
    
    const stats = {
      totalCommissions: allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      pendingCommissions: allCommissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      paidCommissions: allCommissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      thisMonth: allCommissions
        .filter(c => {
          const commissionDate = new Date(c.date);
          const now = new Date();
          return commissionDate.getMonth() === now.getMonth() && 
                 commissionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      totalSales: allCommissions.reduce((sum, c) => sum + c.amount, 0),
      totalOrders: allCommissions.length,
      averageCommission: allCommissions.length > 0 ? 
        allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0) / allCommissions.length : 0
    };

    res.json({
      success: true,
      data: {
        stats,
        commissions: allCommissions
      }
    });
  } catch (error) {
    console.error('❌ Errore server:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API ADMIN - Tutte le Vendite
app.get('/api/admin/sales', verifyToken, (req, res) => {
  try {
    console.log('👑 Admin sales request');
    
    // Carica vendite dal file
    const sales = loadSalesFromFile();
    const users = loadUsersFromFile();
    
    const allSales = sales.map(sale => {
      const user = users.find(u => u.id === sale.userId);
      return {
        ...sale,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto',
        userEmail: user ? user.email : 'N/A'
      };
    });
    
    const stats = {
      totalSales: allSales.reduce((sum, s) => sum + s.amount, 0),
      totalCommissions: allSales.reduce((sum, s) => sum + s.commissionEarned, 0),
      totalOrders: allSales.length,
      averageOrderValue: allSales.length > 0 ? 
        allSales.reduce((sum, s) => sum + s.amount, 0) / allSales.length : 0
    };

    res.json({
      success: true,
      data: {
        stats,
        sales: allSales
      }
    });
  } catch (error) {
    console.error('❌ Errore server:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// POST - Crea nuova vendita
app.post('/api/admin/sales', verifyToken, (req, res) => {
  console.log('🆕 Admin: Creazione nuova vendita');
  
  const {
    userId,
    productName,
    amount,
    commissionRate,
    status
  } = req.body;
  
  // Validazione
  if (!userId || !productName || !amount) {
    return res.status(400).json({
      success: false,
      error: 'UserId, nome prodotto e importo sono obbligatori'
    });
  }
  
  // Verifica che l'utente esista usando il sistema CRUD
  const user = usersCRUD.readById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  // Calcola commissione
  const commissionEarned = amount * (commissionRate || user.commissionRate || 0.05);
  
  // Crea nuova vendita
  const newSale = {
    userId: parseInt(userId),
    products: [{
      name: productName,
      quantity: 1,
      price: parseFloat(amount)
    }],
    amount: parseFloat(amount),
    commissionRate: commissionRate || user.commissionRate || 0.05,
    commissionEarned,
    status: status || 'completed',
    date: new Date().toISOString()
  };
  
  // Usa il sistema CRUD per salvare la vendita
  const saleResult = salesCRUD.create(newSale);
  
  if (saleResult.success) {
    // Aggiorna statistiche utente usando il sistema CRUD
    const updatedUser = {
      ...user,
      totalSales: (user.totalSales || 0) + parseFloat(amount),
      totalCommissions: (user.totalCommissions || 0) + commissionEarned
    };
    
    const userResult = usersCRUD.update(userId, updatedUser);
    
    if (userResult.success) {
      res.status(201).json({
        success: true,
        message: 'Vendita creata con successo',
        data: newSale
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore nell\'aggiornamento dell\'utente'
      });
    }
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nel salvataggio della vendita'
    });
  }
});

// PUT - Aggiorna vendita
app.put('/api/admin/sales/:id', verifyToken, (req, res) => {
  console.log(`✏️ Admin: Aggiornamento vendita ID ${req.params.id}`);
  
  const saleId = parseInt(req.params.id);
  const saleIndex = sales.findIndex(s => s.id === saleId);
  
  if (saleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Vendita non trovata'
    });
  }
  
  const {
    productName,
    amount,
    commissionRate,
    status
  } = req.body;
  
  // Calcola nuova commissione se l'importo è cambiato
  let commissionEarned = sales[saleIndex].commissionEarned;
  if (amount) {
    const rate = commissionRate || sales[saleIndex].commissionRate;
    commissionEarned = parseFloat(amount) * rate;
  }
  
  // Aggiorna la vendita
  const updatedSale = {
    ...sales[saleIndex],
    ...(productName && { productName }),
    ...(amount && { amount: parseFloat(amount) }),
    ...(commissionRate && { commissionRate }),
    ...(commissionEarned && { commissionEarned }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };
  
  sales[saleIndex] = updatedSale;
  
  // Salva su file
  if (saveSalesToFile(sales)) {
    res.json({
      success: true,
      message: 'Vendita aggiornata con successo',
      data: updatedSale
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento della vendita'
    });
  }
});

// DELETE - Elimina vendita
app.delete('/api/admin/sales/:id', verifyToken, (req, res) => {
  console.log(`🗑️ Admin: Eliminazione vendita ID ${req.params.id}`);
  
  const saleId = parseInt(req.params.id);
  const saleIndex = sales.findIndex(s => s.id === saleId);
  
  if (saleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Vendita non trovata'
    });
  }
  
  // Rimuovi la vendita
  const deletedSale = sales.splice(saleIndex, 1)[0];
  
  // Salva su file
  if (saveSalesToFile(sales)) {
    res.json({
      success: true,
      message: 'Vendita eliminata con successo',
      data: deletedSale
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione della vendita'
    });
  }
});

// API ADMIN - Tutti i Referral
app.get('/api/admin/referrals', (req, res) => {
  console.log('👑 Admin referrals request');
  
  const allReferrals = referrals.map(referral => {
    const user = users.find(u => u.id === referral.referrerId);
    return {
      ...referral,
      referrerName: user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto',
      referrerEmail: user ? user.email : 'N/A'
    };
  });
  
  const stats = {
    totalReferrals: allReferrals.length,
    activeReferrals: allReferrals.filter(r => r.status === 'active').length,
    pendingReferrals: allReferrals.filter(r => r.status === 'pending').length,
    totalEarned: allReferrals.reduce((sum, r) => sum + r.commissionEarned, 0)
  };

  res.json({
    success: true,
    data: {
      stats,
      referrals: allReferrals
    }
  });
});

// API ADMIN - Approva Commissione
app.put('/api/admin/commissions/:id/approve', (req, res) => {
  console.log('👑 Admin approve commission request');
  
  const commissionId = parseInt(req.params.id);
  const commission = commissions.find(c => c.id === commissionId);
  
  if (!commission) {
    return res.status(404).json({
      success: false,
      error: 'Commissione non trovata'
    });
  }
  
  commission.status = 'paid';
  
  res.json({
    success: true,
    message: 'Commissione approvata con successo',
    data: commission
  });
});

// API ADMIN - Rifiuta Commissione
app.put('/api/admin/commissions/:id/reject', (req, res) => {
  console.log('👑 Admin reject commission request');
  
  const commissionId = parseInt(req.params.id);
  const commission = commissions.find(c => c.id === commissionId);
  
  if (!commission) {
    return res.status(404).json({
      success: false,
      error: 'Commissione non trovata'
    });
  }
  
  commission.status = 'rejected';
  
  res.json({
    success: true,
    message: 'Commissione rifiutata',
    data: commission
  });
});

// API ADMIN - Report MLM Completo
app.get('/api/admin/mlm-report', (req, res) => {
  console.log('👑 Admin MLM report request');
  
  const mlmUsers = users.filter(u => u.role === 'mlm_ambassador' || u.role === 'entry_ambassador');
  const allCommissions = commissions;
  const allSales = sales;
  const allReferrals = referrals;
  
  const report = {
    period: 'Ultimi 30 giorni',
    users: {
      total: mlmUsers.length,
      mlm_ambassadors: mlmUsers.filter(u => u.role === 'mlm_ambassador').length,
      entry_ambassadors: mlmUsers.filter(u => u.role === 'entry_ambassador').length,
      active: mlmUsers.filter(u => u.isActive).length
    },
    commissions: {
      total: allCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      pending: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
      paid: allCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
      byType: {
        direct_sale: allCommissions.filter(c => c.type === 'direct_sale').reduce((sum, c) => sum + c.commissionAmount, 0),
        referral: allCommissions.filter(c => c.type === 'referral').reduce((sum, c) => sum + c.commissionAmount, 0),
        bonus: allCommissions.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.commissionAmount, 0)
      }
    },
    sales: {
      total: allSales.reduce((sum, s) => sum + s.amount, 0),
      orders: allSales.length,
      averageOrder: allSales.length > 0 ? 
        allSales.reduce((sum, s) => sum + s.amount, 0) / allSales.length : 0
    },
    referrals: {
      total: allReferrals.length,
      active: allReferrals.filter(r => r.status === 'active').length,
      pending: allReferrals.filter(r => r.status === 'pending').length,
      totalEarned: allReferrals.reduce((sum, r) => sum + r.commissionEarned, 0)
    },
    topPerformers: mlmUsers
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, 10)
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        totalSales: user.totalSales,
        totalCommissions: user.totalCommissions,
        commissionRate: user.commissionRate
      }))
  };

  res.json({
    success: true,
    data: report
  });
});

// ========================================
// ADMIN API - GESTIONE PIANI COMMISSIONI (CRUD)
// ========================================

// GET - Statistiche admin
app.get('/api/admin/stats', verifyToken, (req, res) => {
  console.log('📊 Admin: Richiesta statistiche');
  
  try {
    // Calcola statistiche
    const totalUsers = users.length;
    const totalTasks = tasks.length;
    const activeAmbassadors = users.filter(u => u.role === 'ambassador' && u.isActive).length;
    const totalCommissions = users.reduce((sum, user) => sum + (user.totalCommissions || 0), 0);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        activeAmbassadors,
        totalCommissions
      }
    });
  } catch (error) {
    console.error('❌ Errore calcolo statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo delle statistiche'
    });
  }
});

// GET - Lista tutti i piani commissioni
app.get('/api/admin/commission-plans', verifyToken, (req, res) => {
  console.log('📋 Admin: Richiesta lista piani commissioni');
  
  res.json({
    success: true,
    data: commissionPlans
  });
});

// POST - Crea nuovo piano commissioni
app.post('/api/admin/commission-plans', verifyToken, (req, res) => {
  console.log('🆕 Admin: Creazione nuovo piano commissioni');
  
  const {
    name,
    code,
    directSale,
    level1,
    level2,
    level3,
    level4,
    level5,
    minPoints,
    minTasks,
    minSales,
    cost,
    description,
    isActive
  } = req.body;
  
  // Validazione
  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: 'Nome e codice sono obbligatori'
    });
  }
  
  // Verifica codice univoco
  const existingPlan = commissionPlans.find(p => p.code === code);
  if (existingPlan) {
    return res.status(400).json({
      success: false,
      error: 'Codice piano già esistente'
    });
  }
  
  // Crea nuovo piano
  const newPlan = {
    id: commissionPlans.length + 1,
    name,
    code,
    directSale: parseFloat(directSale) || 0,
    level1: parseFloat(level1) || 0,
    level2: parseFloat(level2) || 0,
    level3: parseFloat(level3) || 0,
    level4: parseFloat(level4) || 0,
    level5: parseFloat(level5) || 0,
    minPoints: parseInt(minPoints) || 0,
    minTasks: parseInt(minTasks) || 0,
    minSales: parseInt(minSales) || 0,
    cost: parseFloat(cost) || 0,
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  commissionPlans.push(newPlan);
  
  // Salva su file
  if (saveCommissionPlansToFile(commissionPlans)) {
    res.status(201).json({
      success: true,
      message: 'Piano commissioni creato con successo',
      data: newPlan
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nel salvataggio del piano'
    });
  }
});

// PUT - Aggiorna piano commissioni
app.put('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  console.log(`✏️ Admin: Aggiornamento piano commissioni ID ${req.params.id}`);
  
  const planId = parseInt(req.params.id);
  const planIndex = commissionPlans.findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Piano commissioni non trovato'
    });
  }
  
  const {
    name,
    code,
    directSale,
    level1,
    level2,
    level3,
    level4,
    level5,
    minPoints,
    minTasks,
    minSales,
    cost,
    description,
    isActive
  } = req.body;
  
  // Validazione
  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: 'Nome e codice sono obbligatori'
    });
  }
  
  // Verifica codice univoco (escludendo il piano corrente)
  const existingPlan = commissionPlans.find(p => p.code === code && p.id !== planId);
  if (existingPlan) {
    return res.status(400).json({
      success: false,
      error: 'Codice piano già esistente'
    });
  }
  
  // Aggiorna piano
  const updatedPlan = {
    ...commissionPlans[planIndex],
    name,
    code,
    directSale: parseFloat(directSale) || 0,
    level1: parseFloat(level1) || 0,
    level2: parseFloat(level2) || 0,
    level3: parseFloat(level3) || 0,
    level4: parseFloat(level4) || 0,
    level5: parseFloat(level5) || 0,
    minPoints: parseInt(minPoints) || 0,
    minTasks: parseInt(minTasks) || 0,
    minSales: parseInt(minSales) || 0,
    cost: parseFloat(cost) || 0,
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  
  commissionPlans[planIndex] = updatedPlan;
  
  // Salva su file
  if (saveCommissionPlansToFile(commissionPlans)) {
    res.json({
      success: true,
      message: 'Piano commissioni aggiornato con successo',
      data: updatedPlan
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nel salvataggio del piano'
    });
  }
});

// DELETE - Elimina piano commissioni
app.delete('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  console.log(`🗑️ Admin: Eliminazione piano commissioni ID ${req.params.id}`);
  
  const planId = parseInt(req.params.id);
  const planIndex = commissionPlans.findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Piano commissioni non trovato'
    });
  }
  
  // Verifica se il piano è in uso
  const networkStructure = calculateNetworkStructure();
  const planInUse = networkStructure.some(n => n.plan === commissionPlans[planIndex].code);
  if (planInUse) {
    return res.status(400).json({
      success: false,
      error: 'Impossibile eliminare: piano in uso da alcuni utenti'
    });
  }
  
  // Elimina piano
  const deletedPlan = commissionPlans.splice(planIndex, 1)[0];
  
  // Salva su file
  if (saveCommissionPlansToFile(commissionPlans)) {
    res.json({
      success: true,
      message: 'Piano commissioni eliminato con successo',
      data: deletedPlan
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Errore nel salvataggio delle modifiche'
    });
  }
});

// GET - Dettagli piano commissioni specifico
app.get('/api/admin/commission-plans/:id', verifyToken, (req, res) => {
  console.log(`👁️ Admin: Dettagli piano commissioni ID ${req.params.id}`);
  
  const planId = parseInt(req.params.id);
  const plan = commissionPlans.find(p => p.id === planId);
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: 'Piano commissioni non trovato'
    });
  }
  
  res.json({
    success: true,
    data: plan
  });
});

// ========================================
// AMBASSADOR API - VISUALIZZAZIONE PIANI COMMISSIONI
// ========================================

// GET - Lista piani commissioni per ambassador (solo quelli attivi)
app.get('/api/ambassador/commission-plans', verifyToken, (req, res) => {
  console.log('📋 Ambassador: Richiesta lista piani commissioni');
  
  // Filtra solo i piani attivi
  const activePlans = commissionPlans.filter(plan => plan.isActive);
  
  res.json({
    success: true,
    data: activePlans
  });
});

// ========================================
// ADMIN API - GESTIONE TASK (CRUD)
// ========================================

// ========================================
// TASK MANAGEMENT API ENDPOINTS
// ========================================

// GET - Lista tutti i task
app.get('/api/admin/tasks', verifyToken, (req, res) => {
  console.log('📋 Admin tasks list request');
  console.log('📊 Tasks disponibili:', tasks ? tasks.length : 'undefined');
  
  try {
    res.json({
      success: true,
      data: tasks || []
    });
  } catch (error) {
    console.error('❌ Errore lista task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// GET - Dettagli singolo task
app.get('/api/admin/tasks/:id', verifyToken, (req, res) => {
  console.log('📋 Admin task details request:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Errore dettagli task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// POST - Crea nuovo task
app.post('/api/admin/tasks', verifyToken, (req, res) => {
  console.log('📋 Admin create task request');
  
  try {
    const {
      title,
      description,
      type,
      level,
      rewards,
      content,
      isActive
    } = req.body;
    
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Titolo, descrizione e tipo sono obbligatori'
      });
    }
    
    const newTask = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      title,
      description,
      type,
      level: level || 1,
      rewards: rewards || {
        points: 10,
        tokens: 5,
        experience: 15
      },
      content: content || {
        videoUrl: '',
        quizQuestions: [],
        documentContent: '',
        surveyQuestions: []
      },
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasksToFile(tasks);
    
    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task creato con successo'
    });
  } catch (error) {
    console.error('❌ Errore creazione task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// PUT - Aggiorna task esistente
app.put('/api/admin/tasks/:id', verifyToken, (req, res) => {
  console.log('📋 Admin update task request:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    const {
      title,
      description,
      type,
      level,
      rewards,
      content,
      isActive
    } = req.body;
    
    const updatedTask = {
      ...tasks[taskIndex],
      title: title || tasks[taskIndex].title,
      description: description || tasks[taskIndex].description,
      type: type || tasks[taskIndex].type,
      level: level || tasks[taskIndex].level,
      rewards: rewards || tasks[taskIndex].rewards,
      content: content || tasks[taskIndex].content,
      isActive: isActive !== undefined ? isActive : tasks[taskIndex].isActive,
      updatedAt: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    saveTasksToFile(tasks);
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task aggiornato con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento task:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// DELETE - Elimina task
app.delete('/api/admin/tasks/:id', verifyToken, (req, res) => {
  console.log('📋 Admin delete task request:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    saveTasksToFile(tasks);
    
    res.json({
      success: true,
      data: deletedTask,
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

// POST - Upload file per task
app.post('/api/admin/tasks/:id/upload', verifyToken, (req, res) => {
  console.log('📋 Admin upload file for task:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    // Simula upload file
    const { fileType, fileName, fileUrl } = req.body;
    
    if (!fileType || !fileName || !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Tipo file, nome file e URL sono obbligatori'
      });
    }
    
    // Aggiorna il contenuto del task in base al tipo
    if (task.type === 'video' && fileType === 'video') {
      task.content.videoUrl = fileUrl;
    } else if (task.type === 'document' && fileType === 'document') {
      task.content.documentUrl = fileUrl;
    }
    
    task.updatedAt = new Date().toISOString();
    saveTasksToFile(tasks);
    
    res.json({
      success: true,
      data: task,
      message: 'File caricato con successo'
    });
  } catch (error) {
    console.error('❌ Errore upload file:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// POST - Aggiungi domanda quiz
app.post('/api/admin/tasks/:id/quiz-questions', verifyToken, (req, res) => {
  console.log('📋 Admin add quiz question for task:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è di tipo quiz'
      });
    }
    
    const { question, options, correctAnswer } = req.body;
    
    if (!question || !options || correctAnswer === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Domanda, opzioni e risposta corretta sono obbligatori'
      });
    }
    
    const newQuestion = {
      id: task.content.quizQuestions.length + 1,
      question,
      options,
      correctAnswer
    };
    
    task.content.quizQuestions.push(newQuestion);
    task.updatedAt = new Date().toISOString();
    saveTasksToFile(tasks);
    
    res.json({
      success: true,
      data: task,
      message: 'Domanda quiz aggiunta con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiunta domanda quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// POST - Aggiungi domanda survey
app.post('/api/admin/tasks/:id/survey-questions', verifyToken, (req, res) => {
  console.log('📋 Admin add survey question for task:', req.params.id);
  
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task non trovato'
      });
    }
    
    if (task.type !== 'survey') {
      return res.status(400).json({
        success: false,
        error: 'Questo task non è di tipo survey'
      });
    }
    
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Domanda è obbligatoria'
      });
    }
    
    task.content.surveyQuestions.push(question);
    task.updatedAt = new Date().toISOString();
    saveTasksToFile(tasks);
    
    res.json({
      success: true,
      data: task,
      message: 'Domanda survey aggiunta con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiunta domanda survey:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// ========================================
// END TASK MANAGEMENT API ENDPOINTS
// ========================================

// ... existing code ...

// POST /api/admin/upload - Upload file (video, documenti)
app.post('/api/admin/upload', verifyToken, (req, res) => {
  try {
    // Per ora simuliamo l'upload
    // In produzione dovremmo usare multer per gestire i file
    const { type } = req.body;
    
    // Simula URL del file caricato
    const fileUrl = `/uploads/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${type === 'video' ? 'mp4' : 'pdf'}`;
    
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: `file-${Date.now()}.${type === 'video' ? 'mp4' : 'pdf'}`,
        size: Math.floor(Math.random() * 10000000) + 1000000, // 1-10MB
        type: type
      },
      message: 'File caricato con successo'
    });
  } catch (error) {
    console.error('❌ Errore upload file:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni dati dashboard completi
app.get('/api/dashboard/:userId', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUsersFromFile();
    const tasks = loadTasksFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Assicurati che completedTasks sia un array
    if (!user.completedTasks || !Array.isArray(user.completedTasks)) {
      user.completedTasks = [];
    }
    
    // Calcola task disponibili e completati
    const availableTasks = tasks.filter(task => 
      task.isActive && (!user.completedTasks || !user.completedTasks.includes(task.id))
    );
    
    const completedTasks = tasks.filter(task => 
      user.completedTasks && user.completedTasks.includes(task.id)
    );
    
    // Calcola progresso
    const totalTasks = tasks.filter(task => task.isActive).length;
    const completedCount = user.completedTasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    
    const dashboardData = {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        points: user.points || 0,
        tokens: user.tokens || 0,
        experience: user.experience || 0,
        experienceToNextLevel: user.experienceToNextLevel || 100,
        level: user.level || 1,
        role: user.role || 'entry_ambassador',
        onboardingLevel: user.onboardingLevel || 1,
        kycStatus: user.kycStatus || 'pending'
      },
      progress: {
        completedTasks: completedCount,
        totalTasks: totalTasks,
        percentage: progressPercentage
      },
      availableTasks: availableTasks,
      completedTasks: completedTasks,
      recentActivity: user.wallet?.transactions?.slice(-5) || []
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Errore caricamento dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API per ottenere pacchetti disponibili
app.get('/api/packages/available', verifyToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }
    
    const commissionPlans = loadCommissionPlansFromFile();
    const availablePackages = commissionPlans.filter(package => {
      if (!package.isActive) return false;
      
      // Verifica se l'utente ha già acquistato questo pacchetto
      const alreadyPurchased = user.purchasedPackages && 
        user.purchasedPackages.some(p => p.packageId === package.id);
      
      if (alreadyPurchased) return false;
      
      // Verifica requisiti
      const meetsPoints = user.points >= package.minPoints;
      const meetsTasks = (user.completedTasks && user.completedTasks.length) >= package.minTasks;
      const meetsSales = user.totalSales >= package.minSales;
      
      return meetsPoints && meetsTasks && meetsSales;
    });
    
    res.json({
      success: true,
      data: {
        packages: availablePackages,
        userRequirements: {
          points: user.points,
          completedTasks: user.completedTasks ? user.completedTasks.length : 0,
          totalSales: user.totalSales
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Errore pacchetti disponibili:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// API per ottenere pacchetti acquistati dall'utente
app.get('/api/packages/purchased/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = loadUsersFromFile();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }
    
    const purchasedPackages = user.purchasedPackages || [];
    
    res.json({
      success: true,
      data: {
        packages: purchasedPackages,
        totalPurchases: purchasedPackages.length,
        totalSpent: purchasedPackages.reduce((sum, p) => sum + p.cost, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Errore pacchetti acquistati:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
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
    error: 'Errore interno del server'
  });
});

// Funzioni helper per le commissioni MLM
function getUserName(userId, users) {
  const user = users.find(u => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto';
}

function getUserEmail(userId, users) {
  const user = users.find(u => u.id === userId);
  return user ? user.email : 'N/A';
}

// API ADMIN - Calcola Commissioni MLM Complete
app.get('/api/admin/mlm-commissions', verifyToken, (req, res) => {
  try {
    console.log('👑 Admin MLM commissions calculation request');
    
    const users = loadUsersFromFile();
    const sales = loadSalesFromFile();
    const commissions = loadCommissionsFromFile();
    
    // Per ora restituiamo solo le commissioni esistenti
    res.json({
      success: true,
      data: {
        stats: {
          totalCommissions: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
          pendingCommissions: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
          paidCommissions: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
          totalUsers: users.length,
          totalSales: sales.length
        },
        commissionsByUser: [],
        commissionsByLevel: {},
        allCommissions: commissions
      }
    });
  } catch (error) {
    console.error('❌ Errore server:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Credenziali: testuser / password`);
  console.log(`🔄 Referral test: GET http://localhost:${PORT}/api/referral/validate/MARO879395-EU2W-*-O`);
  console.log(`🎬 Onboarding test: GET http://localhost:${PORT}/api/onboarding/status`);
  console.log(`💳 Plans test: GET http://localhost:${PORT}/api/plans`);
  console.log(`🆔 KYC test: GET http://localhost:${PORT}/api/kyc/status`);
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

// ===== API SISTEMA COMMISSIONI MLM COMPLETO =====

// Funzione per calcolare commissioni multi-livello
const calculateMLMCommissions = (sale, mlmPlans) => {
  const commissions = [];
  const saleAmount = sale.amount;
  const sellerId = sale.userId;
  
  // Calcola struttura rete dinamicamente
  const networkStructure = calculateNetworkStructure();
  
  // Trova il venditore nella struttura rete
  const seller = networkStructure.find(n => n.userId === sellerId);
  if (!seller) return commissions;
  
  // Commissione vendita diretta per il venditore
  const sellerPlan = mlmPlans[seller.plan];
  if (sellerPlan) {
    const directCommission = saleAmount * sellerPlan.levels.direct_sale;
    commissions.push({
      userId: sellerId,
      type: 'direct_sale',
      amount: saleAmount,
      commissionAmount: directCommission,
      level: 0,
      plan: seller.plan,
      rate: sellerPlan.levels.direct_sale,
      date: sale.date,
      description: `Vendita diretta - ${sellerPlan.name}`
    });
  }
  
  // Commissioni upline (livelli superiori)
  const calculateUplineCommissions = (userId, level = 1) => {
    const member = networkStructure.find(n => n.userId === userId);
    if (!member || level > 5) return;
    
    const memberPlan = mlmPlans[member.plan];
    if (!memberPlan) return;
    
    const levelKey = `level_${level}`;
    if (memberPlan.levels[levelKey]) {
      const uplineCommission = saleAmount * memberPlan.levels[levelKey];
      commissions.push({
        userId: member.userId,
        type: 'upline_commission',
        amount: saleAmount,
        commissionAmount: uplineCommission,
        level: level,
        plan: member.plan,
        rate: memberPlan.levels[levelKey],
        date: sale.date,
        description: `Commissione livello ${level} - ${memberPlan.name}`
      });
    }
    
    // Continua con il livello superiore
    if (member.sponsorId) {
      calculateUplineCommissions(member.sponsorId, level + 1);
    }
  };
  
  // Calcola commissioni upline
  if (seller.sponsorId) {
    calculateUplineCommissions(seller.sponsorId, 1);
  }
  
  return commissions;
};

// API - Dashboard Commissioni MLM Avanzato
app.get('/api/mlm/commissions-advanced', (req, res) => {
  console.log('💰 MLM advanced commissions request');
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }
  
  const user = users.find(u => u.id === 1); // Simula utente autenticato
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  // Trova il piano dell'utente
  const networkStructure = calculateNetworkStructure();
  const userNetwork = networkStructure.find(n => n.userId === user.id);
  const userPlan = userNetwork ? mlmPlans[userNetwork.plan] : mlmPlans.ambassador;
  
  // Calcola commissioni totali
  const userCommissions = commissions.filter(c => c.userId === user.id);
  const userSales = sales.filter(s => s.userId === user.id);
  
  // Calcola commissioni multi-livello
  const allMLMCommissions = [];
  sales.forEach(sale => {
    const saleCommissions = calculateMLMCommissions(sale, mlmPlans);
    allMLMCommissions.push(...saleCommissions);
  });
  
  const userMLMCommissions = allMLMCommissions.filter(c => c.userId === user.id);
  
  const stats = {
    totalEarned: userMLMCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    pendingAmount: userMLMCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    paidAmount: userMLMCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    thisMonth: userMLMCommissions
      .filter(c => {
        const commissionDate = new Date(c.date);
        const now = new Date();
        return commissionDate.getMonth() === now.getMonth() &&
               commissionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    plan: userPlan ? userPlan.name : 'WASH THE WORLD AMBASSADOR',
    planRates: userPlan ? userPlan.levels : null
  };
  
  // Commissioni per livello
  const commissionsByLevel = {};
  for (let i = 0; i <= 5; i++) {
    const levelCommissions = userMLMCommissions.filter(c => c.level === i);
    commissionsByLevel[`level_${i}`] = {
      count: levelCommissions.length,
      amount: levelCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      rate: userPlan ? userPlan.levels[`level_${i}`] || 0 : 0
    };
  }
  
  res.json({
    success: true,
    data: {
      stats,
      commissions: userMLMCommissions,
      commissionsByLevel,
      recentCommissions: userMLMCommissions.slice(0, 10),
      plan: userPlan
    }
  });
});

// API - Piano Commissioni MLM (alias per compatibilità)
app.get('/api/mlm/plans', (req, res) => {
  console.log('📋 MLM plans request');
  
  // Reindirizza alla route corretta con autenticazione
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }
  
  // Usa i dati dei piani commissioni esistenti
  res.json({
    success: true,
    data: commissionPlans
  });
});

// API - Struttura Rete MLM (alias per compatibilità)
app.get('/api/mlm/network', async (req, res) => {
  console.log('🌐 MLM network request');
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }
  
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  // Usa l'utente dal token (simulato)
  const user = users.find(u => u.id === 1); // Simula utente autenticato
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  // Calcola dati rete reali basati sui dati degli utenti
  const networkData = await calculateReferralNetwork(user);
  
  res.json({
    success: true,
    data: networkData
  });
});

// API - Calcola Commissioni Vendita
app.post('/api/mlm/calculate-commission', (req, res) => {
  console.log('🧮 MLM commission calculation request');
  
  const { saleAmount, sellerId, productType } = req.body;
  
  if (!saleAmount || !sellerId) {
    return res.status(400).json({
      success: false,
      error: 'Importo vendita e ID venditore richiesti'
    });
  }
  
  // Simula una vendita
  const sale = {
    id: Date.now(),
    userId: sellerId,
    amount: saleAmount,
    date: new Date().toISOString().split('T')[0],
    type: 'direct_sale',
    product: productType || 'Prodotto Eco-Friendly',
    status: 'completed'
  };
  
  // Calcola commissioni
  const calculatedCommissions = calculateMLMCommissions(sale, mlmPlans);
  
  // Raggruppa per livello
  const commissionsByLevel = {};
  calculatedCommissions.forEach(commission => {
    const level = commission.level;
    if (!commissionsByLevel[level]) {
      commissionsByLevel[level] = [];
    }
    commissionsByLevel[level].push(commission);
  });
  
  const totalCommissions = calculatedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  
  res.json({
    success: true,
    data: {
      sale,
      calculatedCommissions,
      commissionsByLevel,
      totalCommissions,
      summary: {
        saleAmount,
        totalCommissions,
        commissionPercentage: ((totalCommissions / saleAmount) * 100).toFixed(2)
      }
    }
  });
});





// API - Upgrade Piano MLM
app.post('/api/mlm/upgrade-plan', (req, res) => {
  console.log('🚀 MLM plan upgrade request');
  
  const { userId, newPlan } = req.body;
  
  if (!userId || !newPlan) {
    return res.status(400).json({
      success: false,
      error: 'ID utente e nuovo piano richiesti'
    });
  }
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  const plan = mlmPlans[newPlan];
  if (!plan) {
    return res.status(400).json({
      success: false,
      error: 'Piano non valido'
    });
  }
  
  // Verifica requisiti
  const requirements = plan.requirements;
  const canUpgrade = user.points >= requirements.min_points &&
                    user.completedTasks.length >= requirements.min_tasks &&
                    user.totalSales >= requirements.min_sales;
  
  if (!canUpgrade) {
    return res.status(400).json({
      success: false,
      error: 'Requisiti non soddisfatti per l\'upgrade',
      requirements: {
        needed: requirements,
        current: {
          points: user.points,
          tasks: user.completedTasks.length,
          sales: user.totalSales
        }
      }
    });
  }
  
  // Aggiorna piano utente
  const networkStructure = calculateNetworkStructure();
  const userNetwork = networkStructure.find(n => n.userId === userId);
  if (userNetwork) {
    userNetwork.plan = newPlan;
  }
  
  res.json({
    success: true,
    message: `Upgrade a ${plan.name} completato con successo!`,
    data: {
      newPlan,
      planDetails: plan,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        plan: newPlan
      }
    }
  });
});

// API - Report Performance MLM
app.get('/api/mlm/performance-report', (req, res) => {
  console.log('📊 MLM performance report request');
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token non fornito'
    });
  }
  
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  const user = users.find(u => u.id === 1); // Simula utente autenticato
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  const networkStructure = calculateNetworkStructure();
  const userNetwork = networkStructure.find(n => n.userId === user.id);
  const userPlan = userNetwork ? mlmPlans[userNetwork.plan] : mlmPlans.ambassador;
  
  // Calcola performance
  const userSales = sales.filter(s => s.userId === user.id);
  const userCommissions = commissions.filter(c => c.userId === user.id);
  
  const performance = {
    sales: {
      total: userSales.reduce((sum, s) => sum + s.amount, 0),
      count: userSales.length,
      average: userSales.length > 0 ? 
        userSales.reduce((sum, s) => sum + s.amount, 0) / userSales.length : 0
    },
    commissions: {
      total: userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      direct: userCommissions.filter(c => c.type === 'direct_sale')
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      upline: userCommissions.filter(c => c.type === 'upline_commission')
        .reduce((sum, c) => sum + c.commissionAmount, 0)
    },
    plan: {
      name: userPlan.name,
      rates: userPlan.levels,
      requirements: userPlan.requirements
    },
    network: {
      level: userNetwork ? userNetwork.level : 0,
      downline: userNetwork ? userNetwork.downline.length : 0,
      upline: userNetwork ? userNetwork.upline.length : 0
    }
  };
  
  res.json({
    success: true,
    data: performance
  });
});



// Funzione per calcolare Status Ambasciatore Completo
async function calculateAmbassadorStatus(user) {
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  // Trova tutti i referral diretti
  const directReferrals = users.filter(u => u.referrerId === user.id);
  
  // Trova tutti i referral indiretti (secondo livello)
  const indirectReferrals = users.filter(u => 
    directReferrals.some(dr => dr.id === u.referrerId)
  );
  
  // Calcola commissioni totali
  const totalCommissions = user.totalCommissions || 0;
  const monthlyCommissions = calculateMonthlyCommissions(user);
  const weeklyCommissions = calculateWeeklyCommissions(user);
  
  // Calcola performance metrics
  const performanceMetrics = {
    conversionRate: calculateConversionRate(user),
    averageCommission: calculateAverageCommission(user),
    networkGrowth: calculateNetworkGrowth(user),
    retentionRate: calculateRetentionRate(user)
  };
  
  // Calcola requisiti per upgrade
  const upgradeRequirements = calculateUpgradeRequirements(user);
  
  // Calcola status level
  const statusLevel = calculateStatusLevel(user);
  
  return {
    // Informazioni base
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    referralCode: user.referralCode,
    
    // Status Level
    statusLevel: statusLevel.level,
    statusTitle: statusLevel.title,
    statusDescription: statusLevel.description,
    statusColor: statusLevel.color,
    
    // Commissioni
    commissionRate: user.commissionRate,
    totalCommissions: totalCommissions,
    monthlyCommissions: monthlyCommissions,
    weeklyCommissions: weeklyCommissions,
    pendingCommissions: calculatePendingCommissions(user),
    
    // Network
    directReferrals: directReferrals.length,
    indirectReferrals: indirectReferrals.length,
    totalNetworkSize: directReferrals.length + indirectReferrals.length,
    activeReferrals: directReferrals.filter(r => r.isActive).length,
    
    // Performance
    performanceMetrics: performanceMetrics,
    
    // Requisiti Upgrade
    upgradeRequirements: upgradeRequirements,
    canUpgrade: upgradeRequirements.allMet,
    
    // Gamification
    points: user.points,
    tokens: user.tokens,
    level: user.level,
    experience: user.experience,
    experienceToNextLevel: user.experienceToNextLevel,
    
    // Sales
    totalSales: user.totalSales || 0,
    monthlySales: calculateMonthlySales(user),
    weeklySales: calculateWeeklySales(user),
    
    // Timestamps
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    lastActivity: user.lastLogin,
    
    // Badges e Achievements
    badges: user.badges || [],
    achievements: calculateAchievements(user),
    
    // Wallet
    walletBalance: user.wallet?.balance || 0,
    totalTransactions: user.wallet?.transactions?.length || 0
  };
}

// Funzione per calcolare Albero Referral Completo
async function calculateReferralNetwork(user) {
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  // Trova tutti i referral diretti
  const directReferrals = users.filter(u => u.referrerId === user.id);
  
  // Costruisce l'albero completo
  const networkTree = {
    root: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      commissionRate: user.commissionRate,
      totalCommissions: user.totalCommissions || 0,
      isActive: user.isActive,
      level: 0
    },
    levels: []
  };
  
  // Primo livello (referral diretti)
  const level1 = directReferrals.map(referral => ({
    id: referral.id,
    firstName: referral.firstName,
    lastName: referral.lastName,
    role: referral.role,
    commissionRate: referral.commissionRate,
    totalCommissions: referral.totalCommissions || 0,
    isActive: referral.isActive,
    level: 1,
    parentId: user.id,
    commissionEarned: calculateCommissionFromReferral(user, referral),
    children: []
  }));
  
  networkTree.levels.push({
    level: 1,
    referrals: level1,
    totalCount: level1.length,
    activeCount: level1.filter(r => r.isActive).length,
    totalCommissions: level1.reduce((sum, r) => sum + r.commissionEarned, 0)
  });
  
  // Secondo livello (referral indiretti)
  const level2 = [];
  for (const level1Referral of level1) {
    const indirectReferrals = users.filter(u => u.referrerId === level1Referral.id);
    const level2Referrals = indirectReferrals.map(referral => ({
      id: referral.id,
      firstName: referral.firstName,
      lastName: referral.lastName,
      role: referral.role,
      commissionRate: referral.commissionRate,
      totalCommissions: referral.totalCommissions || 0,
      isActive: referral.isActive,
      level: 2,
      parentId: level1Referral.id,
      commissionEarned: calculateCommissionFromReferral(level1Referral, referral),
      children: []
    }));
    
    level1Referral.children = level2Referrals;
    level2.push(...level2Referrals);
  }
  
  networkTree.levels.push({
    level: 2,
    referrals: level2,
    totalCount: level2.length,
    activeCount: level2.filter(r => r.isActive).length,
    totalCommissions: level2.reduce((sum, r) => sum + r.commissionEarned, 0)
  });
  
  // Statistiche totali
  networkTree.stats = {
    totalReferrals: level1.length + level2.length,
    activeReferrals: level1.filter(r => r.isActive).length + level2.filter(r => r.isActive).length,
    totalCommissionsEarned: level1.reduce((sum, r) => sum + r.commissionEarned, 0) + 
                           level2.reduce((sum, r) => sum + r.commissionEarned, 0),
    averageCommissionPerReferral: level1.length + level2.length > 0 ? 
      (level1.reduce((sum, r) => sum + r.commissionEarned, 0) + 
       level2.reduce((sum, r) => sum + r.commissionEarned, 0)) / (level1.length + level2.length) : 0,
    topReferral: level1.length > 0 ? level1.reduce((max, r) => 
      r.commissionEarned > max.commissionEarned ? r : max) : null
  };
  
  return networkTree;
}

// Funzione per calcolare Performance Analytics
async function calculatePerformanceAnalytics(user) {
  // Carica gli utenti dinamicamente
  const users = loadUsersFromFile();
  const directReferrals = users.filter(u => u.referrerId === user.id);
  const indirectReferrals = users.filter(u => 
    directReferrals.some(dr => dr.id === u.referrerId)
  );
  
  // Calcola metriche di performance
  const analytics = {
    // Network Growth
    networkGrowth: {
      totalGrowth: directReferrals.length + indirectReferrals.length,
      monthlyGrowth: calculateMonthlyGrowth(user),
      weeklyGrowth: calculateWeeklyGrowth(user),
      growthRate: calculateGrowthRate(user)
    },
    
    // Commission Performance
    commissionPerformance: {
      totalEarned: user.totalCommissions || 0,
      monthlyAverage: calculateMonthlyAverage(user),
      weeklyAverage: calculateWeeklyAverage(user),
      commissionPerReferral: directReferrals.length > 0 ? 
        (user.totalCommissions || 0) / directReferrals.length : 0
    },
    
    // Conversion Metrics
    conversionMetrics: {
      conversionRate: calculateConversionRate(user),
      retentionRate: calculateRetentionRate(user),
      activationRate: calculateActivationRate(user)
    },
    
    // Sales Performance
    salesPerformance: {
      totalSales: user.totalSales || 0,
      monthlySales: calculateMonthlySales(user),
      weeklySales: calculateWeeklySales(user),
      averageOrderValue: calculateAverageOrderValue(user)
    },
    
    // Activity Metrics
    activityMetrics: {
      lastActivity: user.lastLogin,
      daysActive: calculateDaysActive(user),
      averageSessionTime: calculateAverageSessionTime(user),
      taskCompletionRate: calculateTaskCompletionRate(user)
    },
    
    // Achievement Metrics
    achievementMetrics: {
      badgesEarned: user.badges?.length || 0,
      totalPoints: user.points,
      totalTokens: user.tokens,
      levelProgress: (user.experience / user.experienceToNextLevel) * 100
    }
  };
  
  return analytics;
}

// Funzioni helper per calcoli
function calculateMonthlyCommissions(user) {
  // Simula calcolo commissioni mensili
  return Math.floor((user.totalCommissions || 0) * 0.3);
}

function calculateWeeklyCommissions(user) {
  // Simula calcolo commissioni settimanali
  return Math.floor((user.totalCommissions || 0) * 0.1);
}

function calculatePendingCommissions(user) {
  // Simula commissioni in attesa
  return Math.floor((user.totalCommissions || 0) * 0.05);
}

function calculateConversionRate(user) {
  const directReferrals = users.filter(u => u.referrerId === user.id);
  const activeReferrals = directReferrals.filter(r => r.isActive);
  return directReferrals.length > 0 ? (activeReferrals.length / directReferrals.length) * 100 : 0;
}

function calculateAverageCommission(user) {
  const directReferrals = users.filter(u => u.referrerId === user.id);
  return directReferrals.length > 0 ? (user.totalCommissions || 0) / directReferrals.length : 0;
}

function calculateNetworkGrowth(user) {
  // Simula crescita network
  return Math.floor(Math.random() * 20) + 5;
}

function calculateRetentionRate(user) {
  // Simula retention rate
  return Math.floor(Math.random() * 30) + 70;
}

function calculateUpgradeRequirements(user) {
  const requirements = {
    points: { required: 50, current: user.points, met: user.points >= 50 },
    tasks: { required: 1, current: user.completedTasks?.length || 0, met: (user.completedTasks?.length || 0) >= 1 },
    onboarding: { required: 100, current: user.onboardingLevel, met: user.onboardingLevel >= 100 },
    sales: { required: 100, current: user.totalSales || 0, met: (user.totalSales || 0) >= 100 }
  };
  
  return {
    requirements,
    allMet: Object.values(requirements).every(r => r.met)
  };
}

function calculateStatusLevel(user) {
  const totalCommissions = user.totalCommissions || 0;
  const networkSize = users.filter(u => u.referrerId === user.id).length;
  
  if (totalCommissions >= 10000 && networkSize >= 50) {
    return {
      level: 'DIAMOND',
      title: 'Diamond Ambassador',
      description: 'Elite performer con network esteso',
      color: '#b9f2ff'
    };
  } else if (totalCommissions >= 5000 && networkSize >= 25) {
    return {
      level: 'PLATINUM',
      title: 'Platinum Ambassador',
      description: 'Top performer con network solido',
      color: '#e5e4e2'
    };
  } else if (totalCommissions >= 1000 && networkSize >= 10) {
    return {
      level: 'GOLD',
      title: 'Gold Ambassador',
      description: 'Performer consolidato',
      color: '#ffd700'
    };
  } else if (totalCommissions >= 500 && networkSize >= 5) {
    return {
      level: 'SILVER',
      title: 'Silver Ambassador',
      description: 'Performer in crescita',
      color: '#c0c0c0'
    };
  } else if (totalCommissions >= 100 && networkSize >= 1) {
    return {
      level: 'BRONZE',
      title: 'Bronze Ambassador',
      description: 'Performer iniziale',
      color: '#cd7f32'
    };
  } else {
    return {
      level: 'ENTRY',
      title: 'Entry Ambassador',
      description: 'Nuovo ambasciatore',
      color: '#10b981'
    };
  }
}

function calculateCommissionFromReferral(ambassador, referral) {
  // Calcola commissione guadagnata da un referral specifico
  const commissionRate = ambassador.commissionRate || 0.05;
  const referralCommissions = referral.totalCommissions || 0;
  return referralCommissions * commissionRate;
}

function calculateMonthlySales(user) {
  return Math.floor((user.totalSales || 0) * 0.3);
}

function calculateWeeklySales(user) {
  return Math.floor((user.totalSales || 0) * 0.1);
}

function calculateMonthlyGrowth(user) {
  return Math.floor(Math.random() * 10) + 2;
}

function calculateWeeklyGrowth(user) {
  return Math.floor(Math.random() * 5) + 1;
}

function calculateGrowthRate(user) {
  return Math.floor(Math.random() * 20) + 10;
}

function calculateMonthlyAverage(user) {
  return Math.floor((user.totalCommissions || 0) * 0.3);
}

function calculateWeeklyAverage(user) {
  return Math.floor((user.totalCommissions || 0) * 0.1);
}

function calculateActivationRate(user) {
  return Math.floor(Math.random() * 40) + 60;
}

function calculateAverageOrderValue(user) {
  return Math.floor((user.totalSales || 0) / Math.max(1, users.filter(u => u.referrerId === user.id).length));
}

function calculateDaysActive(user) {
  return Math.floor(Math.random() * 30) + 15;
}

function calculateAverageSessionTime(user) {
  return Math.floor(Math.random() * 30) + 10;
}

function calculateTaskCompletionRate(user) {
  const totalTasks = tasks.length;
  const completedTasks = user.completedTasks?.length || 0;
  return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
}

function calculateAchievements(user) {
  const achievements = [];
  
  if (user.points >= 100) achievements.push('Punti Master');
  if (user.tokens >= 50) achievements.push('Token Collector');
  if ((user.completedTasks?.length || 0) >= 5) achievements.push('Task Master');
  if ((user.totalCommissions || 0) >= 1000) achievements.push('Commission King');
  if (users.filter(u => u.referrerId === user.id).length >= 10) achievements.push('Network Builder');
  
  return achievements;
}

// Funzione per processare il pagamento
async function processPayment(amount, paymentMethod) {
  // Simula processo di pagamento
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        method: paymentMethod
      });
    }, 1000);
  });
}

// API per acquisto pacchetti commissioni
app.post('/api/packages/purchase', verifyToken, async (req, res) => {
  try {
    const { userId, packageId, paymentMethod } = req.body;
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utente non trovato' });
    }
    
    const package = commissionPlans.find(p => p.id === packageId);
    if (!package) {
      return res.status(404).json({ success: false, error: 'Pacchetto non trovato' });
    }
    
    if (!package.isActive) {
      return res.status(400).json({ success: false, error: 'Pacchetto non disponibile' });
    }
    
    // Verifica requisiti utente
    if (user.points < package.minPoints) {
      return res.status(400).json({ 
        success: false, 
        error: `Punti insufficienti. Richiesti: ${package.minPoints}, Disponibili: ${user.points}` 
      });
    }
    
    if (user.completedTasks.length < package.minTasks) {
      return res.status(400).json({ 
        success: false, 
        error: `Task completati insufficienti. Richiesti: ${package.minTasks}, Completati: ${user.completedTasks.length}` 
      });
    }
    
    if (user.totalSales < package.minSales) {
      return res.status(400).json({ 
        success: false, 
        error: `Vendite insufficienti. Richieste: ${package.minSales}, Totali: ${user.totalSales}` 
      });
    }
    
    // Simula processo di pagamento
    const paymentResult = await processPayment(package.cost, paymentMethod);
    
    if (paymentResult.success) {
      // Aggiorna utente con nuovo pacchetto
      user.purchasedPackages = user.purchasedPackages || [];
      user.purchasedPackages.push({
        packageId: package.id,
        packageName: package.name,
        purchaseDate: new Date().toISOString(),
        cost: package.cost,
        commissionRates: {
          directSale: package.directSale,
          level1: package.level1,
          level2: package.level2,
          level3: package.level3,
          level4: package.level4,
          level5: package.level5
        }
      });
      
      // Aggiorna commission rate dell'utente
      user.commissionRate = package.directSale;
      
      // Salva utente aggiornato
      saveUsersToFile(users);
      
      console.log('✅ Pacchetto acquistato:', {
        userId: user.id,
        packageId: package.id,
        packageName: package.name,
        cost: package.cost
      });
      
      res.json({
        success: true,
        data: {
          message: 'Pacchetto acquistato con successo!',
          package: package,
          newCommissionRate: user.commissionRate,
          purchaseDate: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Errore nel processo di pagamento'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore acquisto pacchetto:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
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

// API - Conferma completamento video
app.post('/api/tasks/:taskId/video/complete', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const { watchedDuration, totalDuration } = req.body;
    
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
    
    // Verifica che il video sia stato guardato per almeno l'80%
    const watchPercentage = (watchedDuration / totalDuration) * 100;
    const completed = watchPercentage >= 80;
    
    res.json({
      success: true,
      data: {
        completed,
        watchPercentage: Math.round(watchPercentage),
        rewards: completed ? task.rewards : null
      }
    });
  } catch (error) {
    console.error('❌ Errore completamento video:', error);
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

// API - Conferma lettura documento
app.post('/api/tasks/:taskId/document/complete', verifyToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const { readTime } = req.body; // Tempo di lettura in secondi
    
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
    
    // Verifica che il documento sia stato letto per almeno 30 secondi
    const completed = readTime >= 30;
    
    res.json({
      success: true,
      data: {
        completed,
        readTime,
        rewards: completed ? task.rewards : null
      }
    });
  } catch (error) {
    console.error('❌ Errore completamento documento:', error);
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
        error: 'Questo task non è un survey'
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

// API - Invia risposte survey
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
        error: 'Questo task non è un survey'
      });
    }
    
    // Salva le risposte del survey (in un sistema reale, le salveresti in un database)
    console.log(`📊 Survey completato per task ${taskId}:`, answers);
    
    res.json({
      success: true,
      data: {
        completed: true,
        answers,
        rewards: task.rewards
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

// API - Ottieni dati utente completi
app.get('/api/users/:userId/profile', verifyToken, (req, res) => {
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
    
    // Rimuovi dati sensibili
    const { password, ...userProfile } = user;
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('❌ Errore caricamento profilo utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Aggiorna dati utente
app.put('/api/users/:userId/profile', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Aggiorna solo i campi permessi
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'country', 'city'];
    const updatedUser = { ...users[userIndex] };
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updatedUser[field] = updateData[field];
      }
    });
    
    updatedUser.updatedAt = new Date().toISOString();
    users[userIndex] = updatedUser;
    
    // Salva nel file
    saveUsersToFile(users);
    
    // Rimuovi dati sensibili dalla risposta
    const { password, ...userProfile } = updatedUser;
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento profilo utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// API - Ottieni statistiche utente
app.get('/api/users/:userId/stats', verifyToken, (req, res) => {
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
    
    const stats = {
      totalPoints: user.points || 0,
      totalTokens: user.tokens || 0,
      totalExperience: user.experience || 0,
      completedTasks: user.completedTasks?.length || 0,
      totalSales: user.totalSales || 0,
      totalCommissions: user.totalCommissions || 0,
      level: user.level || 1,
      role: user.role || 'entry_ambassador',
      isActive: user.isActive || false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Errore caricamento statistiche utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});



// API - Aggiorna progresso utente
app.post('/api/users/:userId/progress', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    const { taskId, rewards } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const user = users[userIndex];
    
    // Aggiorna task completati
    if (!user.completedTasks) {
      user.completedTasks = [];
    }
    if (!user.completedTasks || !user.completedTasks.includes(taskId)) {
      user.completedTasks.push(taskId);
    }
    
    // Aggiorna ricompense
    if (rewards) {
      user.points = (user.points || 0) + (rewards.points || 0);
      user.tokens = (user.tokens || 0) + (rewards.tokens || 0);
      user.experience = (user.experience || 0) + (rewards.experience || 0);
    }
    
    // Aggiorna timestamp
    user.updatedAt = new Date().toISOString();
    
    // Salva nel file
    saveUsersToFile(users);
    
    res.json({
      success: true,
      data: {
        message: 'Progresso aggiornato con successo',
        updatedUser: {
          points: user.points,
          tokens: user.tokens,
          experience: user.experience,
          completedTasks: user.completedTasks
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento progresso:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

 