const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireAdmin, requireMagnificus } = require('../middleware/auth');

// Routes per Admin/Magnificus - Accesso completo

// GET /api/admin/stats - Statistiche globali (solo admin/magnificus)
router.get('/stats', auth, requireAdmin, adminController.getGlobalStats);

// GET /api/admin/orders - Gestione ordini (solo admin/magnificus)
router.get('/orders', auth, requireAdmin, adminController.getOrderManagement);

// GET /api/admin/ambassadors - Lista tutti gli ambassador (solo admin/magnificus)
router.get('/ambassadors', auth, requireAdmin, adminController.getAllAmbassadors);

// GET /api/admin/commissions - Commissioni globali (solo admin/magnificus)
router.get('/commissions', auth, requireAdmin, adminController.getGlobalCommissions);

// PUT /api/admin/ambassador/:userId/status - Cambio status ambassador (solo admin/magnificus)
router.put('/ambassador/:userId/status', auth, requireAdmin, adminController.updateAmbassadorStatus);

// Routes per Magnificus - Accesso completo al sistema

// GET /api/admin/system/config - Configurazioni sistema (solo magnificus)
router.get('/system/config', auth, requireMagnificus, (req, res) => {
  res.json({
    success: true,
    data: {
      systemConfig: {
        commissionRates: {
          entryAmbassador: { direct: 13, levels: [3, 2, 1, 0, 0, 0] },
          mlmAmbassador: { direct: 20, levels: [6, 5, 4, 3, 2, 1] }
        },
        upgradePricing: {
          entryToMlm: 49,
          basicKit: 99,
          premiumKit: 199
        },
        systemSettings: {
          maintenanceMode: false,
          registrationEnabled: true,
          maxReferrals: 100
        }
      }
    }
  });
});

// PUT /api/admin/system/config - Aggiornamento configurazioni (solo magnificus)
router.put('/system/config', auth, requireMagnificus, (req, res) => {
  const { config } = req.body;
  
  console.log(`🔧 Magnificus ha aggiornato le configurazioni di sistema`);
  
  res.json({
    success: true,
    message: 'Configurazioni di sistema aggiornate',
    data: { config, updatedBy: req.user.role, timestamp: new Date() }
  });
});

// GET /api/admin/logs - Log di sistema (solo magnificus)
router.get('/logs', auth, requireMagnificus, (req, res) => {
  res.json({
    success: true,
    data: {
      logs: [
        { timestamp: '2024-01-16 10:30:00', level: 'INFO', message: 'Sistema avviato' },
        { timestamp: '2024-01-16 10:35:00', level: 'INFO', message: 'Nuovo ambassador registrato' },
        { timestamp: '2024-01-16 10:40:00', level: 'WARN', message: 'Tentativo di accesso non autorizzato' }
      ]
    }
  });
});

module.exports = router; 