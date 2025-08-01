# 🔧 Configurazione Variabili d'Ambiente Vercel

## Variabili da Impostare su Vercel

Vai su: **Settings → Environment Variables**

### Variabili Richieste:

1. **JWT_SECRET**
   - Value: `your-super-secret-jwt-key-2025`
   - Environment: Production, Preview, Development

2. **NODE_ENV**
   - Value: `production`
   - Environment: Production, Preview, Development

## 🔗 Link Utili

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Progetto**: my.pentashop.world
- **Deploy URL**: https://my.pentashop.world

## 📋 Comandi per Deploy

```bash
# Se hai Vercel CLI installato
vercel --prod

# Oppure push su GitHub trigger automatico
git push origin main
```

## 🎯 Risultato Atteso

- **Frontend**: https://my.pentashop.world
- **API**: https://my.pentashop.world/api/*
- **Health Check**: https://my.pentashop.world/api/health 