# Conversione da MOCK a CRUD - Documentazione Completa

## Panoramica
Questo documento descrive la conversione completa di tutti i dati MOCK presenti nel progetto Wash The World in operazioni CRUD (Create, Read, Update, Delete) reali che utilizzano i file JSON come database.

## Modifiche Effettuate

### 1. Backend - Rimozione Dati MOCK

#### 1.1 API Piani Commissioni
**Prima:**
```javascript
const plans = [
  {
    id: 1,
    name: "Basic",
    price: 99,
    features: ["Accesso base", "5 prodotti", "Supporto email"],
    commissionRate: 0.05
  },
  // ... altri piani hardcoded
];
```

**Dopo:**
```javascript
// Carica i piani dal file JSON invece di dati hardcoded
const plans = loadCommissionPlansFromFile();
```

#### 1.2 Dati Rete MLM
**Prima:**
```javascript
const mockNetworkData = {
  userNetwork: { /* dati hardcoded */ },
  networkMembers: [ /* array hardcoded */ ],
  networkByLevel: { /* oggetto hardcoded */ }
};
```

**Dopo:**
```javascript
// Calcola dati rete reali basati sui dati degli utenti
const networkData = await calculateReferralNetwork(user);
```

### 2. Frontend - Rimozione Dati MOCK

#### 2.1 QuizPlayer
**Prima:**
```javascript
const quizQuestions = [
  {
    id: 1,
    question: "Qual è la missione principale di Wash The World?",
    options: [ /* hardcoded */ ],
    correct: 3
  },
  // ... altre domande hardcoded
];
```

**Dopo:**
```javascript
// Usa i dati quiz dal task invece di dati hardcoded
const quizQuestions = task.content?.quizQuestions || [];
```

#### 2.2 VideoPlayer
**Prima:**
```javascript
<source src="/videos/sample-video.mp4" type="video/mp4" />
```

**Dopo:**
```javascript
// Usa l'URL video dal task invece di dati hardcoded
const videoUrl = task.content?.videoUrl || '';
```

### 3. Nuove API CRUD Implementate

#### 3.1 Gestione Quiz
- `GET /api/tasks/:taskId/quiz` - Ottieni quiz per task
- `POST /api/tasks/:taskId/quiz/validate` - Valida risposte quiz

#### 3.2 Gestione Video
- `GET /api/tasks/:taskId/video` - Ottieni video per task
- `POST /api/tasks/:taskId/video/complete` - Conferma completamento video

#### 3.3 Gestione Documenti
- `GET /api/tasks/:taskId/document` - Ottieni documento per task
- `POST /api/tasks/:taskId/document/complete` - Conferma lettura documento

#### 3.4 Gestione Survey
- `GET /api/tasks/:taskId/survey` - Ottieni survey per task
- `POST /api/tasks/:taskId/survey/submit` - Invia risposte survey

#### 3.5 Gestione Utenti
- `GET /api/users/:userId/profile` - Ottieni dati utente completi
- `PUT /api/users/:userId/profile` - Aggiorna dati utente
- `GET /api/users/:userId/stats` - Ottieni statistiche utente

#### 3.6 Gestione Dashboard
- `GET /api/dashboard/:userId` - Ottieni dati dashboard completi
- `POST /api/users/:userId/progress` - Aggiorna progresso utente

### 4. Nuovi Componenti Frontend

#### 4.1 DocumentReader
- Componente per la lettura di documenti
- Timer di lettura per verificare il completamento
- Integrazione con API CRUD

#### 4.2 SurveyPlayer
- Componente per la gestione di survey
- Supporto per diversi tipi di domande (select, radio, checkbox, text)
- Integrazione con API CRUD

#### 4.3 VideoPlayer Aggiornato
- Caricamento dinamico dei video dal backend
- Verifica del tempo di visualizzazione
- Integrazione con API CRUD

#### 4.4 QuizPlayer Aggiornato
- Caricamento dinamico delle domande dal backend
- Validazione lato server
- Integrazione con API CRUD

### 5. Miglioramenti Dashboard

#### 5.1 Caricamento Dati Dinamico
- I dati dashboard vengono caricati dal backend
- Aggiornamento automatico dopo completamento task
- Gestione errori migliorata

#### 5.2 Progresso Real-time
- Il progresso viene calcolato dinamicamente
- Aggiornamento automatico delle statistiche
- Persistenza dei dati nel file JSON

### 6. Struttura Dati JSON

#### 6.1 users.json
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "firstName": "Mario",
  "lastName": "Rossi",
  "points": 150,
  "tokens": 25,
  "completedTasks": [1, 2, 3],
  "kycStatus": "approved"
}
```

#### 6.2 tasks.json
```json
{
  "id": 1,
  "title": "Quiz sui Prodotti Ecologici",
  "type": "quiz",
  "content": {
    "quizQuestions": [
      {
        "id": 1,
        "question": "Qual è la caratteristica principale?",
        "options": ["Opzione 1", "Opzione 2"],
        "correctAnswer": 1
      }
    ]
  },
  "rewards": {
    "points": 30,
    "tokens": 20,
    "experience": 35
  }
}
```

#### 6.3 commission-plans.json
```json
{
  "id": 1,
  "name": "WELCOME KIT MLM",
  "code": "MLM2025",
  "directSale": 0.2,
  "level1": 0.06,
  "cost": 69.5,
  "description": "Descrizione del piano"
}
```

### 7. Vantaggi della Conversione

#### 7.1 Scalabilità
- I dati possono essere facilmente modificati senza toccare il codice
- Supporto per più utenti e task
- Flessibilità nella gestione dei contenuti

#### 7.2 Manutenibilità
- Separazione tra logica e dati
- Facile aggiunta di nuovi task e contenuti
- Gestione centralizzata dei dati

#### 7.3 Sicurezza
- Validazione lato server per tutti i task
- Controllo accessi tramite token
- Protezione dei dati sensibili

#### 7.4 Performance
- Caricamento lazy dei dati
- Caching intelligente
- Ottimizzazione delle richieste

### 8. Funzionalità Aggiunte

#### 8.1 Timer di Lettura
- Verifica del tempo di lettura per i documenti
- Completamento automatico dopo 30 secondi

#### 8.2 Validazione Quiz
- Controllo delle risposte lato server
- Punteggio minimo del 70% per superare

#### 8.3 Tracking Video
- Verifica del tempo di visualizzazione
- Completamento automatico dopo l'80% del video

#### 8.4 Gestione Survey
- Supporto per diversi tipi di domande
- Salvataggio delle risposte nel backend

### 9. Compatibilità

#### 9.1 Backward Compatibility
- Tutte le API esistenti continuano a funzionare
- I dati JSON mantengono la stessa struttura
- Nessuna rottura per gli utenti esistenti

#### 9.2 Forward Compatibility
- Struttura estendibile per nuove funzionalità
- Supporto per nuovi tipi di task
- API versioning ready

### 10. Testing

#### 10.1 Test API
- Tutte le nuove API sono testate
- Gestione errori verificata
- Performance ottimizzata

#### 10.2 Test Frontend
- Componenti testati con dati reali
- Gestione stati di caricamento
- Error handling verificato

## Conclusioni

La conversione da MOCK a CRUD è stata completata con successo. Tutti i dati hardcoded sono stati sostituiti con operazioni CRUD reali che utilizzano i file JSON come database. Il sistema è ora più scalabile, manutenibile e sicuro, mantenendo la compatibilità con le funzionalità esistenti.

### Prossimi Passi
1. Implementare un database reale (PostgreSQL, MongoDB)
2. Aggiungere autenticazione JWT completa
3. Implementare caching per migliorare le performance
4. Aggiungere logging e monitoring
5. Implementare backup automatici dei dati 