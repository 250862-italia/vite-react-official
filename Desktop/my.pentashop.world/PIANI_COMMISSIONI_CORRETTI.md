# 🔥 PIANI COMMISSIONI CORRETTI – WASH THE WORLD

## 📊 **STRUTTURA DEFINITIVA IMPLEMENTATA**

### 🎁 **1. Wash The World Ambassador (17,90€ + IVA)**
- **Codice**: `WTW_AMBASSADOR`
- **Ruolo**: `wtw_ambassador`
- **Commissione Diretta**: ✅ **10% solo sul diretto**
- **Livelli Inferiori**: ❌ **0% su tutti i livelli**
- **Descrizione**: "Con questo pacchetto sei un ambassador semplice. Guadagni solo su chi porti direttamente, ma non benefici della rete che si sviluppa sotto."

### 🚀 **2. Welcome Kit Ambassador MLM (69,50€ + IVA)**
- **Codice**: `MLM_AMBASSADOR`
- **Ruolo**: `mlm_ambassador`
- **Commissioni**:
  - **Vendita Diretta**: ✅ **20%**
  - **1° Livello**: ✅ **6%**
  - **2° Livello**: ✅ **5%**
  - **3° Livello**: ✅ **4%**
  - **4° Livello**: ✅ **3%**
  - **5° Livello**: ✅ **2%**
- **Descrizione**: "Se vuoi fare davvero network marketing, questo è il minimo pacchetto per iniziare a costruire rendite profonde."

### 🎮 **3. Welcome Kit PENTAGAME (242€ + IVA)**
- **Codice**: `PENTAGAME_AMBASSADOR`
- **Ruolo**: `pentagame_ambassador`
- **Commissioni**:
  - **Vendita Diretta**: ✅ **31,5%**
  - **1° Livello**: ✅ **5,5%**
  - **2° Livello**: ✅ **3,8%**
  - **3° Livello**: ✅ **1,8%**
  - **4° Livello**: ✅ **1%**
  - **5° Livello**: ❌ **0%**
- **Descrizione**: "Il pacchetto da veri leader: commissioni più alte e più profonde. Se vuoi guadagnare da tutta la tua rete, questo è il tuo piano."

## ⚖️ **REGOLE CHIAVE IMPLEMENTATE**

### **1. Compatibilità tra Pacchetti**
- Le **commissioni che ricevi** dipendono **dal pacchetto che TU hai acquistato**
- **NON** dal pacchetto che vende la tua rete
- Se vendi un pacchetto superiore al tuo, **ricevi solo fino al tuo limite**

### **2. Esempio Pratico**
```
🧍‍♂️ Marco ha il pacchetto da 69,50€ (MLM_AMBASSADOR)
👤 Chiara (sua prima linea) compra il pacchetto da 242€ (PENTAGAME_AMBASSADOR)
✅ Marco riceve solo il 20% diretto e le % previste fino al 5° livello
❌ Non ha diritto alle % superiori previste dal pacchetto Pentagame
```

### **3. Sistema Meritocratico**
- **Nessun salto di livello** = **nessuna rendita profonda**
- **Vuoi guadagnare di più?** → **Fai l'upgrade**
- Il sistema è **scalabile** e **meritocratico**

## 🛠️ **IMPLEMENTAZIONE TECNICA**

### **Backend - Mappatura Ruoli**
```javascript
const roleMapping = {
  'WTW_AMBASSADOR': 'wtw_ambassador',
  'MLM_AMBASSADOR': 'mlm_ambassador',
  'PENTAGAME_AMBASSADOR': 'pentagame_ambassador'
};

const levelMapping = {
  'WTW_AMBASSADOR': 'WTW',
  'MLM_AMBASSADOR': 'MLM',
  'PENTAGAME_AMBASSADOR': 'PENTAGAME'
};
```

### **Frontend - Visualizzazione**
```javascript
const getRoleLabel = (role) => {
  const roles = {
    'wtw_ambassador': '🌍 WTW Ambassador (17,90€)',
    'mlm_ambassador': '🌊 MLM Ambassador (69,50€)',
    'pentagame_ambassador': '🎮 Pentagame Ambassador (242€)'
  };
  return roles[role] || role;
};
```

## 📊 **DATABASE AGGIORNATO**

### **commission-plans.json**
```json
[
  {
    "id": 1,
    "name": "WASH THE WORLD AMBASSADOR",
    "code": "WTW_AMBASSADOR",
    "cost": 17.90,
    "directSale": 0.10,
    "level1": 0,
    "level2": 0,
    "level3": 0,
    "level4": 0,
    "level5": 0
  },
  {
    "id": 2,
    "name": "WELCOME KIT AMBASSADOR MLM",
    "code": "MLM_AMBASSADOR",
    "cost": 69.50,
    "directSale": 0.20,
    "level1": 0.06,
    "level2": 0.05,
    "level3": 0.04,
    "level4": 0.03,
    "level5": 0.02
  },
  {
    "id": 3,
    "name": "WELCOME KIT PENTAGAME",
    "code": "PENTAGAME_AMBASSADOR",
    "cost": 242.00,
    "directSale": 0.315,
    "level1": 0.055,
    "level2": 0.038,
    "level3": 0.018,
    "level4": 0.01,
    "level5": 0
  }
]
```

## 🎯 **CONCLUSIONE OPERATIVA**

### **✅ Sistema Completamente Aggiornato**
1. **Piani commissioni corretti** con prezzi e percentuali esatte
2. **Mappatura ruoli automatica** basata sui pacchetti acquistati
3. **Regole di compatibilità** implementate
4. **Frontend aggiornato** con visualizzazione prezzi
5. **Database sincronizzato** con la struttura corretta

### **✅ Vantaggi del Sistema**
- **Meritocratico**: Chi investe di più guadagna di più
- **Scalabile**: Facile aggiungere nuovi livelli
- **Trasparente**: Commissioni chiare e definite
- **Automatico**: Ruoli aggiornati automaticamente

### **✅ Pronto per il Test**
Il sistema è ora **completamente allineato** alle specifiche fornite e pronto per essere testato con i piani commissioni corretti. 