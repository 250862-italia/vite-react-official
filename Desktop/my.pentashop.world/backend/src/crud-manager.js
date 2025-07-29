const fs = require('fs');
const path = require('path');

// Configurazione percorsi file
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const COMMISSION_PLANS_FILE = path.join(DATA_DIR, 'commission-plans.json');
const KYC_FILE = path.join(DATA_DIR, 'kyc.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');

// Assicura che la directory data esista
function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Funzioni generiche per CRUD
class CRUDManager {
  constructor() {
    ensureDataDirectory();
  }

  // Funzione generica per leggere dati da file
  readFromFile(filePath, defaultValue = []) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Errore lettura file ${filePath}:`, error);
    }
    return defaultValue;
  }

  // Funzione generica per scrivere dati su file
  writeToFile(filePath, data) {
    try {
      ensureDataDirectory();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Errore scrittura file ${filePath}:`, error);
      return false;
    }
  }

  // Funzione generica per generare ID univoco
  generateId(collection) {
    if (!collection || collection.length === 0) {
      return 1;
    }
    return Math.max(...collection.map(item => item.id || 0)) + 1;
  }

  // Funzione generica per trovare elemento per ID
  findById(collection, id) {
    return collection.find(item => item.id === id);
  }

  // Funzione generica per trovare indice elemento per ID
  findIndexById(collection, id) {
    return collection.findIndex(item => item.id === id);
  }

  // Funzione generica per validare dati obbligatori
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Campi obbligatori mancanti: ${missingFields.join(', ')}`
      };
    }
    return { valid: true };
  }
}

// Gestore specifico per Users
class UsersCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = USERS_FILE;
  }

  // CREATE - Crea nuovo utente
  create(userData) {
    const users = this.readFromFile(this.filePath);
    
    // Validazione campi obbligatori
    const requiredFields = ['username', 'email', 'firstName', 'lastName', 'password'];
    const validation = this.validateRequiredFields(userData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Verifica username univoco
    if (users.find(u => u.username === userData.username)) {
      return { success: false, error: 'Username già esistente' };
    }

    // Verifica email univoca
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email già esistente' };
    }

    const newUser = {
      id: this.generateId(users),
      ...userData,
      level: userData.level || 1,
      experience: userData.experience || 0,
      experienceToNextLevel: userData.experienceToNextLevel || 100,
      onboardingLevel: userData.onboardingLevel || 1,
      points: userData.points || 0,
      tokens: userData.tokens || 0,
      role: userData.role || 'entry_ambassador',
      commissionRate: userData.commissionRate || 0.05,
      totalSales: userData.totalSales || 0,
      totalCommissions: userData.totalCommissions || 0,
      wallet: userData.wallet || {
        balance: 0,
        transactions: []
      },
      badges: userData.badges || [],
      completedTasks: userData.completedTasks || [],
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isOnboardingComplete: userData.isOnboardingComplete || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    
    if (this.writeToFile(this.filePath, users)) {
      return { success: true, data: newUser };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutti gli utenti
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge utente per ID
  readById(id) {
    const users = this.readFromFile(this.filePath);
    const user = this.findById(users, id);
    return user ? { success: true, data: user } : { success: false, error: 'Utente non trovato' };
  }

  // READ - Legge utente per username
  readByUsername(username) {
    const users = this.readFromFile(this.filePath);
    const user = users.find(u => u.username === username);
    return user ? { success: true, data: user } : { success: false, error: 'Utente non trovato' };
  }

  // UPDATE - Aggiorna utente
  update(id, updateData) {
    const users = this.readFromFile(this.filePath);
    const userIndex = this.findIndexById(users, id);
    
    if (userIndex === -1) {
      return { success: false, error: 'Utente non trovato' };
    }

    // Verifica username univoco se modificato
    if (updateData.username && users.find(u => u.username === updateData.username && u.id !== id)) {
      return { success: false, error: 'Username già esistente' };
    }

    // Verifica email univoca se modificata
    if (updateData.email && users.find(u => u.email === updateData.email && u.id !== id)) {
      return { success: false, error: 'Email già esistente' };
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, users)) {
      return { success: true, data: users[userIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina utente
  delete(id) {
    const users = this.readFromFile(this.filePath);
    const userIndex = this.findIndexById(users, id);
    
    if (userIndex === -1) {
      return { success: false, error: 'Utente non trovato' };
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, users)) {
      return { success: true, data: deletedUser };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // Metodi specifici per utenti
  completeTask(userId, taskId) {
    const users = this.readFromFile(this.filePath);
    const userIndex = this.findIndexById(users, userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Utente non trovato' };
    }

    // Assicurati che completedTasks sia un array
    if (!users[userIndex].completedTasks || !Array.isArray(users[userIndex].completedTasks)) {
      users[userIndex].completedTasks = [];
    }
    
    if (!users[userIndex].completedTasks.includes(taskId)) {
      users[userIndex].completedTasks.push(taskId);
      users[userIndex].updatedAt = new Date().toISOString();
      
      if (this.writeToFile(this.filePath, users)) {
        return { success: true, data: users[userIndex] };
      }
    }

    return { success: true, data: users[userIndex] };
  }

  updateWallet(userId, transaction) {
    const users = this.readFromFile(this.filePath);
    const userIndex = this.findIndexById(users, userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Utente non trovato' };
    }

    if (!users[userIndex].wallet) {
      users[userIndex].wallet = { balance: 0, transactions: [] };
    }

    // Aggiungi transazione
    const newTransaction = {
      id: this.generateId(users[userIndex].wallet.transactions),
      ...transaction,
      date: new Date().toISOString()
    };

    users[userIndex].wallet.transactions.push(newTransaction);
    users[userIndex].wallet.balance += transaction.amount;
    users[userIndex].updatedAt = new Date().toISOString();

    if (this.writeToFile(this.filePath, users)) {
      return { success: true, data: users[userIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per Tasks
class TasksCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = TASKS_FILE;
  }

  // CREATE - Crea nuovo task
  create(taskData) {
    const tasks = this.readFromFile(this.filePath);
    
    const requiredFields = ['title', 'description', 'type'];
    const validation = this.validateRequiredFields(taskData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newTask = {
      id: this.generateId(tasks),
      ...taskData,
      level: taskData.level || 1,
      rewards: taskData.rewards || {
        points: 10,
        tokens: 5,
        experience: 15
      },
      content: taskData.content || {
        videoUrl: '',
        quizQuestions: [],
        documentContent: '',
        surveyQuestions: []
      },
      isActive: taskData.isActive !== undefined ? taskData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);
    
    if (this.writeToFile(this.filePath, tasks)) {
      return { success: true, data: newTask };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutti i task
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge task per ID
  readById(id) {
    const tasks = this.readFromFile(this.filePath);
    const task = this.findById(tasks, id);
    return task ? { success: true, data: task } : { success: false, error: 'Task non trovato' };
  }

  // UPDATE - Aggiorna task
  update(id, updateData) {
    const tasks = this.readFromFile(this.filePath);
    const taskIndex = this.findIndexById(tasks, id);
    
    if (taskIndex === -1) {
      return { success: false, error: 'Task non trovato' };
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, tasks)) {
      return { success: true, data: tasks[taskIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina task
  delete(id) {
    const tasks = this.readFromFile(this.filePath);
    const taskIndex = this.findIndexById(tasks, id);
    
    if (taskIndex === -1) {
      return { success: false, error: 'Task non trovato' };
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, tasks)) {
      return { success: true, data: deletedTask };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per Commission Plans
class CommissionPlansCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = COMMISSION_PLANS_FILE;
  }

  // CREATE - Crea nuovo piano commissioni
  create(planData) {
    const plans = this.readFromFile(this.filePath);
    
    const requiredFields = ['name', 'code'];
    const validation = this.validateRequiredFields(planData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Verifica codice univoco
    if (plans.find(p => p.code === planData.code)) {
      return { success: false, error: 'Codice piano già esistente' };
    }

    const newPlan = {
      id: this.generateId(plans),
      ...planData,
      directSale: parseFloat(planData.directSale) || 0,
      level1: parseFloat(planData.level1) || 0,
      level2: parseFloat(planData.level2) || 0,
      level3: parseFloat(planData.level3) || 0,
      level4: parseFloat(planData.level4) || 0,
      level5: parseFloat(planData.level5) || 0,
      minPoints: parseInt(planData.minPoints) || 0,
      minTasks: parseInt(planData.minTasks) || 0,
      minSales: parseInt(planData.minSales) || 0,
      cost: parseFloat(planData.cost) || 0,
      isActive: planData.isActive !== undefined ? planData.isActive : true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    plans.push(newPlan);
    
    if (this.writeToFile(this.filePath, plans)) {
      return { success: true, data: newPlan };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutti i piani
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge piano per ID
  readById(id) {
    const plans = this.readFromFile(this.filePath);
    const plan = this.findById(plans, id);
    return plan ? { success: true, data: plan } : { success: false, error: 'Piano non trovato' };
  }

  // UPDATE - Aggiorna piano
  update(id, updateData) {
    const plans = this.readFromFile(this.filePath);
    const planIndex = this.findIndexById(plans, id);
    
    if (planIndex === -1) {
      return { success: false, error: 'Piano non trovato' };
    }

    // Verifica codice univoco se modificato
    if (updateData.code && plans.find(p => p.code === updateData.code && p.id !== id)) {
      return { success: false, error: 'Codice piano già esistente' };
    }

    plans[planIndex] = {
      ...plans[planIndex],
      ...updateData,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (this.writeToFile(this.filePath, plans)) {
      return { success: true, data: plans[planIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina piano
  delete(id) {
    const plans = this.readFromFile(this.filePath);
    const planIndex = this.findIndexById(plans, id);
    
    if (planIndex === -1) {
      return { success: false, error: 'Piano non trovato' };
    }

    const deletedPlan = plans.splice(planIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, plans)) {
      return { success: true, data: deletedPlan };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per KYC
class KYCCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = KYC_FILE;
  }

  // CREATE - Crea nuova richiesta KYC
  create(kycData) {
    const kycRequests = this.readFromFile(this.filePath);
    
    const requiredFields = ['userId', 'firstName', 'lastName', 'email'];
    const validation = this.validateRequiredFields(kycData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newKYC = {
      id: this.generateId(kycRequests),
      ...kycData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    kycRequests.push(newKYC);
    
    if (this.writeToFile(this.filePath, kycRequests)) {
      return { success: true, data: newKYC };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutte le richieste KYC
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge KYC per ID
  readById(id) {
    const kycRequests = this.readFromFile(this.filePath);
    const kyc = this.findById(kycRequests, id);
    return kyc ? { success: true, data: kyc } : { success: false, error: 'KYC non trovato' };
  }

  // READ - Legge KYC per userId
  readByUserId(userId) {
    const kycRequests = this.readFromFile(this.filePath);
    const kyc = kycRequests.find(k => k.userId === userId);
    return kyc ? { success: true, data: kyc } : { success: false, error: 'KYC non trovato' };
  }

  // UPDATE - Aggiorna KYC
  update(id, updateData) {
    const kycRequests = this.readFromFile(this.filePath);
    const kycIndex = this.findIndexById(kycRequests, id);
    
    if (kycIndex === -1) {
      return { success: false, error: 'KYC non trovato' };
    }

    kycRequests[kycIndex] = {
      ...kycRequests[kycIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, kycRequests)) {
      return { success: true, data: kycRequests[kycIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina KYC
  delete(id) {
    const kycRequests = this.readFromFile(this.filePath);
    const kycIndex = this.findIndexById(kycRequests, id);
    
    if (kycIndex === -1) {
      return { success: false, error: 'KYC non trovato' };
    }

    const deletedKYC = kycRequests.splice(kycIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, kycRequests)) {
      return { success: true, data: deletedKYC };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per Sales
class SalesCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = SALES_FILE;
  }

  // CREATE - Crea nuova vendita
  create(saleData) {
    const sales = this.readFromFile(this.filePath);
    
    const requiredFields = ['userId', 'amount', 'products'];
    const validation = this.validateRequiredFields(saleData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newSale = {
      id: this.generateId(sales),
      ...saleData,
      status: saleData.status || 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sales.push(newSale);
    
    if (this.writeToFile(this.filePath, sales)) {
      return { success: true, data: newSale };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutte le vendite
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge vendite per userId
  readByUserId(userId) {
    const sales = this.readFromFile(this.filePath);
    return sales.filter(sale => sale.userId === userId);
  }

  // READ - Legge vendita per ID
  readById(id) {
    const sales = this.readFromFile(this.filePath);
    const sale = this.findById(sales, id);
    return sale ? { success: true, data: sale } : { success: false, error: 'Vendita non trovata' };
  }

  // UPDATE - Aggiorna vendita
  update(id, updateData) {
    const sales = this.readFromFile(this.filePath);
    const saleIndex = this.findIndexById(sales, id);
    
    if (saleIndex === -1) {
      return { success: false, error: 'Vendita non trovata' };
    }

    sales[saleIndex] = {
      ...sales[saleIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, sales)) {
      return { success: true, data: sales[saleIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina vendita
  delete(id) {
    const sales = this.readFromFile(this.filePath);
    const saleIndex = this.findIndexById(sales, id);
    
    if (saleIndex === -1) {
      return { success: false, error: 'Vendita non trovata' };
    }

    const deletedSale = sales.splice(saleIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, sales)) {
      return { success: true, data: deletedSale };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per Commissions
class CommissionsCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = COMMISSIONS_FILE;
  }

  // CREATE - Crea nuova commissione
  create(commissionData) {
    const commissions = this.readFromFile(this.filePath);
    
    const requiredFields = ['userId', 'amount', 'type'];
    const validation = this.validateRequiredFields(commissionData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newCommission = {
      id: this.generateId(commissions),
      ...commissionData,
      status: commissionData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    commissions.push(newCommission);
    
    if (this.writeToFile(this.filePath, commissions)) {
      return { success: true, data: newCommission };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutte le commissioni
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge commissioni per userId
  readByUserId(userId) {
    const commissions = this.readFromFile(this.filePath);
    return commissions.filter(commission => commission.userId === userId);
  }

  // READ - Legge commissione per ID
  readById(id) {
    const commissions = this.readFromFile(this.filePath);
    const commission = this.findById(commissions, id);
    return commission ? { success: true, data: commission } : { success: false, error: 'Commissione non trovata' };
  }

  // UPDATE - Aggiorna commissione
  update(id, updateData) {
    const commissions = this.readFromFile(this.filePath);
    const commissionIndex = this.findIndexById(commissions, id);
    
    if (commissionIndex === -1) {
      return { success: false, error: 'Commissione non trovata' };
    }

    commissions[commissionIndex] = {
      ...commissions[commissionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, commissions)) {
      return { success: true, data: commissions[commissionIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina commissione
  delete(id) {
    const commissions = this.readFromFile(this.filePath);
    const commissionIndex = this.findIndexById(commissions, id);
    
    if (commissionIndex === -1) {
      return { success: false, error: 'Commissione non trovata' };
    }

    const deletedCommission = commissions.splice(commissionIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, commissions)) {
      return { success: true, data: deletedCommission };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Gestore specifico per Referrals
class ReferralsCRUD extends CRUDManager {
  constructor() {
    super();
    this.filePath = REFERRALS_FILE;
  }

  // CREATE - Crea nuovo referral
  create(referralData) {
    const referrals = this.readFromFile(this.filePath);
    
    const requiredFields = ['referrerId', 'referredId'];
    const validation = this.validateRequiredFields(referralData, requiredFields);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Verifica che non esista già questo referral
    if (referrals.find(r => r.referrerId === referralData.referrerId && r.referredId === referralData.referredId)) {
      return { success: false, error: 'Referral già esistente' };
    }

    const newReferral = {
      id: this.generateId(referrals),
      ...referralData,
      status: referralData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    referrals.push(newReferral);
    
    if (this.writeToFile(this.filePath, referrals)) {
      return { success: true, data: newReferral };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // READ - Legge tutti i referral
  readAll() {
    return this.readFromFile(this.filePath);
  }

  // READ - Legge referral per ID
  readById(id) {
    const referrals = this.readFromFile(this.filePath);
    const referral = this.findById(referrals, id);
    return referral ? { success: true, data: referral } : { success: false, error: 'Referral non trovato' };
  }

  // READ - Legge referral per referrerId
  readByReferrerId(referrerId) {
    const referrals = this.readFromFile(this.filePath);
    return referrals.filter(referral => referral.referrerId === referrerId);
  }

  // READ - Legge referral per referredId
  readByReferredId(referredId) {
    const referrals = this.readFromFile(this.filePath);
    return referrals.filter(referral => referral.referredId === referredId);
  }

  // UPDATE - Aggiorna referral
  update(id, updateData) {
    const referrals = this.readFromFile(this.filePath);
    const referralIndex = this.findIndexById(referrals, id);
    
    if (referralIndex === -1) {
      return { success: false, error: 'Referral non trovato' };
    }

    referrals[referralIndex] = {
      ...referrals[referralIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeToFile(this.filePath, referrals)) {
      return { success: true, data: referrals[referralIndex] };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }

  // DELETE - Elimina referral
  delete(id) {
    const referrals = this.readFromFile(this.filePath);
    const referralIndex = this.findIndexById(referrals, id);
    
    if (referralIndex === -1) {
      return { success: false, error: 'Referral non trovato' };
    }

    const deletedReferral = referrals.splice(referralIndex, 1)[0];
    
    if (this.writeToFile(this.filePath, referrals)) {
      return { success: true, data: deletedReferral };
    } else {
      return { success: false, error: 'Errore nel salvataggio' };
    }
  }
}

// Esporta le classi CRUD
module.exports = {
  UsersCRUD,
  TasksCRUD,
  CommissionPlansCRUD,
  KYCCRUD,
  SalesCRUD,
  CommissionsCRUD,
  ReferralsCRUD
}; 