# 🧪 **MLM SYSTEM STRUCTURAL STRESS TEST – VERSIONE ESTESA (PACCHETTI REALI)**

## 🎯 **OBIETTIVO DEL TEST**
Verificare la robustezza completa del sistema MLM con pacchetti reali e simulazione di vendite realistiche.

---

## 🔁 **FASE 1 – Test Strutturale Utente & Profilo Gianni62**

### **1.1 Registrazione 10 Utenti Consecutivi**
**Struttura gerarchica da creare:**
```
PAPA1 (Livello 0)
 ├── FIGLIO1 (Livello 1)
 │    ├── NIPOTE1 (Livello 2)
 │    │    └── PRONIPOTE1 (Livello 3)
 │    └── NIPOTE2 (Livello 2)
 │         └── PRONIPOTE2 (Livello 3)
 └── FIGLIO2 (Livello 1)
      ├── NIPOTE3 (Livello 2)
      │    └── PRONIPOTE3 (Livello 3)
      └── NIPOTE4 (Livello 2)
           └── PRONIPOTE4 (Livello 3)
```

### **1.2 Test per Ogni Utente**
- ✅ **Login** con credenziali corrette
- ✏️ **Modifica profilo**: nome, cognome, email
- 🔁 **Logout e nuovo login**
- 🧠 **Verifica persistenza** delle modifiche

### **1.3 Controlli Richiesti**
- ✅ Nessun errore in login/register
- ✅ Nessuna sovrascrittura tra profili
- ✅ Codici risposta `200 OK` su tutti gli endpoint
- ✅ Link referral corretti per ogni utente

---

## 🌐 **FASE 2 – Gerarchia MLM a 4 Livelli**

### **2.1 Struttura da Ricreare**
```markdown
PAPA1 (ID: 3)
 ├── FIGLIO1 (ID: 4) - Sponsor: PAPA1
 │    ├── NIPOTE1 (ID: 6) - Sponsor: FIGLIO1
 │    │    └── PRONIPOTE1 (ID: 10) - Sponsor: NIPOTE1
 │    └── NIPOTE2 (ID: 7) - Sponsor: FIGLIO1
 │         └── PRONIPOTE2 (ID: 11) - Sponsor: NIPOTE2
 └── FIGLIO2 (ID: 5) - Sponsor: PAPA1
      ├── NIPOTE3 (ID: 8) - Sponsor: FIGLIO2
      │    └── PRONIPOTE3 (ID: 12) - Sponsor: NIPOTE3
      └── NIPOTE4 (ID: 9) - Sponsor: FIGLIO2
           └── PRONIPOTE4 (ID: 13) - Sponsor: NIPOTE4
```

### **2.2 Verifiche Gerarchiche**
- ✅ **Sponsor ID**: Correttamente assegnato
- ✅ **Livelli**: Calcolati automaticamente
- ✅ **Referral Code**: Unico per ogni utente
- ✅ **Network**: Visualizzazione corretta

---

## 💰 **FASE 3 – Simulazione Vendite Realistiche**

### **3.1 Pacchetti Reali da Utilizzare**
```json
{
  "WELCOME KIT MLM": {
    "id": 1,
    "name": "WELCOME KIT MLM",
    "cost": 139.00,
    "commissionRates": {
      "directSale": 0.10,
      "level1": 0.05,
      "level2": 0.03,
      "level3": 0.02,
      "level4": 0.01
    }
  },
  "WELCOME KIT PENTAGAME": {
    "id": 2,
    "name": "WELCOME KIT PENTAGAME",
    "cost": 199.00,
    "commissionRates": {
      "directSale": 0.12,
      "level1": 0.06,
      "level2": 0.04,
      "level3": 0.03,
      "level4": 0.02
    }
  },
  "WASH THE WORLD AMBASSADOR": {
    "id": 3,
    "name": "WASH THE WORLD AMBASSADOR",
    "cost": 299.00,
    "commissionRates": {
      "directSale": 0.15,
      "level1": 0.08,
      "level2": 0.05,
      "level3": 0.03,
      "level4": 0.02
    }
  }
}
```

### **3.2 Distribuzione Vendite**
**Totale: 10 vendite**

- 🎁 **3 x WELCOME KIT MLM** (€139.00 ciascuno)
- 🎁 **3 x WELCOME KIT PENTAGAME** (€199.00 ciascuno)  
- 🎁 **4 x WASH THE WORLD AMBASSADOR** (€299.00 ciascuno)

### **3.3 Assegnazione Vendite per Utente**
```
PAPA1: 2 vendite (1 WELCOME KIT MLM + 1 WASH THE WORLD AMBASSADOR)
FIGLIO1: 2 vendite (1 WELCOME KIT PENTAGAME + 1 WASH THE WORLD AMBASSADOR)
FIGLIO2: 2 vendite (1 WELCOME KIT MLM + 1 WASH THE WORLD AMBASSADOR)
NIPOTE1: 1 vendita (1 WELCOME KIT PENTAGAME)
NIPOTE2: 1 vendita (1 WELCOME KIT MLM)
NIPOTE3: 1 vendita (1 WASH THE WORLD AMBASSADOR)
NIPOTE4: 1 vendita (1 WELCOME KIT PENTAGAME)
```

### **3.4 Processo di Vendita**
Per ogni vendita:
1. **Selezione pacchetto** dal dropdown reale
2. **Simulazione pagamento** con dati validi
3. **Conferma acquisto** con referral corretto
4. **Tracciamento commissioni** automatico

---

## 📊 **FASE 4 – Calcolo Commissioni e Validazione MLM**

### **4.1 Commissioni Attese per Livello**
```markdown
Livello 0 (PAPA1): 15% dirette + commissioni upline
Livello 1 (FIGLIO1/FIGLIO2): 10-12% dirette + commissioni upline  
Livello 2 (NIPOTE1-4): 8-15% dirette + commissioni upline
Livello 3 (PRONIPOTE1-4): 10-15% dirette + commissioni upline
```

### **4.2 Esempio Calcolo Commissioni**
**Vendita: WASH THE WORLD AMBASSADOR (€299.00) da NIPOTE1**

```
NIPOTE1 (venditore diretto): €299.00 × 15% = €44.85
FIGLIO1 (livello 1): €299.00 × 8% = €23.92
PAPA1 (livello 2): €299.00 × 5% = €14.95
```

### **4.3 Log Completo Richiesto**
Per ogni vendita registrare:
- ✅ **Venditore diretto**: ID, nome, livello
- ✅ **Upline**: Tutti i livelli fino a PAPA1
- ✅ **Pacchetto**: Nome, costo, commissioni
- ✅ **Percentuali**: Distribuite per livello
- ✅ **Totale commissioni**: Calcolato e verificato

---

## 🔐 **FASE 5 – Sicurezza & Integrità Dati**

### **5.1 Test di Sicurezza**
- ✅ **Doppia registrazione**: Stessa email → deve bloccare
- ✅ **Vendita senza referral**: Deve bloccare o mostrare errore
- ✅ **Login multipli**: Nessuna sessione corrotta
- ✅ **Verifica ID**: Coerenza database

### **5.2 Test di Integrità**
- ✅ **Token JWT**: Validità e scadenza
- ✅ **Dati utente**: Persistenza corretta
- ✅ **Commissioni**: Calcolo accurato
- ✅ **Network**: Struttura gerarchica intatta

---

## 📄 **FASE 6 – Report Finale**

### **6.1 Formato Report (.json)**
```json
{
  "testInfo": {
    "date": "2025-01-30",
    "duration": "2h 30m",
    "totalUsers": 10,
    "totalSales": 10,
    "totalCommissions": 0
  },
  "users": [
    {
      "id": 3,
      "username": "PAPA1",
      "sponsorId": null,
      "level": 0,
      "sales": [
        {
          "packageId": 1,
          "packageName": "WELCOME KIT MLM",
          "amount": 139.00,
          "commission": 13.90
        }
      ],
      "totalCommissions": 0
    }
  ],
  "errors": [],
  "warnings": []
}
```

### **6.2 Metriche da Verificare**
- ✅ **Tasso di successo**: 100% per registrazioni
- ✅ **Precisione commissioni**: ±0.01€
- ✅ **Tempo di risposta**: <2s per operazioni
- ✅ **Errori**: 0 errori critici

---

## 🚨 **CRITERI DI SUCCESSO**

### **✅ TEST SUPERATO SE:**
- Tutti i 10 utenti registrati correttamente
- Gerarchia MLM a 4 livelli funzionante
- 10 vendite simulate con successo
- Commissioni calcolate correttamente
- Nessun errore critico nel sistema
- Report finale completo e accurato

### **❌ TEST FALLITO SE:**
- Anche un solo step fallisce
- Errori di persistenza dati
- Calcoli commissioni errati
- Problemi di sicurezza
- Perdita di integrità dati

---

## 📌 **NOTA FINALE PER IL DEV**

> **Questo test NON è negoziabile.**
> 
> Se fallisce anche un solo step, **il sistema NON è pronto** per il go-live.
> 
> **Nessuna scusa**: vogliamo **robustezza**, **tracciabilità**, **logica di compensazione trasparente**.
> 
> **Obiettivo**: Sistema MLM enterprise-ready per produzione.

---

## 🔧 **PREPARAZIONE TECNICA**

### **Backend Ready**
- ✅ Endpoint `/api/packages` funzionante
- ✅ Endpoint `/api/sales` funzionante  
- ✅ Endpoint `/api/commissions` funzionante
- ✅ Sistema referral funzionante

### **Frontend Ready**
- ✅ Form registrazione con referral
- ✅ Selezione pacchetti reali
- ✅ Visualizzazione commissioni
- ✅ Network MLM visualizer

### **Database Ready**
- ✅ Pacchetti reali caricati
- ✅ Utenti test preparati
- ✅ Commission plans configurati
- ✅ Settings autorizzazione attivi

---

**🎯 PRONTO PER IL TEST ESTESO MLM!** 🚀 