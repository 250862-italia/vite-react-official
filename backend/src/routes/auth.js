const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole, requireOnboarding, updateActivity } = require('../middleware/auth');

// Routes pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protette
router.get('/profile', authenticateToken, updateActivity, authController.getProfile);
router.post('/sign-contract', authenticateToken, updateActivity, authController.signContract);
router.post('/logout', authenticateToken, updateActivity, authController.logout);

// Route per verificare stato blockchain
router.get('/blockchain-status', async (req, res) => {
  try {
    const blockchainService = require('../services/blockchainService');
    const status = await blockchainService.getNetworkStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Errore stato blockchain:', error.message);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

module.exports = router; 