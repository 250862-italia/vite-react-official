# 🚀 Wash The World Platform

Piattaforma MLM & E-commerce per Wash The World

## 🎯 Caratteristiche

- **Sistema MLM Completo**: Gestione commissioni multi-livello
- **E-commerce Integrato**: Vendita prodotti ecologici
- **Sistema di Onboarding**: Task e quiz per nuovi utenti
- **Dashboard Avanzato**: Statistiche e analytics
- **Sistema di Referral**: Codici di invito e network
- **Gestione Ambassador**: Livelli e upgrade automatici

## 🛠️ Installazione

### Prerequisiti
- Node.js >= 18.0.0
- npm >= 8.0.0

### Setup Rapido

1. **Installa le dipendenze**:
```bash
npm run install:all
```

2. **Avvia l'applicazione**:
```bash
./start.sh
```

Oppure manualmente:
```bash
npm run dev
```

## 🌐 Accesso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

### 🔐 Credenziali di Test

| Username | Password | Ruolo | Descrizione |
|----------|----------|-------|-------------|
| `testuser` | `password` | entry_ambassador | Utente normale |
| `admin` | `admin123` | admin | Amministratore |
| `ambassador1` | `ambassador123` | mlm_ambassador | Ambassador MLM |
| `Gianni 62` | `password123` | ambassador | Gianni Rossi |
| `testuser2` | `password123` | ambassador | Giuseppe Verdi |
| `nuovo` | `password123` | entry_ambassador | Nuovo utente |

## 📊 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registrazione nuovo utente

### Dashboard
- `GET /api/dashboard/:userId` - Dati dashboard utente
- `GET /api/dashboard/stats/:userId` - Statistiche avanzate

### Task & Onboarding
- `GET /api/tasks` - Lista task disponibili
- `POST /api/tasks/complete` - Completamento task
- `GET /api/tasks/user/:userId` - Task completati dall'utente

### MLM & Commissioni
- `GET /api/mlm/commissions/:userId` - Commissioni utente
- `GET /api/mlm/network/:userId` - Struttura network
- `POST /api/mlm/referral` - Aggiunta referral

### Prodotti & E-commerce
- `GET /api/products` - Lista prodotti
- `POST /api/orders` - Creazione ordine
- `GET /api/orders/user/:userId` - Ordini utente

## 🔧 Sviluppo

### Struttura Progetto
```
my.pentashop.world/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express
├── data/             # File JSON per dati
└── docs/             # Documentazione
```

### Script Disponibili
- `npm run dev` - Avvia frontend + backend
- `npm run build` - Build frontend
- `npm run test` - Esegue i test
- `npm run install:all` - Installa tutte le dipendenze

## 🚨 Risoluzione Problemi

### Errore "ERR_CONNECTION_REFUSED"
1. Verifica che i server siano in esecuzione
2. Controlla le porte 3000 e 5173
3. Usa `./start.sh` per riavviare tutto

### Errore durante il login
1. **Problema**: `TypeError: user.completedTasks.includes is not a function`
2. **Soluzione**: Il backend è stato aggiornato per gestire automaticamente questo errore
3. **Verifica**: Usa `node test-app.js` per testare l'applicazione

### Errore PostCSS/Tailwind
1. Reinstalla le dipendenze: `npm run install:all`
2. Verifica la configurazione PostCSS

### Errore nel caricamento dei pacchetti
1. **Problema**: Dipendenze mancanti o conflitti
2. **Soluzione rapida**: `./fix-dependencies.sh`
3. **Soluzione manuale**:
   ```bash
   cd frontend && npm install @remix-run/router
   npm install react-router-dom@latest
   cd ../backend && npm install
   ```

### Porta già in uso
```bash
pkill -f "node" && pkill -f "vite"
./start.sh
```

### Test dell'applicazione
```bash
node test-app.js
```

### 🔐 Problemi con credenziali admin

**Sintomi:**
- Login admin non funziona
- Errore "Credenziali non valide" per admin

**Soluzione:**
1. **Credenziali corrette**: `admin` / `admin123` (tutto minuscolo)
2. **Test specifico**: `node test-admin.js`
3. **Verifica completa**: `node test-login.js`
4. **Documentazione**: Vedi `VERIFICA_ADMIN.md`

## 📝 Credenziali Test

- **Utente**: testuser / password
- **Admin**: admin / admin123 ✅ **FUNZIONANTE**
- **Ambassador**: ambassador1 / ambassador123

## 🔐 Sicurezza

- JWT per autenticazione
- Rate limiting attivo
- CORS configurato
- Helmet per sicurezza headers

## 📈 Statistiche

- **Utenti**: 6 (test)
- **Task**: 6 disponibili
- **Prodotti**: 12 disponibili
- **Piani Commissioni**: 4 livelli

---

**Sviluppato da**: 250862-italia  
**Versione**: 1.0.0  
**Licenza**: MIT 