const User = require('../models/User');

// Controller per funzionalità Admin/Magnificus
const adminController = {
  // Statistiche globali (solo admin/magnificus)
  async getGlobalStats(req, res) {
    try {
      // Solo admin e magnificus possono vedere statistiche globali
      if (!['admin', 'magnificus'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Accesso negato',
          message: 'Solo gli amministratori possono visualizzare le statistiche globali'
        });
      }

      // Simula statistiche globali
      const globalStats = {
        totalUsers: 1250,
        totalAmbassadors: 890,
        entryAmbassadors: 650,
        mlmAmbassadors: 240,
        totalRevenue: 125000,
        totalCommissions: 18750,
        activeOrders: 45,
        pendingUpgrades: 12,
        monthlyGrowth: 15.5,
        topPerformers: [
          { id: 1, name: 'Mario Rossi', revenue: 8500, commissions: 1275 },
          { id: 2, name: 'Giulia Bianchi', revenue: 7200, commissions: 1080 },
          { id: 3, name: 'Luca Verdi', revenue: 6800, commissions: 1020 }
        ]
      };

      res.json({
        success: true,
        data: globalStats,
        accessLevel: req.user.role
      });

    } catch (error) {
      console.error('❌ Errore statistiche globali:', error);
      res.status(500).json({ error: 'Errore nel recupero delle statistiche globali' });
    }
  },

  // Gestione ordini (solo admin/magnificus)
  async getOrderManagement(req, res) {
    try {
      if (!['admin', 'magnificus'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Accesso negato',
          message: 'Solo gli amministratori possono gestire gli ordini'
        });
      }

      // Simula gestione ordini
      const orders = [
        {
          id: 1,
          orderNumber: 'ORD-001',
          customer: 'Mario Rossi',
          ambassador: 'Giulia Bianchi',
          amount: 150,
          status: 'completed',
          date: '2024-01-15'
        },
        {
          id: 2,
          orderNumber: 'ORD-002',
          customer: 'Luca Verdi',
          ambassador: 'Mario Rossi',
          amount: 89,
          status: 'pending',
          date: '2024-01-16'
        }
      ];

      res.json({
        success: true,
        data: {
          orders,
          totalOrders: orders.length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          pendingOrders: orders.filter(o => o.status === 'pending').length
        }
      });

    } catch (error) {
      console.error('❌ Errore gestione ordini:', error);
      res.status(500).json({ error: 'Errore nella gestione ordini' });
    }
  },

  // Lista tutti gli ambassador (solo admin/magnificus)
  async getAllAmbassadors(req, res) {
    try {
      if (!['admin', 'magnificus'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Accesso negato',
          message: 'Solo gli amministratori possono visualizzare tutti gli ambassador'
        });
      }

      // Simula lista ambassador
      const ambassadors = [
        {
          id: 1,
          name: 'Mario Rossi',
          email: 'mario@example.com',
          role: 'mlm_ambassador',
          status: 'active',
          points: 1250,
          totalRevenue: 8500,
          joinDate: '2023-06-15'
        },
        {
          id: 2,
          name: 'Giulia Bianchi',
          email: 'giulia@example.com',
          role: 'entry_ambassador',
          status: 'active',
          points: 890,
          totalRevenue: 7200,
          joinDate: '2023-08-22'
        }
      ];

      res.json({
        success: true,
        data: {
          ambassadors,
          total: ambassadors.length,
          entryAmbassadors: ambassadors.filter(a => a.role === 'entry_ambassador').length,
          mlmAmbassadors: ambassadors.filter(a => a.role === 'mlm_ambassador').length
        }
      });

    } catch (error) {
      console.error('❌ Errore lista ambassador:', error);
      res.status(500).json({ error: 'Errore nel recupero della lista ambassador' });
    }
  },

  // Commissioni globali (solo admin/magnificus)
  async getGlobalCommissions(req, res) {
    try {
      if (!['admin', 'magnificus'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Accesso negato',
          message: 'Solo gli amministratori possono visualizzare le commissioni globali'
        });
      }

      // Simula commissioni globali
      const globalCommissions = {
        totalCommissions: 18750,
        monthlyCommissions: 3250,
        commissionBreakdown: {
          entryAmbassador: 9750,
          mlmAmbassador: 9000
        },
        topEarners: [
          { id: 1, name: 'Mario Rossi', commissions: 1275, role: 'mlm_ambassador' },
          { id: 2, name: 'Giulia Bianchi', commissions: 1080, role: 'entry_ambassador' },
          { id: 3, name: 'Luca Verdi', commissions: 1020, role: 'mlm_ambassador' }
        ]
      };

      res.json({
        success: true,
        data: globalCommissions
      });

    } catch (error) {
      console.error('❌ Errore commissioni globali:', error);
      res.status(500).json({ error: 'Errore nel recupero delle commissioni globali' });
    }
  },

  // Cambio status ambassador (solo admin/magnificus)
  async updateAmbassadorStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!['admin', 'magnificus'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Accesso negato',
          message: 'Solo gli amministratori possono modificare lo status degli ambassador'
        });
      }

      // Simula aggiornamento status
      console.log(`🔧 Admin ${req.user.role} ha cambiato status dell'ambassador ${userId} a ${status}`);

      res.json({
        success: true,
        message: `Status dell'ambassador aggiornato a ${status}`,
        data: {
          userId,
          newStatus: status,
          reason,
          updatedBy: req.user.role,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Errore aggiornamento status:', error);
      res.status(500).json({ error: 'Errore nell\'aggiornamento dello status' });
    }
  }
};

module.exports = adminController; 