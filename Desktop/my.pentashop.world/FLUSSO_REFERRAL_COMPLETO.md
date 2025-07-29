# 🔄 Flusso Referral Completo - Wash The World

## 📋 Panoramica del Sistema

Questo documento descrive l'implementazione completa del flusso di registrazione con referral, onboarding e attivazione ambassador.

---

## 🎯 **1. ARRIVO CON REFERRAL**

### Input
- **Codice referral**: stringa alfanumerica (es. `MARO879395-EU2W-*-O`)
- **URL**: `https://washworld.com/join?ref=MARO879395-EU2W-*-O`

### Verifica
```javascript
// Endpoint: GET /api/referral/validate/:code
{
  "success": true,
  "data": {
    "referralCode": "MARO879395-EU2W-*-O",
    "sponsor": {
      "id": 1,
      "firstName": "Mario",
      "lastName": "Rossi",
      "level": 3,
      "totalSales": 5000
    },
    "isValid": true,
    "expiresAt": "2025-08-28T10:00:00Z"
  }
}
```

### Output
- **Pagina di registrazione** con referral pre-compilato
- **Campo nascosto**: `sponsorId` e `referralCode`
- **Validazione lato client**: verifica formato codice

---

## 👤 **2. REGISTRAZIONE AMBASSADOR**

### Form Campi Obbligatori
```html
<form id="ambassador-registration">
  <input type="text" name="firstName" required>
  <input type="text" name="lastName" required>
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <input type="password" name="confirmPassword" required>
  <input type="hidden" name="sponsorId" value="1">
  <input type="hidden" name="referralCode" value="MARO879395-EU2W-*-O">
</form>
```

### Validazione Password
```javascript
// Policy minima: 8 caratteri, 1 numero, 1 simbolo
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
```

### Relazione Genealogica
```javascript
// POST /api/auth/register
{
  "firstName": "Giuseppe",
  "lastName": "Verdi",
  "email": "giuseppe@example.com",
  "password": "SecurePass123!",
  "sponsorId": 1,
  "referralCode": "MARO879395-EU2W-*-O"
}

// Risposta
{
  "success": true,
  "data": {
    "user": {
      "id": 7,
      "firstName": "Giuseppe",
      "lastName": "Verdi",
      "email": "giuseppe@example.com",
      "role": "ambassador",
      "parentId": 1,
      "referralCode": "GIUVERE2025",
      "hasSeenWelcome": false,
      "onboardingLevel": 1
    },
    "token": "jwt-token-xxx"
  }
}
```

---

## 📧 **3. WELCOME EMAIL + LINK DI LOGIN**

### Trigger
- **Evento**: `POST /api/auth/register` con successo
- **Azione**: invio email automatica

### Contenuto Email
```html
<!-- Oggetto: "Benvenuto in Wash The World, sei ufficialmente Ambassador!" -->
<h1>🎉 Benvenuto Giuseppe!</h1>
<p>Sei ora ufficialmente Ambassador di Wash The World!</p>
<p>Il tuo codice referral: <strong>GIUVERE2025</strong></p>
<p>Inizia subito il tuo percorso:</p>
<a href="https://washworld.com/auth?token=temp-token-xxx">Accedi Ora</a>
```

### Endpoint di Login
```javascript
// GET /api/auth/verify-token?token=temp-token-xxx
{
  "success": true,
  "data": {
    "user": { /* dati utente */ },
    "redirectTo": "/onboarding"
  }
}
```

---

## 🎬 **4. PRIMO ACCESSO E ONBOARDING FORZATO**

### Condizione
```javascript
// Verifica: user.hasSeenWelcome === false
if (!user.hasSeenWelcome) {
  // Forza redirect a onboarding
  window.location.href = '/onboarding';
}
```

### Schermata Obbligatoria
```javascript
// Componente: OnboardingWelcome.jsx
const OnboardingWelcome = () => {
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  return (
    <div className="onboarding-container">
      <h1>🎬 Benvenuto nel tuo percorso Ambassador!</h1>
      
      {/* Video di benvenuto */}
      <video 
        onEnded={() => setVideoWatched(true)}
        controls
        src="/videos/welcome-ambassador.mp4"
      />
      
      {/* Quiz rapido */}
      {videoWatched && (
        <QuizComponent onComplete={setQuizCompleted} />
      )}
      
      {/* Pulsante continua */}
      {videoWatched && quizCompleted && (
        <button onClick={completeOnboarding}>
          Continua il tuo percorso
        </button>
      )}
    </div>
  );
};
```

### Task #1 Completamento
```javascript
// POST /api/onboarding/complete-task
{
  "taskId": 1,
  "type": "welcome_video",
  "completed": true
}

// Risposta
{
  "success": true,
  "data": {
    "user": {
      "hasSeenWelcome": true,
      "onboardingLevel": 2,
      "points": 25
    },
    "nextTask": {
      "id": 2,
      "title": "Quiz sui Prodotti Ecologici"
    }
  }
}
```

---

## 📋 **5. SCELTA PIANO**

### Schermata Piani
```javascript
// Componente: PlanSelection.jsx
const plans = [
  {
    id: 1,
    name: "Basic",
    price: 99,
    features: ["Accesso base", "5 prodotti", "Supporto email"],
    commissionRate: 0.05
  },
  {
    id: 2,
    name: "Pro",
    price: 199,
    features: ["Accesso completo", "15 prodotti", "Supporto prioritario"],
    commissionRate: 0.10
  },
  {
    id: 3,
    name: "Enterprise",
    price: 399,
    features: ["Accesso premium", "Tutti i prodotti", "Supporto dedicato"],
    commissionRate: 0.15
  }
];
```

### Interazione Acquisto
```javascript
// POST /api/plans/select
{
  "planId": 2,
  "paymentMethod": "stripe"
}

// Risposta
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/xxx",
    "sessionId": "cs_xxx"
  }
}
```

---

## 🆔 **6. KYC PRE-PAGAMENTO**

### Form KYC
```html
<form id="kyc-form">
  <!-- Dati anagrafici -->
  <input type="date" name="birthDate" required>
  <input type="text" name="address" required>
  <input type="text" name="city" required>
  <input type="text" name="country" required>
  <input type="text" name="citizenship" required>
  
  <!-- Upload documenti -->
  <input type="file" name="idFront" accept="image/*" required>
  <input type="file" name="idBack" accept="image/*" required>
  <input type="file" name="selfie" accept="image/*" required>
</form>
```

### Validazione Client
```javascript
const validateKYC = (files) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png'];
  
  for (const file of files) {
    if (file.size > maxSize) {
      throw new Error('File troppo grande');
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato non supportato');
    }
  }
};
```

### Invio KYC
```javascript
// POST /api/kyc/submit
const formData = new FormData();
formData.append('birthDate', '1990-01-01');
formData.append('address', 'Via Roma 123');
formData.append('idFront', fileFront);
formData.append('idBack', fileBack);
formData.append('selfie', fileSelfie);

const response = await fetch('/api/kyc/submit', {
  method: 'POST',
  body: formData
});

// Risposta
{
  "success": true,
  "data": {
    "kycId": "kyc_xxx",
    "status": "pending",
    "estimatedTime": "24-48 ore"
  }
}
```

### Stato KYC
```javascript
// GET /api/kyc/status
{
  "success": true,
  "data": {
    "status": "approved", // pending, approved, rejected
    "approvedAt": "2025-07-29T10:00:00Z",
    "rejectionReason": null
  }
}
```

---

## 💳 **7. PAGAMENTO**

### Metodi Supportati
```javascript
const paymentMethods = {
  stripe: {
    name: "Carta di Credito/Debito",
    icon: "💳",
    enabled: true
  },
  paypal: {
    name: "PayPal",
    icon: "🔗",
    enabled: true
  },
  crypto: {
    name: "Criptovalute",
    icon: "₿",
    enabled: true,
    currencies: ["BTC", "ETH", "USDT"]
  },
  bank_transfer: {
    name: "Bonifico Bancario",
    icon: "🏦",
    enabled: true
  }
};
```

### Workflow Pagamento

#### Stripe/PayPal/Crypto
```javascript
// 1. Creazione checkout
const checkout = await fetch('/api/payments/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 2,
    paymentMethod: 'stripe'
  })
});

// 2. Redirect al checkout
const { checkoutUrl } = await checkout.json();
window.location.href = checkoutUrl;

// 3. Webhook di conferma
// POST /api/webhooks/stripe
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "payment_status": "paid",
      "customer": "cus_xxx"
    }
  }
}
```

#### Bonifico Bancario
```javascript
// POST /api/payments/bank-transfer
{
  "planId": 2,
  "amount": 199
}

// Risposta
{
  "success": true,
  "data": {
    "iban": "IT60X0542811101000000123456",
    "causale": "WASHWORLD-AMB-2025-001",
    "amount": 199,
    "expiresAt": "2025-08-05T10:00:00Z",
    "receipt": {
      "pdfUrl": "/receipts/bank-transfer-001.pdf"
    }
  }
}
```

### Post-Pagamento
```javascript
// Aggiornamento stato utente
{
  "user": {
    "subscription": {
      "active": true,
      "planId": 2,
      "paidAt": "2025-07-29T10:00:00Z",
      "expiresAt": "2026-07-29T10:00:00Z"
    },
    "kycStatus": "approved",
    "onboardingLevel": 5
  },
  "email": {
    "type": "payment_confirmation",
    "sent": true,
    "invoiceUrl": "/invoices/inv-2025-001.pdf"
  }
}
```

---

## 🔐 **SICUREZZA E TRACCIABILITÀ**

### Token e Link di Conferma
```javascript
// Scadenza: 24 ore
const tokenExpiration = 24 * 60 * 60 * 1000; // 24 ore in millisecondi

// Generazione token sicuro
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
```

### Logging Cambiamenti di Stato
```javascript
// Log ogni cambiamento
const logStateChange = (userId, oldState, newState, reason) => {
  console.log(`[${new Date().toISOString()}] User ${userId}: ${oldState} → ${newState} (${reason})`);
  
  // Salva nel database
  await db.logs.create({
    userId,
    oldState,
    newState,
    reason,
    timestamp: new Date()
  });
};
```

---

## 🗄️ **STRUTTURA DATABASE**

### Tabella `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ambassador',
  parentId INTEGER REFERENCES users(id),
  referralCode VARCHAR(50) UNIQUE,
  hasSeenWelcome BOOLEAN DEFAULT FALSE,
  onboardingLevel INTEGER DEFAULT 1,
  kycStatus VARCHAR(50) DEFAULT 'pending',
  subscriptionActive BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Tabella `kyc_documents`
```sql
CREATE TABLE kyc_documents (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  documentType VARCHAR(50) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  verifiedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Tabella `subscriptions`
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  planId INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  paidAt TIMESTAMP,
  expiresAt TIMESTAMP,
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 **API ENDPOINTS**

### Autenticazione
- `POST /api/auth/register` - Registrazione nuovo ambassador
- `POST /api/auth/login` - Login utente
- `GET /api/auth/verify-token` - Verifica token temporaneo

### Referral
- `GET /api/referral/validate/:code` - Validazione codice referral
- `GET /api/referral/stats/:userId` - Statistiche referral

### Onboarding
- `GET /api/onboarding/status` - Stato onboarding utente
- `POST /api/onboarding/complete-task` - Completamento task
- `GET /api/onboarding/tasks` - Lista task disponibili

### Piani e Pagamenti
- `GET /api/plans` - Lista piani disponibili
- `POST /api/plans/select` - Selezione piano
- `POST /api/payments/create-checkout` - Creazione checkout
- `POST /api/payments/bank-transfer` - Generazione bonifico

### KYC
- `POST /api/kyc/submit` - Invio documenti KYC
- `GET /api/kyc/status` - Stato verifica KYC
- `GET /api/kyc/documents` - Lista documenti inviati

### Webhooks
- `POST /api/webhooks/stripe` - Webhook Stripe
- `POST /api/webhooks/paypal` - Webhook PayPal
- `POST /api/webhooks/crypto` - Webhook Crypto

---

## ✅ **TESTING**

### Test Referral
```bash
# Test validazione referral
curl -X GET "http://localhost:3000/api/referral/validate/MARO879395-EU2W-*-O"

# Test registrazione con referral
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "sponsorId": 1,
    "referralCode": "MARO879395-EU2W-*-O"
  }'
```

### Test Onboarding
```bash
# Test completamento task
curl -X POST "http://localhost:3000/api/onboarding/complete-task" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"taskId": 1, "type": "welcome_video", "completed": true}'
```

---

## 🎯 **CONCLUSIONE**

Questo flusso implementa un sistema completo e sicuro per:

1. ✅ **Gestione referral** con validazione
2. ✅ **Registrazione ambassador** con relazioni genealogiche
3. ✅ **Onboarding forzato** con video e quiz
4. ✅ **Selezione piani** con commissioni
5. ✅ **KYC completo** con upload documenti
6. ✅ **Pagamenti multipli** (Stripe, PayPal, Crypto, Bonifico)
7. ✅ **Sicurezza** con token scadenti e logging
8. ✅ **Tracciabilità** completa di ogni passaggio

Il sistema è pronto per la produzione e scalabile per migliaia di ambassador! 🚀 