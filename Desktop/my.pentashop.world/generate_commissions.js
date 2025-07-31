const fs = require('fs');
const path = require('path');

// Funzioni helper
function loadSales() {
  try {
    const salesPath = path.join(__dirname, 'backend/data/sales.json');
    const data = fs.readFileSync(salesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento vendite:', error);
    return [];
  }
}

function loadUsers() {
  try {
    const usersPath = path.join(__dirname, 'backend/data/users.json');
    const data = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento utenti:', error);
    return [];
  }
}

function loadCommissions() {
  try {
    const commissionsPath = path.join(__dirname, 'backend/data/commissions.json');
    const data = fs.readFileSync(commissionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento commissioni:', error);
    return [];
  }
}

function saveCommissions(commissions) {
  try {
    const commissionsPath = path.join(__dirname, 'backend/data/commissions.json');
    fs.writeFileSync(commissionsPath, JSON.stringify(commissions, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio commissioni:', error);
    return false;
  }
}

function saveUsers(users) {
  try {
    const usersPath = path.join(__dirname, 'backend/data/users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio utenti:', error);
    return false;
  }
}

// Funzione principale per generare commissioni
function generateCommissionsFromSales() {
  console.log('🔄 Generazione commissioni dalle vendite...');
  
  const sales = loadSales();
  const users = loadUsers();
  const existingCommissions = loadCommissions();
  
  console.log(`📊 Vendite trovate: ${sales.length}`);
  console.log(`👥 Utenti trovati: ${users.length}`);
  console.log(`💰 Commissioni esistenti: ${existingCommissions.length}`);
  
  const newCommissions = [];
  const updatedUsers = [...users];
  
  sales.forEach((sale, index) => {
    // Trova l'ambassador
    const ambassador = users.find(u => u.id === sale.ambassadorId || sale.userId);
    
    if (!ambassador) {
      console.log(`⚠️ Ambassador non trovato per vendita ${sale.saleId || sale.id}`);
      return;
    }
    
    // Calcola commissione
    const commissionAmount = sale.commissionAmount || sale.commission || (sale.totalAmount * (sale.commissionRate || 0.1));
    
    // Crea commissione
    const commission = {
      id: existingCommissions.length + newCommissions.length + 1,
      userId: ambassador.id,
      ambassadorName: ambassador.username,
      type: 'direct_sale',
      amount: sale.totalAmount || sale.amount,
      commissionRate: sale.commissionRate || 0.1,
      commissionAmount: commissionAmount,
      status: sale.status === 'completed' ? 'paid' : 'pending',
      date: sale.createdAt || sale.date || new Date().toISOString(),
      description: `Commissione per vendita ${sale.saleId || sale.id} - ${sale.customerName || 'Cliente'}`,
      level: 0,
      plan: 'manual',
      saleId: sale.saleId || sale.id
    };
    
    newCommissions.push(commission);
    
    // Aggiorna totalCommissions dell'ambassador
    const userIndex = updatedUsers.findIndex(u => u.id === ambassador.id);
    if (userIndex !== -1) {
      updatedUsers[userIndex].totalCommissions = (updatedUsers[userIndex].totalCommissions || 0) + commissionAmount;
    }
    
    console.log(`✅ Commissione generata: €${commissionAmount} per ${ambassador.username}`);
  });
  
  // Salva commissioni
  const allCommissions = [...existingCommissions, ...newCommissions];
  if (saveCommissions(allCommissions)) {
    console.log(`✅ Commissioni salvate: ${allCommissions.length} totali`);
  } else {
    console.log('❌ Errore salvataggio commissioni');
    return;
  }
  
  // Salva utenti aggiornati
  if (saveUsers(updatedUsers)) {
    console.log('✅ Utenti aggiornati con totalCommissions');
  } else {
    console.log('❌ Errore salvataggio utenti');
  }
  
  console.log(`🎉 Generazione completata! ${newCommissions.length} nuove commissioni create.`);
}

// Esegui la generazione
generateCommissionsFromSales(); 