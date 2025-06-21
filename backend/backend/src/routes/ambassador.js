const express = require('express');
const router = express.Router();
const ambassadorController = require('../controllers/ambassadorController');
const { 
  auth, 
  requireAmbassador, 
  requireMLMAmbassador, 
  requireOwnership,
  requireAdmin 
} = require('../middleware/auth');

// Routes per Ambassador - Accesso limitato ai propri dati

// POST /api/ambassador/upgrade - Upgrade a Entry/MLM Ambassador (solo per se stessi)
router.post('/upgrade', auth, requireOwnership('userId'), ambassadorController.upgradeToEntryAmbassador);

// POST /api/ambassador/upgrade-mlm - Upgrade da Entry a MLM Ambassador (solo per se stessi)
router.post('/upgrade-mlm', auth, requireOwnership('userId'), ambassadorController.upgradeToMLMAmbassador);

// POST /api/ambassador/calculate-commissions - Calcolo commissioni (solo proprie)
router.post('/calculate-commissions', auth, requireAmbassador, ambassadorController.calculateCommissions);

// GET /api/ambassador/dashboard/:userId - Dashboard Ambassador (solo propri dati)
router.get('/dashboard/:userId', auth, requireOwnership('userId'), ambassadorController.getAmbassadorDashboard);

// GET /api/ambassador/mlm-tree/:userId - Albero genealogico MLM (solo propri dati)
router.get('/mlm-tree/:userId', auth, requireOwnership('userId'), ambassadorController.getMLMTree);

// GET /api/ambassador/commissions/:userId - Commissioni (solo proprie)
router.get('/commissions/:userId', auth, requireOwnership('userId'), ambassadorController.getCommissions);

// GET /api/ambassador/referrals/:userId - Referral (solo propri)
router.get('/referrals/:userId', auth, requireOwnership('userId'), ambassadorController.getReferrals);

// POST /api/ambassador/complete-task - Completamento task (solo propri)
router.post('/complete-task', auth, requireAmbassador, ambassadorController.completeTask);

// GET /api/ambassador/profile/:userId - Profilo (solo propri dati)
router.get('/profile/:userId', auth, requireOwnership('userId'), ambassadorController.getProfile);

// PUT /api/ambassador/profile/:userId - Aggiornamento profilo (solo propri dati)
router.put('/profile/:userId', auth, requireOwnership('userId'), ambassadorController.updateProfile);

// GET /api/ambassador/badges/:userId - Badge (solo propri)
router.get('/badges/:userId', auth, requireOwnership('userId'), ambassadorController.getBadges);

// GET /api/ambassador/points/:userId - Punti (solo propri)
router.get('/points/:userId', auth, requireOwnership('userId'), ambassadorController.getPoints);

// POST /api/ambassador/upload-document - Upload documenti (solo propri)
router.post('/upload-document', auth, requireAmbassador, ambassadorController.uploadDocument);

// GET /api/ambassador/training/:userId - Formazione (solo propria)
router.get('/training/:userId', auth, requireOwnership('userId'), ambassadorController.getTraining);

// POST /api/ambassador/complete-training - Completamento formazione (solo propria)
router.post('/complete-training', auth, requireAmbassador, ambassadorController.completeTraining);

// Routes per Admin/Magnificus - Accesso completo

// GET /api/ambassador/admin/all - Lista tutti gli ambassador (solo admin)
router.get('/admin/all', auth, requireAdmin, ambassadorController.getAllAmbassadors);

// GET /api/ambassador/admin/stats - Statistiche globali (solo admin)
router.get('/admin/stats', auth, requireAdmin, ambassadorController.getGlobalStats);

// GET /api/ambassador/admin/orders - Gestione ordini (solo admin)
router.get('/admin/orders', auth, requireAdmin, ambassadorController.getOrderManagement);

// PUT /api/ambassador/admin/status/:userId - Cambio status ambassador (solo admin)
router.put('/admin/status/:userId', auth, requireAdmin, ambassadorController.updateAmbassadorStatus);

// GET /api/ambassador/admin/commissions - Commissioni globali (solo admin)
router.get('/admin/commissions', auth, requireAdmin, ambassadorController.getGlobalCommissions);

module.exports = router; 