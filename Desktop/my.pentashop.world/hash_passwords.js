#!/usr/bin/env node

/**
 * 🔥 HASH PASSWORDS - Script per hashare tutte le password esistenti
 * Esegui questo script UNA SOLA VOLTA per convertire le password in chiaro
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function hashAllPasswords() {
  try {
    console.log('🔥 Iniziando hash delle password...');
    
    const usersPath = path.join(__dirname, 'backend', 'data', 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      console.error('❌ File users.json non trovato in:', usersPath);
      return;
    }
    
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    console.log(`📊 Trovati ${users.length} utenti`);
    
    let hashedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Verifica se la password è già hashata
      if (user.password && !user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        console.log(`🔄 Hashando password per ${user.username}...`);
        
        // Hash della password con salt rounds 12
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Aggiorna la password
        users[i].password = hashedPassword;
        hashedCount++;
        
        console.log(`✅ Password hashata per ${user.username}`);
      } else {
        console.log(`⏭️ Password già hashata per ${user.username}, saltando...`);
        skippedCount++;
      }
    }
    
    // Salva il file aggiornato
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    console.log('\n🎉 HASH COMPLETATO!');
    console.log(`✅ Password hashate: ${hashedCount}`);
    console.log(`⏭️ Password saltate: ${skippedCount}`);
    console.log(`📊 Totale utenti: ${users.length}`);
    
    // Verifica che tutto sia corretto
    console.log('\n🔍 Verifica finale...');
    const verifyUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    for (const user of verifyUsers) {
      if (user.password && !user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        console.error(`❌ ERRORE: Password non hashata per ${user.username}`);
        return;
      }
    }
    
    console.log('✅ Tutte le password sono state hashate correttamente!');
    console.log('🚀 Il sistema è ora sicuro per le password!');
    
  } catch (error) {
    console.error('❌ Errore durante l\'hash delle password:', error);
  }
}

// Esegui lo script
hashAllPasswords(); 