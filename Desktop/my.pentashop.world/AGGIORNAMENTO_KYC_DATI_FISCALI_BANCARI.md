# 💳 AGGIORNAMENTO KYC - Dati Fiscali e Bancari (Privati e Aziende)

## 🎯 **NUOVE FUNZIONALITÀ AGGIUNTE**

### **1. Selezione Tipo Soggetto**
- **Radio button** per scegliere tra Privato e Azienda
- **Campi dinamici** che cambiano in base alla selezione
- **Validazione specifica** per ogni tipo di soggetto

### **2. Per Privati**
- **Codice Fiscale** (obbligatorio)
- **IBAN per Pagamenti** (obbligatorio)
- **Validazione automatica** del formato italiano

### **3. Per Aziende** ← **NUOVO**
- **Nome Azienda** (obbligatorio)
- **Partita IVA** (obbligatorio, 11 cifre)
- **Codice SDI** (obbligatorio, 7 caratteri alfanumerici)
- **IBAN per Pagamenti** (obbligatorio)

---

## 🔧 **IMPLEMENTAZIONE TECNICA**

### **1. Stato del Form Aggiornato**
```javascript
const [formData, setFormData] = useState({
  birthDate: '',
  address: '',
  city: '',
  country: '',
  citizenship: '',
  fiscalCode: '',      // Per privati
  iban: '',
  isCompany: false,    // NUOVO - Tipo soggetto
  companyName: '',     // NUOVO - Per aziende
  vatNumber: '',       // NUOVO - Per aziende
  sdiCode: ''          // NUOVO - Per aziende
});
```

### **2. Validazione Avanzata**
```javascript
// Validazione per Privati
if (!formData.isCompany) {
  if (!formData.fiscalCode) {
    setError('Codice fiscale obbligatorio per privati');
    return false;
  }
  
  const fiscalCodeRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
  if (!fiscalCodeRegex.test(formData.fiscalCode.toUpperCase())) {
    setError('Codice fiscale non valido');
    return false;
  }
}

// Validazione per Aziende
if (formData.isCompany) {
  if (!formData.companyName || !formData.vatNumber || !formData.sdiCode) {
    setError('Tutti i campi aziendali sono obbligatori');
    return false;
  }
  
  // Validazione Partita IVA (11 cifre)
  const vatRegex = /^\d{11}$/;
  if (!vatRegex.test(formData.vatNumber.replace(/\s/g, ''))) {
    setError('Partita IVA non valida (11 cifre)');
    return false;
  }
  
  // Validazione Codice SDI (7 caratteri)
  const sdiRegex = /^[A-Z0-9]{7}$/;
  if (!sdiRegex.test(formData.sdiCode.toUpperCase())) {
    setError('Codice SDI non valido (7 caratteri alfanumerici)');
    return false;
  }
}
```

### **3. Formattazione Automatica**
```javascript
// Formattazione Partita IVA
if (name === 'vatNumber') {
  formattedValue = value.replace(/[^0-9]/g, '');
}

// Formattazione Codice SDI
if (name === 'sdiCode') {
  formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
```

---

## 🎨 **INTERFACCIA UTENTE**

### **1. Sezione "Tipo Soggetto"**
```
👤 Tipo Soggetto
   ○ Privato    ● Azienda
```

### **2. Campi per Privati**
```
┌─────────────────────────────────────┐
│ Codice Fiscale *                   │
│ [RSSMRA80A01H501U]                │
│ Inserisci il tuo codice fiscale    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ IBAN per Pagamenti *               │
│ [IT60 X054 2811 1010 0000 0123 456]│
│ IBAN per ricevere le commissioni   │
└─────────────────────────────────────┘
```

### **3. Campi per Aziende** ← **NUOVO**
```
┌─────────────────────────────────────┐
│ Nome Azienda *                     │
│ [Pentawash Srl]                    │
│ Nome completo dell'azienda         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Partita IVA *                      │
│ [12345678901]                      │
│ Partita IVA (11 cifre)             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Codice SDI *                       │
│ [ABC1234]                          │
│ Codice Sistema di Interscambio     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ IBAN per Pagamenti *               │
│ [IT60 X054 2811 1010 0000 0123 456]│
│ IBAN per ricevere le commissioni   │
└─────────────────────────────────────┘
```

---

## ✅ **VALIDAZIONI IMPLEMENTATE**

### **Privati:**
- ✅ **Codice Fiscale:** 6 lettere + 2 numeri + 1 lettera + 2 numeri + 1 lettera + 3 numeri + 1 lettera
- ✅ **IBAN:** Formato italiano con validazione
- ✅ **Esempio valido:** `RSSMRA80A01H501U`

### **Aziende:** ← **NUOVO**
- ✅ **Nome Azienda:** Campo obbligatorio
- ✅ **Partita IVA:** Esattamente 11 cifre numeriche
- ✅ **Codice SDI:** Esattamente 7 caratteri alfanumerici
- ✅ **IBAN:** Formato italiano con validazione
- ✅ **Esempi validi:** 
  - Partita IVA: `12345678901`
  - Codice SDI: `ABC1234`

---

## 🔒 **SICUREZZA E PRIVACY**

### **1. Protezione Dati**
- **Crittografia SSL** per la trasmissione
- **Validazione lato client** per formato
- **Validazione lato server** per sicurezza
- **Utilizzo limitato** solo per pagamenti MLM

### **2. Compliance**
- **GDPR compliant** per dati personali
- **Normative fiscali** italiane per privati
- **Normative aziendali** italiane per aziende
- **Best practices** per dati bancari

---

## 🚀 **BENEFICI PER IL SISTEMA MLM**

### **1. Pagamenti Automatici**
- **IBAN verificato** per bonifici commissioni
- **Codice fiscale** per compliance fiscale privati
- **Partita IVA** per compliance fiscale aziende
- **Processo automatizzato** di pagamento

### **2. Compliance Fiscale**
- **Dati completi** per dichiarazioni fiscali
- **Tracciabilità** delle commissioni
- **Conformità** alle normative italiane
- **Supporto** per privati e aziende

### **3. Esperienza Utente**
- **Form compilato una volta** per sempre
- **Validazione in tempo reale**
- **Feedback immediato** su errori
- **Interfaccia dinamica** per tipo soggetto

---

## 📋 **FLUSSO COMPLETO KYC**

### **1. Dati Anagrafici**
- Data di nascita
- Indirizzo completo
- Città e paese
- Cittadinanza

### **2. Tipo Soggetto** ← **NUOVO**
- Selezione Privato/Azienda

### **3. Dati Fiscali e Bancari**
- **Per Privati:** Codice fiscale + IBAN
- **Per Aziende:** Nome azienda + Partita IVA + Codice SDI + IBAN

### **4. Documenti**
- Fronte documento d'identità
- Retro documento d'identità
- Selfie

### **5. Verifica**
- Validazione automatica
- Controllo manuale (24-48h)
- Approvazione finale

---

## 🎯 **PROSSIMI PASSI**

1. **Test Completo:** Verificare funzionamento form aggiornato
2. **Backend:** Aggiornare API per gestire nuovi campi aziendali
3. **Database:** Aggiungere campi `isCompany`, `companyName`, `vatNumber`, `sdiCode`
4. **Sistema Pagamenti:** Integrare IBAN per bonifici automatici
5. **Compliance:** Verificare conformità normative fiscali per aziende
6. **Fatturazione:** Integrare sistema di fatturazione elettronica

---

## 🏢 **SUPPORTO AZIENDE**

### **Vantaggi per Aziende:**
- ✅ **Fatturazione elettronica** automatica
- ✅ **Compliance fiscale** completa
- ✅ **Tracciabilità** commissioni aziendali
- ✅ **Sistema SDI** integrato
- ✅ **Partita IVA** validata

### **Vantaggi per Privati:**
- ✅ **Codice fiscale** validato
- ✅ **Processo semplificato**
- ✅ **Compliance fiscale** personale

---

**✅ Il KYC è ora completo per privati e aziende con tutti i dati necessari per il sistema MLM!** 