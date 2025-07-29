# 🔧 Troubleshooting - Wash The World Platform

## 🚨 Problemi Comuni e Soluzioni

### ❌ Errore nel caricamento dei pacchetti

**Sintomi:**
- `Could not resolve "@remix-run/router"`
- `Missing script: "dev"`
- Errori di dipendenze npm

**Soluzione Rapida:**
```bash
./fix-dependencies.sh
```

**Soluzione Manuale:**
```bash
# Frontend
cd frontend
npm install @remix-run/router
npm install react-router-dom@latest

# Backend
cd ../backend
npm install

# Principale
cd ..
npm install
```

### ⚠️ Credenziali non valide

**Sintomi:**
- Errore "Credenziali non valide" al login
- Impossibilità di accedere all'applicazione

**Soluzione:**
1. Verifica che il backend sia in esecuzione: `curl http://localhost:3000/health`
2. Usa le credenziali corrette (vedi `CREDENZIALI.md`)
3. Testa con: `node test-login.js`

### 🔌 ERR_CONNECTION_REFUSED

**Sintomi:**
- Impossibilità di raggiungere il sito
- Connessione negata da localhost

**Soluzione:**
```bash
# Ferma processi esistenti
pkill -f "node" && pkill -f "vite"

# Avvia l'applicazione
./start-app.sh
```

### 🚫 Porta già in uso

**Sintomi:**
- `Error: listen EADDRINUSE: address already in use :::3000`
- `Port 5173 is in use, trying another one...`

**Soluzione:**
```bash
# Ferma tutti i processi
pkill -f "node" && pkill -f "vite" && pkill -f "nodemon"

# Aspetta e riavvia
sleep 3
./start-app.sh
```

### 📦 Errori PostCSS/Tailwind

**Sintomi:**
- Errori di compilazione CSS
- Problemi con Tailwind CSS

**Soluzione:**
```bash
cd frontend
npm install tailwindcss@latest postcss@latest autoprefixer@latest
```

### 🔐 Errori di Autenticazione

**Sintomi:**
- `TypeError: user.completedTasks.includes is not a function`
- Errori nella dashboard

**Soluzione:**
Il backend è stato aggiornato per gestire automaticamente questi errori. Se persistono:
```bash
cd backend
node src/index.js
```

## 🛠️ Script di Risoluzione

### 🔧 Fix Dependencies
```bash
./fix-dependencies.sh
```
Risolve automaticamente i problemi di dipendenze.

### 🚀 Start Application
```bash
./start-app.sh
```
Avvia l'applicazione con tutte le verifiche.

### 🧪 Test Login
```bash
node test-login.js
```
Testa tutte le credenziali di login.

## 📊 Verifica Stato

### Backend
```bash
curl http://localhost:3000/health
```

### Frontend
```bash
curl http://localhost:5173/
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}'
```

## 🎯 Credenziali di Test

| Username | Password | Ruolo |
|----------|----------|-------|
| `testuser` | `password` | entry_ambassador |
| `admin` | `admin123` | admin |
| `ambassador1` | `ambassador123` | mlm_ambassador |
| `Gianni 62` | `password123` | ambassador |
| `testuser2` | `password123` | ambassador |
| `nuovo` | `password123` | entry_ambassador |

## 📞 Supporto

Se i problemi persistono:

1. **Verifica log**: Controlla i messaggi di errore nel terminale
2. **Riavvia tutto**: `./fix-dependencies.sh && ./start-app.sh`
3. **Test completo**: `node test-login.js`
4. **Verifica porte**: `lsof -i :3000` e `lsof -i :5173` 