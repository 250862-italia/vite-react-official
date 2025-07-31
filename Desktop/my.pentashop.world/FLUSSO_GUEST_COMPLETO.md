# 🔄 Flusso Completo GUEST - MY.PENTASHOP.WORLD

## 📋 Situazione Attuale

### ✅ **Implementato:**
- ✅ **Registrazione GUEST**: Nuovi utenti registrati come `guest`
- ✅ **Validazione Referral**: Codice sponsor obbligatorio
- ✅ **Sistema Base**: Accesso limitato iniziale

### 🔄 **Da Implementare:**
- 🔄 **KYC**: Compilazione documenti
- 🔄 **Contratto Digitale**: Firma contrattuale
- 🔄 **Admin Pending**: Gestione autorizzazioni admin
- 🔄 **Acquisto Pacchetti**: Promozione con commissioni

## 🎯 Flusso Target Completo

### **Fase 1: Registrazione GUEST**
```
1. Utente si registra con codice referral
2. Ruolo: guest (accesso limitato)
3. Stato: pending_approval
4. KYC: not_submitted
5. Contratto: not_signed
```

### **Fase 2: Onboarding GUEST**
```
1. Compilazione KYC (documenti personali)
2. Firma contratto digitale
3. Stato: pending_admin_approval
4. Admin riceve notifica
```

### **Fase 3: Autorizzazione Admin**
```
1. Admin verifica KYC e contratto
2. Admin autorizza utente
3. Stato: approved
4. Utente può acquistare pacchetti
```

### **Fase 4: Acquisto Pacchetto**
```
1. Utente acquista pacchetto
2. Ruolo aggiornato: ambassador
3. Commissioni attivate secondo pacchetto
4. Accesso completo attivato
```

## 🛠️ Modifiche Necessarie

### **1. Backend - Nuovi Stati**
```javascript
// Stati utente
const USER_STATES = {
  PENDING_APPROVAL: 'pending_approval',
  PENDING_ADMIN_APPROVAL: 'pending_admin_approval', 
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

// Stati KYC
const KYC_STATES = {
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

// Stati Contratto
const CONTRACT_STATES = {
  NOT_SIGNED: 'not_signed',
  SIGNED: 'signed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}
```

### **2. Nuovi Endpoint**
```javascript
// KYC
POST /api/kyc/submit
GET /api/kyc/status
PUT /api/admin/kyc/approve/:userId

// Contratto
POST /api/contract/sign
GET /api/contract/status
PUT /api/admin/contract/approve/:userId

// Admin
GET /api/admin/pending-users
PUT /api/admin/approve-user/:userId
PUT /api/admin/reject-user/:userId
```

### **3. Frontend - Nuove Pagine**
```
/kyc - Compilazione KYC
/contract - Firma contratto
/admin/pending - Gestione utenti in attesa
```

## 📊 Database Schema Aggiornato

### **Utente Guest:**
```json
{
  "id": 20,
  "username": "nuovoguest",
  "role": "guest",
  "state": "pending_approval",
  "kycStatus": "not_submitted",
  "contractStatus": "not_signed",
  "adminApproved": false,
  "canPurchasePackages": false,
  "sponsorId": 2,
  "sponsorCode": "PIPA306670-QYZ7-@-I"
}
```

### **KYC Submission:**
```json
{
  "userId": 20,
  "status": "submitted",
  "documents": {
    "identity": "base64_document",
    "address": "base64_document",
    "fiscal": "base64_document"
  },
  "personalInfo": {
    "fullName": "Nome Cognome",
    "birthDate": "1990-01-01",
    "nationality": "Italiana",
    "address": "Via Roma 1, Milano"
  },
  "submittedAt": "2025-07-31T14:00:00Z",
  "approvedAt": null,
  "approvedBy": null
}
```

### **Contract:**
```json
{
  "userId": 20,
  "status": "signed",
  "contractType": "ambassador_agreement",
  "signedAt": "2025-07-31T14:00:00Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "approvedAt": null,
  "approvedBy": null
}
```

## 🎯 Prossimi Passi

### **1. Implementare KYC System**
- Form compilazione documenti
- Upload documenti
- Validazione lato server
- Stato pending per admin

### **2. Implementare Contract System**
- Contratto digitale
- Firma elettronica
- Stato pending per admin
- Template contrattuale

### **3. Implementare Admin Panel**
- Lista utenti pending
- Approvazione/rifiuto KYC
- Approvazione/rifiuto contratto
- Promozione ad ambassador

### **4. Aggiornare Purchase System**
- Verifica stato approvazione
- Blocco acquisti per guest non approvati
- Promozione automatica post-approvazione

## ✅ Risultato Finale

**Flusso Completo:**
1. **Registrazione** → GUEST (pending)
2. **KYC + Contratto** → Pending Admin
3. **Approvazione Admin** → Approved
4. **Acquisto Pacchetto** → AMBASSADOR con commissioni

**Sicurezza:**
- ✅ Controllo completo admin
- ✅ Verifica documenti
- ✅ Contratto legale
- ✅ Commissioni solo post-approvazione 