const fs = require('fs');
const path = require('path');

// Percorsi file
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const COMMISSION_PLANS_FILE = path.join(DATA_DIR, 'commission-plans.json');
const KYC_FILE = path.join(DATA_DIR, 'kyc.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

// Assicura che la directory data esista
function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Dati di default per gli utenti
const defaultUsers = [
  {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Mario",
    "lastName": "Rossi",
    "password": "password",
    "level": 1,
    "experience": 145,
    "experienceToNextLevel": 100,
    "onboardingLevel": 5,
    "points": 210,
    "tokens": 60,
    "role": "entry_ambassador",
    "commissionRate": 0.05,
    "referralCode": "MARO879395-EU2W-*-O",
    "totalSales": 500,
    "totalCommissions": 25,
    "wallet": {
      "balance": 150,
      "transactions": [
        {
          "id": 1,
          "type": "commission",
          "amount": 25,
          "date": "2025-07-28"
        },
        {
          "id": 2,
          "type": "bonus",
          "amount": 10,
          "date": "2025-07-25"
        }
      ]
    },
    "badges": [],
    "completedTasks": [1, 2, 3, 4],
    "isActive": true,
    "createdAt": "2025-01-15",
    "lastLogin": "2025-07-28T10:30:00Z",
    "updatedAt": "2025-07-28T20:54:55.391Z",
    "hasSeenWelcome": true,
    "subscriptionActive": true,
    "kycStatus": "approved"
  },
  {
    "id": 2,
    "username": "admin",
    "email": "admin@washworld.com",
    "firstName": "Admin",
    "lastName": "System",
    "password": "admin123",
    "level": 10,
    "experience": 1000,
    "experienceToNextLevel": 0,
    "onboardingLevel": 5,
    "points": 5000,
    "tokens": 500,
    "role": "admin",
    "commissionRate": 0.15,
    "referralCode": "ADSY887357-U46L-!-I",
    "totalSales": 50000,
    "totalCommissions": 7500,
    "wallet": {
      "balance": 10000,
      "transactions": [
        {
          "id": 1,
          "type": "commission",
          "amount": 5000,
          "date": "2025-07-28"
        },
        {
          "id": 2,
          "type": "bonus",
          "amount": 2500,
          "date": "2025-07-25"
        }
      ]
    },
    "badges": [
      "admin",
      "top_performer",
      "early_adopter"
    ],
    "completedTasks": [1, 2, 3, 4, 5],
    "isActive": true,
    "createdAt": "2024-12-01",
    "lastLogin": "2025-07-28T12:00:00Z"
  },
  {
    "id": 3,
    "username": "ambassador1",
    "email": "ambassador1@example.com",
    "firstName": "Giulia",
    "lastName": "Bianchi",
    "password": "ambassador123",
    "level": 3,
    "experience": 250,
    "experienceToNextLevel": 300,
    "onboardingLevel": 3,
    "points": 450,
    "tokens": 75,
    "role": "mlm_ambassador",
    "commissionRate": 0.1,
    "referralCode": "GIULIA2025",
    "totalSales": 2000,
    "totalCommissions": 200,
    "wallet": {
      "balance": 350,
      "transactions": [
        {
          "id": 1,
          "type": "commission",
          "amount": 150,
          "date": "2025-07-28"
        },
        {
          "id": 2,
          "type": "bonus",
          "amount": 50,
          "date": "2025-07-25"
        }
      ]
    },
    "badges": [
      "mlm_ambassador"
    ],
    "completedTasks": [1, 2, 3],
    "isActive": true,
    "createdAt": "2025-02-20",
    "lastLogin": "2025-07-28T09:15:00Z"
  }
];

// Dati di default per i task
const defaultTasks = [
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

// Dati di default per i piani commissioni
const defaultCommissionPlans = [
  {
    "id": 1,
    "name": "WELCOME KIT MLM",
    "code": "MLM2025",
    "directSale": 0.2,
    "level1": 0.06,
    "level2": 0.05,
    "level3": 0.04,
    "level4": 0.03,
    "level5": 0.02,
    "minPoints": 100,
    "minTasks": 3,
    "minSales": 500,
    "cost": 69.5,
    "description": "Cosa trovi nel Kit?\n1 confezione da 10 panni\n1 confezione da 30 panni\n1 confezione da 50 panni\n5 monodosi\n25 depliant a 3 ante\naccesso al gestionale\nformazione continua ",
    "isActive": true,
    "createdAt": "2025-01-15",
    "updatedAt": "2025-07-29"
  },
  {
    "id": 2,
    "name": "Ambassador PENTAGAME",
    "code": "pentagame2025",
    "directSale": 0.315,
    "level1": 0.055,
    "level2": 0.038,
    "level3": 0.017,
    "level4": 0.01,
    "level5": 0,
    "minPoints": 100,
    "minTasks": 5,
    "minSales": 100,
    "cost": 242.78,
    "description": "Cosa trovi nel Kit?\n8 confezioni da 10 panni\n1 confezione da 30 panni\n1 confezione da 50 panni\n15 buste monodose\nProgramma completo Gratta &\nVinci Digitale\n2 gestionali professionali per la\ntua attività\nFormazione continua\nsettimanale\n6 mesi di abbonamento inclusi\n(poi solo 19€/mese)",
    "isActive": true,
    "createdAt": "2025-01-15",
    "updatedAt": "2025-07-29"
  },
  {
    "id": 3,
    "name": "WASH The WORLD AMBASSADOR",
    "code": "WTW2025",
    "directSale": 0.1,
    "level1": 0,
    "level2": 0,
    "level3": 0,
    "level4": 0,
    "level5": 0,
    "minPoints": 10,
    "minTasks": 1,
    "minSales": 15,
    "cost": 17.9,
    "description": "costo iscrizione annuale alla community Wash The World   \n1 Confezione da 10 panni\niscrizione nel gestionale \nreferal link personale\n10% di commissioni",
    "isActive": true,
    "createdAt": "2025-07-28",
    "updatedAt": "2025-07-28"
  }
];

// Dati di default per KYC
const defaultKYC = [];

// Dati di default per vendite
const defaultSales = [];

// Dati di default per commissioni
const defaultCommissions = [];

// Dati di default per referral
const defaultReferrals = [];

// Funzione per inizializzare tutti i dati
function initializeData() {
  ensureDataDirectory();
  
  // Inizializza utenti
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('✅ File utenti inizializzato');
  }
  
  // Inizializza task
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(defaultTasks, null, 2));
    console.log('✅ File task inizializzato');
  }
  
  // Inizializza piani commissioni
  if (!fs.existsSync(COMMISSION_PLANS_FILE)) {
    fs.writeFileSync(COMMISSION_PLANS_FILE, JSON.stringify(defaultCommissionPlans, null, 2));
    console.log('✅ File piani commissioni inizializzato');
  }
  
  // Inizializza KYC
  if (!fs.existsSync(KYC_FILE)) {
    fs.writeFileSync(KYC_FILE, JSON.stringify(defaultKYC, null, 2));
    console.log('✅ File KYC inizializzato');
  }
  
  // Inizializza vendite
  if (!fs.existsSync(SALES_FILE)) {
    fs.writeFileSync(SALES_FILE, JSON.stringify(defaultSales, null, 2));
    console.log('✅ File vendite inizializzato');
  }
  
  // Inizializza commissioni
  if (!fs.existsSync(COMMISSIONS_FILE)) {
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(defaultCommissions, null, 2));
    console.log('✅ File commissioni inizializzato');
  }
  
  // Inizializza referral
  if (!fs.existsSync(REFERRALS_FILE)) {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify(defaultReferrals, null, 2));
    console.log('✅ File referral inizializzato');
  }
  
  console.log('🎉 Tutti i dati sono stati inizializzati con successo!');
}

module.exports = {
  initializeData,
  defaultUsers,
  defaultTasks,
  defaultCommissionPlans,
  defaultKYC,
  defaultSales,
  defaultCommissions,
  defaultReferrals
}; 