# 🚀 Avvio Wash The World Platform

## 📋 Prerequisiti

- Node.js 18+ installato
- npm o yarn
- Terminale con supporto per più sessioni

## 🔧 Avvio Backend

### Terminal 1 - Backend
```bash
cd backend

# Installa dipendenze (se non già fatto)
npm install

# Avvia il server semplice (senza MongoDB)
npm run dev:simple

# Il backend sarà disponibile su: http://localhost:5000
```

## 🎨 Avvio Frontend

### Terminal 2 - Frontend
```bash
cd frontend

# Installa dipendenze (se non già fatto)
npm install

# Avvia il server di sviluppo
npm run dev

# Il frontend sarà disponibile su: http://localhost:5173
```

## 🌐 Accesso all'Applicazione

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:5000
3. **Health Check**: http://localhost:5000/health

## 🔑 Credenziali Demo

- **Username**: `testuser`
- **Password**: `password`

## 📱 Test delle Funzionalità

### 1. **Login**
- Vai su http://localhost:5173
- Usa le credenziali demo
- Dovresti essere reindirizzato alla dashboard

### 2. **Dashboard Onboarding**
- Visualizza il progresso
- Esplora i task disponibili
- Controlla i badge

### 3. **Task Interattivi**
- Clicca su un task per aprirlo
- Completa video o quiz
- Guadagna punti e token

### 4. **Badge**
- Vai alla sezione badge
- Visualizza quelli guadagnati e disponibili

## 🔧 Troubleshooting

### Backend non si avvia
```bash
# Verifica che la porta 5000 sia libera
lsof -i :5000

# Se occupata, termina il processo
kill -9 <PID>
```

### Frontend non si avvia
```bash
# Verifica che la porta 5173 sia libera
lsof -i :5173

# Se occupata, termina il processo
kill -9 <PID>
```

### Errori CORS
- Il proxy Vite dovrebbe gestire automaticamente i CORS
- Se persistono, verifica che il backend sia in esecuzione

### Errori di connessione API
- Verifica che il backend sia in esecuzione su porta 5000
- Controlla i log del browser per errori di rete

## 📊 Struttura Progetto

```
my.pentashop.world/
├── backend/           # Server Node.js + Express
│   ├── src/
│   │   ├── index-simple.js  # Server senza MongoDB
│   │   └── ...
│   └── package.json
└── frontend/          # App React + Vite
    ├── src/
    │   ├── pages/     # Pagine principali
    │   ├── contexts/  # React Context
    │   └── ...
    └── package.json
```

## 🎯 Prossimi Passi

1. **Testare tutte le funzionalità**
2. **Personalizzare contenuti e design**
3. **Aggiungere più task e badge**
4. **Integrare MongoDB quando risolto**
5. **Deploy su piattaforma cloud**

---

**🌊 Wash The World** - Rendiamo il mondo più pulito, un'onda alla volta! ✨ 