# 🔐 Credenziali di Test - Wash The World Platform

## 📋 Credenziali Disponibili

### 👤 Utenti Principali

| Username | Password | Ruolo | Nome Completo | Livello | Punti |
|----------|----------|-------|---------------|---------|-------|
| `testuser` | `password` | entry_ambassador | Mario Rossi | 1 | 125 |
| `admin` | `admin123` | admin | Admin System | 10 | 5000 |
| `ambassador1` | `ambassador123` | mlm_ambassador | Giulia Bianchi | 3 | 450 |

### 👥 Utenti Aggiuntivi

| Username | Password | Ruolo | Nome Completo | Livello | Punti |
|----------|----------|-------|---------------|---------|-------|
| `Gianni 62` | `password123` | ambassador | Gianni Rossi | 1 | 0 |
| `testuser2` | `password123` | ambassador | Giuseppe Verdi | 1 | 0 |
| `nuovo` | `password123` | entry_ambassador | Nuovo Utente | 1 | 0 |

## 🎯 Ruoli e Permessi

### 🔧 Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Ruolo**: `admin`
- **Permessi**: Accesso completo a tutte le funzionalità
- **Livello**: 10
- **Punti**: 5000
- **Status**: ✅ **FUNZIONANTE** - Testato e verificato

### 🌟 MLM Ambassador
- **Username**: `ambassador1`
- **Password**: `ambassador123`
- **Ruolo**: `mlm_ambassador`
- **Permessi**: Sistema MLM completo, commissioni multi-livello
- **Livello**: 3
- **Punti**: 450

### 👤 Entry Ambassador
- **Username**: `testuser`
- **Password**: `password`
- **Ruolo**: `entry_ambassador`
- **Permessi**: Funzionalità base, onboarding
- **Livello**: 1
- **Punti**: 125

### 🆕 Nuovi Utenti
- **Username**: `nuovo`
- **Password**: `password123`
- **Ruolo**: `entry_ambassador`
- **Permessi**: Funzionalità base, onboarding da completare
- **Livello**: 1
- **Punti**: 0

## 🧪 Test delle Credenziali

Per testare tutte le credenziali, esegui:

```bash
node test-login.js
```

Questo script testerà:
- ✅ Login con credenziali valide
- ❌ Login con credenziali errate
- 🔍 Verifica dei ruoli e permessi

## 🚀 Avvio Rapido

Per avviare l'applicazione con tutte le credenziali:

```bash
./start-app.sh
```

## 📱 Accesso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔍 Troubleshooting

### Problema: "Credenziali non valide"
1. Verifica che il backend sia in esecuzione
2. Controlla che le credenziali siano corrette
3. Usa `node test-login.js` per verificare

### Problema: "ERR_CONNECTION_REFUSED"
1. Avvia il backend: `cd backend && npm run dev`
2. Avvia il frontend: `cd frontend && npm run dev`
3. Usa `./start-app.sh` per avviare tutto automaticamente

### Problema: Porta già in uso
1. Ferma i processi: `pkill -f "node" && pkill -f "vite"`
2. Riavvia con `./start-app.sh` 