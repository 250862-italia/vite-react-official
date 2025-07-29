# 🔧 RISOLUZIONE PROBLEMA LOGIN ADMIN

## 🎯 **Problema Identificato**
L'utente riceve "Credenziali non valide" quando tenta di fare login con admin/admin123.

## ✅ **Verifiche Completate**

### **1. Backend Funziona Correttamente**
- ✅ Server in esecuzione su porta 3000
- ✅ Credenziali admin corrette: `admin` / `admin123`
- ✅ Endpoint `/api/auth/login` funziona
- ✅ Test di login admin riuscito

### **2. Test Completati**
```bash
# Test backend diretto
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Risultato: ✅ SUCCESSO
```

## 🔍 **Possibili Cause del Problema**

### **1. Problema Frontend**
- ❓ Cache del browser
- ❓ Problemi di connessione CORS
- ❓ Errori JavaScript nel frontend

### **2. Problema di Connessione**
- ❓ Frontend non raggiunge backend
- ❓ Porte bloccate
- ❓ Problemi di rete

### **3. Problema di Credenziali**
- ❓ Input sbagliato
- ❓ Spazi extra
- ❓ Maiuscole/minuscole

## 🛠️ **Soluzioni da Provare**

### **Soluzione 1: Test Diretto**
1. Apri `test_browser_login.html` nel browser
2. Usa credenziali: `admin` / `admin123`
3. Verifica se funziona

### **Soluzione 2: Pulizia Cache Browser**
1. Apri DevTools (F12)
2. Tasto destro su "Reload" → "Empty Cache and Hard Reload"
3. Prova di nuovo il login

### **Soluzione 3: Verifica Frontend**
1. Vai su `http://localhost:5173/login`
2. Apri DevTools → Console
3. Prova login e controlla errori

### **Soluzione 4: Test Credenziali Alternative**
Prova queste credenziali di test:
- **Username**: `testuser`
- **Password**: `password`

### **Soluzione 5: Riavvio Completo**
```bash
# 1. Ferma tutti i processi
pkill -f "node"
pkill -f "vite"

# 2. Avvia backend
cd backend && npm run dev

# 3. Avvia frontend
cd frontend && npm run dev

# 4. Testa login
```

## 📋 **Credenziali Corrette**

### **Admin**
- **Username**: `admin`
- **Password**: `admin123`
- **Ruolo**: admin

### **Test User**
- **Username**: `testuser`
- **Password**: `password`
- **Ruolo**: user

### **Ambassador (se registrato)**
- **Username**: `nuovoambassador`
- **Password**: `password123`
- **Ruolo**: ambassador

## 🔧 **Debug Steps**

### **Step 1: Verifica Backend**
```bash
curl http://localhost:3000/health
# Dovrebbe restituire: {"status":"OK",...}
```

### **Step 2: Test Login API**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Dovrebbe restituire success: true
```

### **Step 3: Verifica Frontend**
1. Apri `http://localhost:5173/login`
2. Controlla console per errori
3. Prova login con credenziali esatte

### **Step 4: Test Browser**
1. Apri `test_browser_login.html`
2. Usa credenziali admin
3. Verifica risultato

## 🎯 **Risultato Atteso**

Se tutto funziona correttamente:
- ✅ Login admin riuscito
- ✅ Redirect alla dashboard admin
- ✅ Nessun errore in console
- ✅ Token salvato in localStorage

## 🚨 **Se il Problema Persiste**

### **1. Controlla Console Browser**
- Apri DevTools (F12)
- Vai su Console
- Cerca errori rossi

### **2. Controlla Network Tab**
- Vai su Network
- Prova login
- Controlla richieste HTTP

### **3. Verifica URL**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### **4. Controlla Processi**
```bash
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
```

## 📞 **Supporto**

Se il problema persiste:
1. Controlla errori in console browser
2. Verifica che entrambi i server siano in esecuzione
3. Prova credenziali alternative
4. Usa il test HTML per isolare il problema 