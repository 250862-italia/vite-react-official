# 🔒 PROTEZIONE GUEST IMPLEMENTATA

## 🎯 **Obiettivo**
Impedire ai guest non approvati dall'admin di accedere alla dashboard e alle funzionalità riservate agli ambassador.

## ✅ **Protezioni Implementate**

### 1. **Frontend - GuestDashboard.jsx**
```javascript
// 🔒 PROTEZIONE: Se l'admin ha approvato il guest, redirect alla dashboard
if (kycData.adminApproved && kycData.state === 'approved') {
  console.log('🔓 Guest approvato dall\'admin, redirect alla dashboard');
  navigate('/dashboard');
  return;
}
```

### 2. **Frontend - Dashboard.jsx**
```javascript
// 🔒 PROTEZIONE: Se è un guest, verifica se è stato approvato dall'admin
if (userData.role === 'guest') {
  checkGuestApproval();
  return;
}

const checkGuestApproval = async () => {
  // Se il guest non è stato approvato dall'admin, redirect al guest dashboard
  if (!kycData.adminApproved || kycData.state !== 'approved') {
    console.log('🔒 Guest non approvato dall\'admin, redirect al guest dashboard');
    navigate('/guest-dashboard');
    return;
  }
  
  // Se è stato approvato, aggiorna il ruolo e continua
  console.log('🔓 Guest approvato, aggiornamento ruolo...');
  const updatedUser = { ...userData, role: 'ambassador' };
  setUser(updatedUser);
  localStorage.setItem('user', JSON.stringify(updatedUser));
  loadDashboardData(updatedUser.id);
};
```

### 3. **Backend - Funzione di Protezione**
```javascript
// Funzione per verificare se un guest è stato approvato dall'admin
function requireGuestApproval(req, res, next) {
  const user = req.user;
  
  if (user.role === 'guest') {
    // Verifica se il guest è stato approvato dall'admin
    if (!user.adminApproved || user.state !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Il tuo account è in attesa di approvazione da parte dell\'amministratore.'
      });
    }
  }
  
  next();
}
```

### 4. **Backend - API Protette**
Le seguenti API ora richiedono l'approvazione dell'admin per i guest:

- **`GET /api/dashboard`**: Dashboard principale
- **`GET /api/commissions`**: Commissioni ambassador

## 🔄 **Flusso di Protezione**

### **Guest Non Approvato:**
1. **Login** → Guest accede con successo
2. **Redirect** → Viene reindirizzato a `/guest-dashboard`
3. **KYC/Contract** → Deve completare KYC e firmare contratto
4. **Admin Review** → Admin deve approvare nel pannello admin
5. **Accesso Negato** → Non può accedere a `/dashboard` o API protette

### **Guest Approvato:**
1. **Login** → Guest accede con successo
2. **Verifica** → Sistema verifica `adminApproved: true` e `state: 'approved'`
3. **Aggiornamento Ruolo** → Ruolo cambia da `guest` a `ambassador`
4. **Accesso Concesso** → Può accedere a dashboard e tutte le funzionalità

## 🛡️ **Livelli di Protezione**

### **Livello 1 - Frontend Routing**
- **GuestDashboard.jsx**: Redirect automatico se approvato
- **Dashboard.jsx**: Blocco accesso se non approvato

### **Livello 2 - Backend API**
- **Middleware**: `requireGuestApproval` su tutte le API sensibili
- **Response**: 403 Forbidden per guest non approvati

### **Livello 3 - Database**
- **User State**: `adminApproved: false` per guest non approvati
- **User State**: `state: 'pending_approval'` o `'pending_admin_approval'`

## 📊 **Stati Utente**

| Stato | adminApproved | state | Può Accedere Dashboard |
|-------|---------------|-------|------------------------|
| Guest Registrato | `false` | `pending_approval` | ❌ NO |
| Guest KYC Completato | `false` | `pending_admin_approval` | ❌ NO |
| Guest Approvato | `true` | `approved` | ✅ SÌ |
| Ambassador | `true` | `approved` | ✅ SÌ |

## 🔧 **Test delle Protezioni**

### **Test Guest Non Approvato:**
```bash
# 1. Registra guest
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testguest",
    "password":"password123",
    "sponsorCode":"PIPA306670-QYZ7-@-I"
  }'

# 2. Login guest
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testguest","password":"password123"}'

# 3. Prova accesso dashboard (dovrebbe fallire)
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

### **Test Guest Approvato:**
```bash
# 1. Admin approva guest (via pannello admin)
# 2. Guest login
# 3. Prova accesso dashboard (dovrebbe funzionare)
```

## 🎯 **Risultato**

✅ **Guest non approvati NON possono:**
- Accedere alla dashboard principale
- Visualizzare commissioni
- Utilizzare funzionalità ambassador

✅ **Guest approvati dall'admin:**
- Vengono automaticamente promossi ad ambassador
- Possono accedere a tutte le funzionalità
- Il ruolo viene aggiornato in tempo reale

🔒 **Sicurezza garantita a livello frontend e backend!** 