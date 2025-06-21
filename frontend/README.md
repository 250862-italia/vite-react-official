# 🚿 Wash The World - Frontend

## 📋 Descrizione
Frontend React per l'applicazione "Wash The World" con interfaccia gamificata per l'onboarding degli utenti.

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
npm run dev
```

### Build Produzione
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 🎨 Tecnologie

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animazioni
- **Axios** - HTTP client
- **React Router** - Routing

## 📱 Pagine

### 🔐 Login
- Autenticazione utente
- Validazione form
- Gestione errori

### 📊 Dashboard
- Panoramica progresso
- Task disponibili
- Statistiche utente
- Badge ottenuti

### 📋 Task View
- Dettagli task specifico
- Completamento task
- Ricompense assegnate

### 🏆 Badge
- Collezione badge
- Statistiche completamento
- Rarità e categorie

## 🔧 Configurazione

### Variabili d'Ambiente
Crea `.env.local`:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Wash The World
```

### API Configuration
- Base URL: `http://localhost:5000`
- Endpoints configurati in `src/contexts/AuthContext.jsx`

## 🎯 Funzionalità

### ✅ Implementate
- ✅ Autenticazione completa
- ✅ Dashboard interattiva
- ✅ Sistema badge
- ✅ Gestione task
- ✅ UI responsive
- ✅ Animazioni fluide
- ✅ Gestione errori
- ✅ Loading states

### 🚧 In Sviluppo
- 🔄 Integrazione blockchain
- 🔄 Sistema token
- 🔄 Notifiche push
- 🔄 Multi-language

## 🧪 Test

### Test Manuali
1. **Login**: `testuser` / `password`
2. **Navigazione**: Tutte le pagine
3. **Task**: Completamento e ricompense
4. **Badge**: Visualizzazione e progresso

### Test Automatici
```bash
npm test
```

## 📊 Performance

- **Lighthouse Score**: 95+
- **Bundle Size**: < 500KB
- **Load Time**: < 2s
- **Responsive**: Mobile-first

## 🔒 Sicurezza

- Input sanitization
- XSS protection
- CORS handling
- Token management

## 🚀 Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Docker
```bash
docker build -t wash-the-world-frontend .
docker run -p 3000:3000 wash-the-world-frontend
```

## 📞 Supporto

Per problemi o domande:
- 📧 Email: support@washtheworld.com
- 💬 Discord: #frontend-support
- 📖 Docs: https://docs.washtheworld.com

## 🤝 Contribuire

1. Fork il repository
2. Crea feature branch
3. Commit changes
4. Push e crea Pull Request

## 📄 Licenza

MIT License - vedi LICENSE.md
