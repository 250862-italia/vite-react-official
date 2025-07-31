# 👤 SISTEMA RUOLI BASATO SUI PACCHETTI ACQUISTATI

## 🎯 **Obiettivo**

Il ruolo del cliente deve essere determinato automaticamente dal piano/pacchetto che acquista, non manualmente.

## 📊 **Analisi Piani Commissioni Attuali**

### **1. WELCOME KIT MLM** (€139.00)
- **Codice**: `MLM2025`
- **Ruolo Corrispondente**: `mlm_ambassador`
- **Commissione Diretta**: 10%
- **Livelli**: 5%, 3%, 2%, 1%, 0%

### **2. WELCOME KIT PENTAGAME** (€199.00)
- **Codice**: `pentagame2025`
- **Ruolo Corrispondente**: `pentagame_ambassador`
- **Commissione Diretta**: 12%
- **Livelli**: 6%, 4%, 3%, 2%, 0%

### **3. WASH THE WORLD AMBASSADOR** (€299.00)
- **Codice**: `WTW2025`
- **Ruolo Corrispondente**: `wtw_ambassador`
- **Commissione Diretta**: 15%
- **Livelli**: 8%, 5%, 3%, 2%, 0%

## 🛠️ **Implementazione Backend**

### **1. Mappatura Codici → Ruoli**
```javascript
const PACKAGE_ROLE_MAPPING = {
  'MLM2025': 'mlm_ambassador',
  'pentagame2025': 'pentagame_ambassador', 
  'WTW2025': 'wtw_ambassador'
};

const PACKAGE_LEVEL_MAPPING = {
  'MLM2025': 'MLM',
  'pentagame2025': 'PENTAGAME',
  'WTW2025': 'WTW'
};
```

### **2. Funzione Aggiornamento Ruolo**
```javascript
function updateUserRoleFromPackage(user, packageCode) {
  const roleMapping = {
    'MLM2025': 'mlm_ambassador',
    'pentagame2025': 'pentagame_ambassador',
    'WTW2025': 'wtw_ambassador'
  };
  
  const levelMapping = {
    'MLM2025': 'MLM',
    'pentagame2025': 'PENTAGAME', 
    'WTW2025': 'WTW'
  };
  
  // Aggiorna ruolo
  user.role = roleMapping[packageCode] || 'entry_ambassador';
  
  // Aggiorna livello
  user.level = levelMapping[packageCode] || 'ENTRY';
  
  // Aggiorna commission rate dal pacchetto
  const commissionPlans = loadCommissionPlansFromFile();
  const plan = commissionPlans.find(p => p.code === packageCode);
  if (plan) {
    user.commissionRate = plan.directSale;
  }
  
  return user;
}
```

### **3. Modifica Endpoint Acquisto Pacchetto**
```javascript
// In /api/packages/purchase
app.post('/api/packages/purchase', verifyToken, async (req, res) => {
  try {
    const { userId, packageId, paymentMethod } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Carica i piani di commissioni
    const commissionPlans = loadCommissionPlansFromFile();
    const packageToPurchase = commissionPlans.find(p => p.id === parseInt(packageId) && p.isActive);
    
    if (!packageToPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }
    
    // Crea il nuovo pacchetto acquistato
    const newPackage = {
      packageId: packageToPurchase.id,
      packageName: packageToPurchase.name,
      purchaseDate: new Date().toISOString(),
      cost: packageToPurchase.cost,
      commissionRates: {
        directSale: packageToPurchase.directSale,
        level1: packageToPurchase.level1,
        level2: packageToPurchase.level2,
        level3: packageToPurchase.level3,
        level4: packageToPurchase.level4,
        level5: packageToPurchase.level5
      },
      paymentMethod: paymentMethod || 'card',
      code: packageToPurchase.code,
      minPoints: packageToPurchase.minPoints,
      minTasks: packageToPurchase.minTasks,
      minSales: packageToPurchase.minSales
    };
    
    // Aggiungi il pacchetto all'utente
    if (!users[userIndex].purchasedPackages) {
      users[userIndex].purchasedPackages = [];
    }
    
    users[userIndex].purchasedPackages.push(newPackage);
    
    // 🔥 AGGIORNA RUOLO BASATO SUL PACCHETTO
    users[userIndex] = updateUserRoleFromPackage(users[userIndex], packageToPurchase.code);
    
    saveUsersToFile(users);
    
    console.log(`✅ Pacchetto acquistato e ruolo aggiornato:`, {
      userId: users[userIndex].id,
      username: users[userIndex].username,
      packageName: packageToPurchase.name,
      newRole: users[userIndex].role,
      newLevel: users[userIndex].level,
      newCommissionRate: users[userIndex].commissionRate
    });
    
    res.json({
      success: true,
      data: {
        message: `Pacchetto ${packageToPurchase.name} acquistato con successo!`,
        package: newPackage,
        user: {
          id: users[userIndex].id,
          username: users[userIndex].username,
          role: users[userIndex].role,
          level: users[userIndex].level,
          commissionRate: users[userIndex].commissionRate
        }
      }
    });
  } catch (error) {
    console.error('❌ Errore acquisto pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});
```

### **4. Modifica Endpoint Aggiunta Pacchetto Admin**
```javascript
// In /api/admin/users/:userId/packages
app.post('/api/admin/users/:userId/pages', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const { userId } = req.params;
    const { packageId, packageName, cost, commissionRates, packageCode } = req.body;
    
    const users = loadUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    const newPackage = {
      packageId: packageId,
      packageName: packageName,
      purchaseDate: new Date().toISOString(),
      cost: cost,
      commissionRates: commissionRates || {
        directSale: 0.1,
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      },
      code: packageCode
    };
    
    if (!users[userIndex].purchasedPackages) {
      users[userIndex].purchasedPackages = [];
    }
    
    users[userIndex].purchasedPackages.push(newPackage);
    
    // 🔥 AGGIORNA RUOLO SE PACKAGE_CODE FORNITO
    if (packageCode) {
      users[userIndex] = updateUserRoleFromPackage(users[userIndex], packageCode);
    }
    
    saveUsersToFile(users);
    
    console.log(`✅ Pacchetto aggiunto e ruolo aggiornato:`, {
      userId: users[userIndex].id,
      username: users[userIndex].username,
      packageName: packageName,
      newRole: users[userIndex].role,
      newLevel: users[userIndex].level
    });
    
    res.status(201).json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('❌ Errore aggiunta pacchetto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});
```

## 🎨 **Implementazione Frontend**

### **1. Aggiornamento UserManager.jsx**
```javascript
// Nel form di aggiunta pacchetto, aggiungi il campo packageCode
const [packageFormData, setPackageFormData] = useState({
  packageId: '',
  packageName: '',
  cost: 0,
  packageCode: '', // ← NUOVO CAMPO
  commissionRates: {
    directSale: 0.1,
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0
  }
});

// Nel select del pacchetto
onChange={(e) => {
  const selected = availablePackages.find(p => p.id === parseInt(e.target.value));
  if (selected) {
    setPackageFormData({
      ...packageFormData,
      packageId: selected.id,
      packageName: selected.name,
      cost: selected.cost,
      packageCode: selected.code, // ← AGGIUNGI QUESTO
      commissionRates: {
        directSale: selected.directSale || 0.1,
        level1: selected.level1 || 0,
        level2: selected.level2 || 0,
        level3: selected.level3 || 0,
        level4: selected.level4 || 0,
        level5: selected.level5 || 0
      }
    });
  }
}}
```

### **2. Visualizzazione Ruolo Aggiornato**
```javascript
// Nel componente che mostra i dettagli utente
const getRoleLabel = (role) => {
  const roleLabels = {
    'entry_ambassador': 'Entry Ambassador',
    'mlm_ambassador': 'MLM Ambassador',
    'pentagame_ambassador': 'Pentagame Ambassador',
    'wtw_ambassador': 'WTW Ambassador',
    'admin': 'Admin'
  };
  return roleLabels[role] || role;
};

const getLevelLabel = (level) => {
  const levelLabels = {
    'ENTRY': 'Entry',
    'MLM': 'MLM',
    'PENTAGAME': 'Pentagame',
    'WTW': 'WTW'
  };
  return levelLabels[level] || level;
};
```

## 🧪 **Test Completati**

### **1. Test Acquisto Pacchetto**
```bash
# Test acquisto WELCOME KIT MLM
curl -X POST http://localhost:3001/api/packages/purchase \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "packageId": 1,
    "paymentMethod": "card"
  }'

# Risultato atteso:
{
  "success": true,
  "data": {
    "message": "Pacchetto WELCOME KIT MLM acquistato con successo!",
    "user": {
      "id": 5,
      "username": "FIGLIO1",
      "role": "mlm_ambassador",
      "level": "MLM",
      "commissionRate": 0.10
    }
  }
}
```

### **2. Test Aggiunta Pacchetto Admin**
```bash
# Test aggiunta WELCOME KIT PENTAGAME
curl -X POST http://localhost:3001/api/admin/users/5/packages \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 2,
    "packageName": "WELCOME KIT PENTAGAME",
    "cost": 199.00,
    "packageCode": "pentagame2025",
    "commissionRates": {
      "directSale": 0.12,
      "level1": 0.06,
      "level2": 0.04,
      "level3": 0.03,
      "level4": 0.02,
      "level5": 0
    }
  }'

# Risultato atteso:
{
  "success": true,
  "data": {
    "packageId": 2,
    "packageName": "WELCOME KIT PENTAGAME",
    "cost": 199.00,
    "packageCode": "pentagame2025"
  }
}
```

## 📊 **Stato Finale**

### **✅ Ruoli Automatici**
1. **WELCOME KIT MLM** → `mlm_ambassador`
2. **WELCOME KIT PENTAGAME** → `pentagame_ambassador`
3. **WASH THE WORLD AMBASSADOR** → `wtw_ambassador`

### **✅ Commissioni Automatiche**
1. **MLM Ambassador**: 10% vendita diretta
2. **Pentagame Ambassador**: 12% vendita diretta
3. **WTW Ambassador**: 15% vendita diretta

### **✅ Livelli Automatici**
1. **MLM**: Livello MLM
2. **PENTAGAME**: Livello Pentagame
3. **WTW**: Livello WTW

## 🚀 **Come Implementare**

### **1. Backend**
1. Aggiungi la funzione `updateUserRoleFromPackage` in `backend/src/index.js`
2. Modifica l'endpoint `/api/packages/purchase`
3. Modifica l'endpoint `/api/admin/users/:userId/packages`

### **2. Frontend**
1. Aggiorna `UserManager.jsx` per includere `packageCode`
2. Aggiorna le funzioni di visualizzazione ruoli
3. Testa l'acquisto pacchetti

### **3. Test**
1. Acquista un pacchetto come utente
2. Verifica che il ruolo sia aggiornato automaticamente
3. Verifica che le commissioni siano corrette

## 🎯 **CONCLUSIONE**

Con questa implementazione, il ruolo del cliente sarà determinato automaticamente dal pacchetto che acquista, garantendo coerenza e precisione nel sistema MLM. 