const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateToken, requireOnboarding, updateActivity } = require('../middleware/auth');

// Tutte le routes richiedono autenticazione e onboarding livello 1
router.use(authenticateToken);
router.use(requireOnboarding(1));
router.use(updateActivity);

// Wallet info
router.get('/info', walletController.getWalletInfo);

// Staking
router.post('/stake', walletController.createStake);
router.post('/withdraw-stake', walletController.withdrawStake);

// Transazioni
router.get('/transactions', walletController.getTransactionHistory);

// Referral system
router.get('/referral-code', walletController.generateReferralCode);
router.get('/referral-stats', walletController.getReferralStats);

module.exports = router; 