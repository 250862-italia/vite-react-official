# 🌊 Wash The World - Frontend Onboarding Gamificato

Frontend moderno e coinvolgente per l'onboarding gamificato della piattaforma Wash The World.

## 🚀 Caratteristiche

### ✨ **Design Moderno**
- Interfaccia pulita e responsive
- Animazioni fluide con Framer Motion
- Gradienti e colori accattivanti
- Icone Lucide React

### 🎮 **Gamificazione Completa**
- **Sistema di Livelli**: Progresso visivo con barre di avanzamento
- **Punti e Token**: Sistema di ricompense integrato
- **Badge e Achievement**: Collezione di badge per motivare
- **Task Interattivi**: Video, quiz e documenti
- **Progress Tracking**: Monitoraggio real-time del progresso

### 📱 **UX/UI Avanzata**
- **Responsive Design**: Ottimizzato per mobile e desktop
- **Loading States**: Feedback visivo per tutte le azioni
- **Error Handling**: Gestione elegante degli errori
- **Smooth Transitions**: Transizioni fluide tra le pagine

## 🛠️ Tecnologie

- **React 18** - Framework principale
- **Vite** - Build tool veloce
- **Tailwind CSS** - Styling utility-first
- **Framer Motion** - Animazioni avanzate
- **React Router** - Navigazione SPA
- **Axios** - HTTP client
- **Lucide React** - Icone moderne

## 📦 Installazione

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## 🎯 Struttura del Progetto

```
src/
├── components/          # Componenti riutilizzabili
├── contexts/           # React Context (Auth)
├── pages/              # Pagine principali
│   ├── Login.jsx       # Pagina di accesso
│   ├── OnboardingDashboard.jsx  # Dashboard principale
│   ├── TaskView.jsx    # Visualizzazione task
│   └── Badges.jsx      # Collezione badge
├── App.jsx             # Componente principale
└── index.css           # Stili globali
```

## 🎮 Funzionalità Gamificazione

### **Sistema di Livelli**
- Progresso visivo con barre animate
- Esperienza e punti per ogni azione
- Sblocco di nuovi contenuti

### **Task Interattivi**
- **Video**: Segnatura automatica del completamento
- **Quiz**: Domande multiple choice con feedback
- **Documenti**: Lettura e comprensione

### **Badge System**
- **Categorie**: Onboarding, Sales, Referral
- **Livelli**: 1-3 per difficoltà crescente
- **Progresso**: Barre di avanzamento per ogni badge
- **Storia**: Data di guadagno per ogni badge

### **Rewards**
- **Punti**: Valuta principale per ranking
- **Token**: Valuta premium per funzionalità speciali
- **Esperienza**: Progressione di livello

## 🔗 Integrazione Backend

Il frontend si connette al backend tramite API REST:

```javascript
// Configurazione axios
axios.defaults.baseURL = 'http://localhost:5000/api';

// Endpoint principali
POST /auth/login          // Autenticazione
GET  /onboarding/dashboard // Dashboard dati
POST /onboarding/task/complete // Completamento task
GET  /onboarding/badges   // Lista badge
```

## 🎨 Design System

### **Colori**
- **Primary**: Blue (#3B82F6) → Green (#10B981)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### **Gradienti**
- **Primary**: `from-blue-500 to-green-500`
- **Background**: `from-blue-50 via-white to-green-50`

### **Animazioni**
- **Entrance**: Fade in + slide up
- **Hover**: Scale + shadow
- **Progress**: Animated bars
- **Loading**: Spinner + skeleton

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚀 Deployment

```bash
# Build ottimizzato
npm run build

# Preview build
npm run preview
```

## 🔧 Sviluppo

### **Hot Reload**
Il server di sviluppo supporta hot reload per modifiche istantanee.

### **ESLint & Prettier**
Configurazione per codice pulito e consistente.

### **TypeScript Ready**
Pronto per migrazione a TypeScript se necessario.

## 🎯 Roadmap

- [ ] **PWA Support** - App installabile
- [ ] **Offline Mode** - Funzionalità offline
- [ ] **Push Notifications** - Notifiche push
- [ ] **Social Features** - Condivisione achievement
- [ ] **Leaderboard** - Classifica utenti
- [ ] **Dark Mode** - Tema scuro

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi `LICENSE` per dettagli.

---

**Wash The World** - Rendiamo il mondo più pulito, un'onda alla volta! 🌊✨ 

# 🚿 Wash The World - Backend

## 📋 Descrizione
Backend per l'applicazione "Wash The World" con sistema di onboarding gamificato, gestione utenti, task e badge.

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js v18+
- npm o yarn

### Installazione
```bash
npm install
```

### Modalità Sviluppo
```bash
# Server semplice (senza database)
npm run dev:simple

# Server completo (con MongoDB)
npm run dev
```

### Modalità Produzione
```bash
npm start
```

## 🔧 Configurazione

### Variabili d'Ambiente
Copia `.env.example` in `.env`:
```bash
cp .env.example .env
```

### Database
- **Modalità semplice**: Database in memoria (per test)
- **Modalità completa**: MongoDB Atlas

## 📡 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registrazione
- `GET /api/auth/profile` - Profilo utente

### Onboarding
- `GET /api/onboarding/dashboard` - Dashboard principale
- `GET /api/onboarding/tasks/:id` - Dettagli task
- `POST /api/onboarding/tasks/:id/complete` - Completa task
- `GET /api/onboarding/badges` - Lista badge

### Wallet
- `GET /api/wallet/balance` - Saldo wallet
- `POST /api/wallet/transfer` - Trasferimento token

## 🧪 Test
```bash
# Test unitari
npm test

# Test API
npm run test:api
```

## 📊 Monitoraggio
- Health check: `GET /health`
- Status: `GET /status`

## 🔒 Sicurezza
- CORS configurato
- Rate limiting
- Helmet middleware
- Input validation

## 📝 Log
- Console logs per debug
- Error tracking
- Performance monitoring

## 🚀 Deploy
1. Configura variabili d'ambiente
2. Installa dipendenze: `npm install --production`
3. Avvia: `npm start`

## 📞 Supporto
Per problemi o domande, contatta il team di sviluppo. 