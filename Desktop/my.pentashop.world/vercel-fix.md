# 🔧 Risoluzione Problemi Deploy Vercel

## Problema: DEPLOYMENT_NOT_FOUND

### Soluzioni:

### 1. **Riconfigurare Progetto Vercel**
- Vai su: https://vercel.com/dashboard
- **Importa Nuovo Progetto** da GitHub
- Seleziona: `250862-italia/vite-react-official`
- **Framework Preset**: Other
- **Root Directory**: `./` (root del progetto)
- **Build Command**: `cd frontend && npm run build:unified`
- **Output Directory**: `frontend/dist`

### 2. **Configurare Variabili d'Ambiente**
Vai su: **Settings → Environment Variables**

| Nome | Valore | Environment |
|------|--------|-------------|
| `JWT_SECRET` | `your-super-secret-jwt-key-2025` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production, Preview, Development |

### 3. **Verificare vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "buildCommand": "npm run build:unified"
      }
    },
    {
      "src": "frontend/api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/frontend/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ]
}
```

### 4. **Test Locale Prima del Deploy**
```bash
cd frontend
npm run build:unified
node api/index.js
curl http://localhost:3001/api/health
```

### 5. **Alternative: Deploy Manuale**
Se il deploy automatico non funziona:
```bash
# Installa Vercel CLI
npm install -g vercel

# Login e deploy
vercel login
vercel --prod
```

## 🎯 URL Attesi
- **Frontend**: https://my.pentashop.world
- **API**: https://my.pentashop.world/api/*
- **Health**: https://my.pentashop.world/api/health 