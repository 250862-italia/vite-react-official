const bcrypt = require('bcrypt');
const fs = require('fs');

async function createTestGuest() {
  try {
    // Leggi il file users.json
    const usersData = fs.readFileSync('./backend/data/users.json', 'utf8');
    const users = JSON.parse(usersData);

    // Crea password hashata
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crea nuovo guest
    const newGuest = {
      "id": 26,
      "username": "testguest",
      "email": "testguest@test.com",
      "password": hashedPassword,
      "firstName": "Test",
      "lastName": "Guest",
      "sponsorId": 2,
      "sponsorCode": "PIPA306670-QYZ7-@-I",
      "role": "guest",
      "level": 1,
      "experience": 0,
      "experienceToNextLevel": 100,
      "onboardingLevel": 1,
      "points": 0,
      "tokens": 0,
      "commissionRate": 0.05,
      "referralCode": "TESTGUEST" + Math.random().toString(36).substr(2, 9),
      "totalSales": 0,
      "totalCommissions": 0,
      "wallet": {
        "balance": 0,
        "transactions": []
      },
      "badges": [],
      "completedTasks": [],
      "purchasedPackages": [],
      "isActive": true,
      "createdAt": new Date().toISOString(),
      "lastLogin": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "hasSeenWelcome": false,
      "subscriptionActive": false,
      "kycStatus": "not_submitted",
      "contractStatus": "not_signed",
      "state": "pending_approval",
      "adminApproved": false,
      "canPurchasePackages": false
    };

    // Aggiungi il nuovo guest
    users.push(newGuest);

    // Salva il file
    fs.writeFileSync('./backend/data/users.json', JSON.stringify(users, null, 2));

    console.log('✅ Nuovo guest creato:');
    console.log('Username: testguest');
    console.log('Password: password123');
    console.log('Email: testguest@test.com');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createTestGuest(); 