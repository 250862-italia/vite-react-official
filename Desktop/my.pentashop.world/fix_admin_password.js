const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function fixAdminPassword() {
  try {
    // Genera hash per "password"
    const password = "password";
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Password hash generato:', hash);
    
    // Carica users.json
    const usersPath = path.join(__dirname, 'backend', 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    // Trova l'admin e aggiorna la password
    const adminIndex = users.findIndex(user => user.username === 'admin');
    if (adminIndex !== -1) {
      users[adminIndex].password = hash;
      console.log('✅ Password admin aggiornata');
    } else {
      console.log('❌ Admin non trovato');
      return;
    }
    
    // Salva il file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('💾 File users.json aggiornato');
    
    console.log('🎉 Credenziali admin corrette:');
    console.log('Username: admin');
    console.log('Password: password');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

fixAdminPassword(); 