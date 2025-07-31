const fs = require('fs');
const path = require('path');

// Funzioni helper dal backend
function loadUsersFromFile() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'backend/data/users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento utenti:', error);
    return [];
  }
}

function loadSales() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'backend/data/sales.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento vendite:', error);
    return [];
  }
}

function saveSales(salesData) {
  try {
    fs.writeFileSync(path.join(__dirname, 'backend/data/sales.json'), JSON.stringify(salesData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio vendite:', error);
    return false;
  }
}

function loadCommissionsFromFile() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'backend/data/commissions.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Errore caricamento commissioni:', error);
    return [];
  }
}

function saveCommissionsToFile(commissions) {
  try {
    fs.writeFileSync(path.join(__dirname, 'backend/data/commissions.json'), JSON.stringify(commissions, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio commissioni:', error);
    return false;
  }
}

function saveUsersToFile(users) {
  try {
    fs.writeFileSync(path.join(__dirname, 'backend/data/users.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio utenti:', error);
    return false;
  }
}

// Funzione per aggiornare il ruolo dell'utente basato sul pacchetto
function updateUserRoleFromPackage(user, packageCode) {
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

  // Aggiorna ruolo
  user.role = roleMapping[packageCode] || 'entry_ambassador';

  // Aggiorna livello
  user.level = levelMapping[packageCode] || 'ENTRY';

  return user;
}

// Funzione per generare commissione automatica per una vendita
function generateCommissionForSale(sale, users) {
  const ambassador = users.find(u => u.id === sale.ambassadorId || sale.userId);
  if (!ambassador) {
    console.log(`❌ Ambassador non trovato per vendita ${sale.id || sale.saleId}`);
    return null;
  }

  const commissionRate = ambassador.commissionRate || 0.1;
  const commissionAmount = (sale.amount || sale.totalAmount || 0) * commissionRate;

  return {
    id: Date.now() + Math.random(),
    userId: ambassador.id,
    ambassadorName: ambassador.username,
    type: 'direct_sale',
    amount: sale.amount || sale.totalAmount || 0,
    commissionRate: commissionRate,
    commissionAmount: commissionAmount,
    saleId: sale.id || sale.saleId,
    saleDate: sale.date || sale.createdAt || new Date().toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: `Commissione per vendita ${sale.id || sale.saleId} - Cliente ${sale.customerName || 'Cliente'}`
  };
}

// Funzione principale per coordinare vendite e commissioni
function coordinateSalesAndCommissions() {
  console.log('🔧 COORDINAZIONE VENDITE E COMMISSIONI');
  console.log('========================================\n');

  // 1. Carica dati
  console.log('1️⃣ Caricamento dati...');
  const users = loadUsersFromFile();
  const sales = loadSales();
  const commissions = loadCommissionsFromFile();
  
  console.log(`✅ Utenti caricati: ${users.length}`);
  console.log(`✅ Vendite caricate: ${sales.length}`);
  console.log(`✅ Commissioni caricate: ${commissions.length}`);

  // 2. Analizza vendite senza commissioni
  console.log('\n2️⃣ Analisi vendite senza commissioni...');
  const salesWithoutCommissions = sales.filter(sale => {
    const hasCommission = commissions.some(commission => 
      commission.saleId === (sale.id || sale.saleId)
    );
    return !hasCommission;
  });

  console.log(`📊 Vendite senza commissioni: ${salesWithoutCommissions.length}`);

  // 3. Genera commissioni mancanti
  console.log('\n3️⃣ Generazione commissioni mancanti...');
  const newCommissions = [];
  const updatedUsers = [...users];

  salesWithoutCommissions.forEach(sale => {
    const commission = generateCommissionForSale(sale, users);
    if (commission) {
      newCommissions.push(commission);
      console.log(`✅ Commissione generata per ${commission.ambassadorName}: €${commission.commissionAmount}`);

      // Aggiorna totalCommissions dell'ambassador
      const ambassadorIndex = updatedUsers.findIndex(u => u.id === commission.userId);
      if (ambassadorIndex !== -1) {
        updatedUsers[ambassadorIndex].totalCommissions = 
          (updatedUsers[ambassadorIndex].totalCommissions || 0) + commission.commissionAmount;
        console.log(`✅ Aggiornato totalCommissions per ${commission.ambassadorName}: €${updatedUsers[ambassadorIndex].totalCommissions}`);
      }
    }
  });

  // 4. Salva le modifiche
  console.log('\n4️⃣ Salvataggio modifiche...');
  
  if (newCommissions.length > 0) {
    const allCommissions = [...commissions, ...newCommissions];
    if (saveCommissionsToFile(allCommissions)) {
      console.log(`✅ ${newCommissions.length} commissioni salvate`);
    } else {
      console.log('❌ Errore salvataggio commissioni');
    }
  }

  if (updatedUsers.length > 0) {
    if (saveUsersToFile(updatedUsers)) {
      console.log('✅ Utenti aggiornati');
    } else {
      console.log('❌ Errore salvataggio utenti');
    }
  }

  // 5. Verifica coordinazione
  console.log('\n5️⃣ Verifica coordinazione...');
  const finalSales = loadSales();
  const finalCommissions = loadCommissionsFromFile();
  
  const salesWithCommissions = finalSales.filter(sale => {
    return finalCommissions.some(commission => 
      commission.saleId === (sale.id || sale.saleId)
    );
  });

  console.log(`📊 Vendite totali: ${finalSales.length}`);
  console.log(`💰 Commissioni totali: ${finalCommissions.length}`);
  console.log(`✅ Vendite con commissioni: ${salesWithCommissions.length}`);
  console.log(`❌ Vendite senza commissioni: ${finalSales.length - salesWithCommissions.length}`);

  // 6. Calcola statistiche per i box di progresso
  console.log('\n6️⃣ Calcolo statistiche per box di progresso...');
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlySales = finalSales
    .filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt || 0);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    })
    .reduce((sum, sale) => sum + (sale.amount || sale.totalAmount || 0), 0);

  const totalCommissions = finalCommissions.reduce((sum, commission) => 
    sum + (commission.commissionAmount || 0), 0);

  const pendingCommissions = finalCommissions
    .filter(c => c.status === 'pending')
    .reduce((sum, commission) => sum + (commission.commissionAmount || 0), 0);

  const activeAmbassadors = users.filter(u => 
    u.role === 'ambassador' && u.isActive !== false
  ).length;

  console.log('📊 STATISTICHE AGGIORNATE:');
  console.log(`   - Vendite mese corrente: €${monthlySales}`);
  console.log(`   - Commissioni totali: €${totalCommissions}`);
  console.log(`   - Commissioni in attesa: €${pendingCommissions}`);
  console.log(`   - Ambassador attivi: ${activeAmbassadors}`);

  return {
    monthlySales,
    totalCommissions,
    pendingCommissions,
    activeAmbassadors,
    totalSales: finalSales.length,
    totalCommissionsCount: finalCommissions.length
  };
}

// Esegui la coordinazione
const stats = coordinateSalesAndCommissions();
console.log('\n✅ COORDINAZIONE COMPLETATA!'); 