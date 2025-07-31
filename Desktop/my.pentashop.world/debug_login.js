#!/usr/bin/env node

/**
 * 🔍 DEBUG LOGIN - Debug del problema login
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function debugLogin() {
  try {
    console.log('🔍 DEBUGGING LOGIN ISSUE...');
    
    // Carica utenti
    const usersPath = path.join(__dirname, 'backend', 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    console.log(`📊 Trovati ${users.length} utenti`);
    
    // Trova admin
    const admin = users.find(u => u.username === 'admin');
    if (!admin) {
      console.log('❌ Admin user non trovato');
      return;
    }
    
    console.log('👑 Admin user trovato:');
    console.log('  Username:', admin.username);
    console.log('  Role:', admin.role);
    console.log('  Password hash:', admin.password.substring(0, 20) + '...');
    console.log('  Is active:', admin.isActive);
    
    // Test bcrypt.compare
    console.log('\n🧪 Test bcrypt.compare...');
    const testPassword = 'admin123';
    
    try {
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('✅ bcrypt.compare result:', isValid);
      
      if (isValid) {
        console.log('✅ Password corretta!');
      } else {
        console.log('❌ Password sbagliata!');
      }
    } catch (error) {
      console.error('❌ bcrypt.compare error:', error);
    }
    
    // Test con password sbagliata
    console.log('\n🧪 Test con password sbagliata...');
    try {
      const isValid = await bcrypt.compare('wrongpassword', admin.password);
      console.log('✅ bcrypt.compare con password sbagliata:', isValid);
    } catch (error) {
      console.error('❌ bcrypt.compare error:', error);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin(); 