# Backend API - MY.PENTASHOP.WORLD

## 🚀 Deploy su Railway

### Prerequisiti
- Account Railway (gratuito)
- Node.js 18+

### Deploy Automatico

1. **Vai su Railway.app**
2. **Clicca "New Project"**
3. **Seleziona "Deploy from GitHub repo"**
4. **Seleziona il repository**: `250862-italia/vite-react-official`
5. **Seleziona la directory**: `backend`
6. **Railway rileverà automaticamente**:
   - `package.json`
   - `railway.json`
   - Script di start: `npm start`

### Variabili d'Ambiente

Railway configurerà automaticamente:
- `PORT` (Railway assegna automaticamente)
- `NODE_ENV=production`

### URL del Deploy

Dopo il deploy, Railway fornirà un URL come:
`https://your-backend-name.railway.app`

### Aggiornare Frontend

Una volta ottenuto l'URL del backend, aggiorna:
```javascript
// frontend/src/config/api.js
baseURL: process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-name.railway.app/api'  // Sostituire con URL Railway
  : 'http://localhost:3001/api'
```

## 🔧 Deploy Manuale

### 1. Installa Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login
```bash
railway login
```

### 3. Inizializza Progetto
```bash
railway init
```

### 4. Deploy
```bash
railway up
```

## 📊 Endpoints Disponibili

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `GET /api/users` - Lista utenti
- `POST /api/users` - Registrazione
- `GET /api/tasks` - Lista task
- `GET /api/commissions` - Commissioni
- `GET /api/mlm/network` - Rete MLM

## 🔒 Sicurezza

- Rate limiting configurato
- CORS abilitato per frontend
- JWT authentication
- Helmet per headers di sicurezza 