# 🚀 Guida Deploy - Wash The World Platform

## 📋 Prerequisiti

- [ ] Account Vercel (gratuito)
- [ ] Account Railway/Heroku (per backend)
- [ ] Dominio personalizzato (opzionale)
- [ ] SSL certificate (automatico con Vercel)

## 🔧 Deploy Frontend (Vercel)

### 1. Preparazione
```bash
cd frontend
npm run build
```

### 2. Deploy su Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository GitHub
4. Configura:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Variabili d'Ambiente
Aggiungi in Vercel Dashboard:
```
VITE_API_URL=https://your-backend-domain.com
```

### 4. Dominio Personalizzato
1. Vai su "Settings" > "Domains"
2. Aggiungi il tuo dominio
3. Configura i DNS records

## 🔧 Deploy Backend (Railway/Heroku)

### Opzione 1: Railway (Consigliato)
1. Vai su [railway.app](https://railway.app)
2. Clicca "New Project"
3. Importa il repository GitHub
4. Configura:
   - **Service Type**: Node.js
   - **Start Command**: `node src/index-simple.js`

### Opzione 2: Heroku
1. Vai su [heroku.com](https://heroku.com)
2. Crea nuova app
3. Connetti il repository
4. Deploy automatico

### Variabili d'Ambiente Backend
```
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🌐 Configurazione DNS

### Record DNS da configurare:
```
A     @     76.76.19.19
CNAME www   your-domain.com
```

## 🔒 Sicurezza

### 1. CORS Configuration
Aggiorna `backend/src/index-simple.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### 2. Rate Limiting
Già configurato nel backend.

### 3. Helmet Security
Già configurato nel backend.

## 📊 Monitoraggio

### 1. Vercel Analytics
- Abilita in Dashboard Vercel
- Monitora performance frontend

### 2. Railway/Heroku Logs
- Monitora errori backend
- Performance metrics

### 3. Health Checks
- Frontend: `https://your-domain.com`
- Backend: `https://your-backend-domain.com/health`

## 🚀 Post-Deploy Checklist

### Frontend
- [ ] Sito accessibile
- [ ] API calls funzionanti
- [ ] Responsive design
- [ ] Performance ottimale
- [ ] SSL attivo

### Backend
- [ ] API endpoints rispondono
- [ ] Database connesso
- [ ] CORS configurato
- [ ] Logs attivi
- [ ] Health check OK

### Integrazione
- [ ] Login funzionante
- [ ] Dashboard carica dati
- [ ] Shop funziona
- [ ] Commissioni calcolate
- [ ] Badge system attivo

## 🔄 CI/CD Pipeline

### GitHub Actions
Il workflow è già configurato in `.github/workflows/node.js.yml`

### Deploy Automatico
- Push su `main` → Deploy automatico
- Pull Request → Preview deployment

## 📱 Mobile App (Futuro)

### React Native
```bash
npx create-expo-app wash-the-world-mobile
cd wash-the-world-mobile
npm install
```

### Configurazione
- API URL: `https://your-backend-domain.com`
- Deep linking configurato
- Push notifications

## 🎯 Lancio Ufficiale

### Data: 1 Luglio 2025
### Checklist Finale:
- [ ] Test completi
- [ ] Performance ottimale
- [ ] Sicurezza verificata
- [ ] Backup configurato
- [ ] Team notificato
- [ ] Marketing ready

## 📞 Support

### Emergenze
- **Frontend down**: Riavvia su Vercel
- **Backend down**: Riavvia su Railway/Heroku
- **Database issues**: Controlla logs

### Contatti
- **Sviluppatore**: AI Assistant
- **Documentazione**: README.md
- **Issues**: GitHub Issues

---

## 🎉 Deploy Completato!

**URL Frontend**: https://your-domain.com
**URL Backend**: https://your-backend-domain.com
**Status**: 🟢 Online e funzionante 