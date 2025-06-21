const User = require('../models/User');

// Controller per la gestione degli Ambassador
const ambassadorController = {
  // Upgrade a Entry Ambassador
  async upgradeToEntryAmbassador(req, res) {
    try {
      const { userId, welcomeKitType, paymentMethod } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Verifica requisiti per upgrade
      if (user.role !== 'wavemaker') {
        return res.status(400).json({ error: 'Solo i wavemaker possono diventare Entry Ambassador' });
      }

      // Configurazione Welcome Kit
      const welcomeKitConfig = {
        basic: { price: 99, points: 50, role: 'entry_ambassador' },
        premium: { price: 199, points: 120, role: 'entry_ambassador' },
        mlm_complete: { price: 299, points: 200, role: 'mlm_ambassador' }
      };

      const kit = welcomeKitConfig[welcomeKitType];
      if (!kit) {
        return res.status(400).json({ error: 'Tipo Welcome Kit non valido' });
      }

      // Aggiorna utente
      user.role = kit.role;
      user.welcomeKit = {
        type: welcomeKitType,
        purchasedAt: new Date(),
        amount: kit.price,
        status: 'active',
        paymentMethod
      };
      user.points += kit.points;
      user.status = 'active';

      await user.save();

      res.json({
        success: true,
        message: `Upgrade a ${kit.role} completato`,
        user: {
          id: user._id,
          role: user.role,
          points: user.points,
          welcomeKit: user.welcomeKit
        }
      });

    } catch (error) {
      console.error('Errore upgrade ambassador:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  // Calcolo commissioni in tempo reale
  async calculateCommissions(req, res) {
    try {
      const { userId, saleAmount, saleType } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      let commissionStructure;
      if (user.role === 'entry_ambassador') {
        commissionStructure = user.commissionStructure.entryAmbassador;
      } else if (user.role === 'mlm_ambassador') {
        commissionStructure = user.commissionStructure.mlmAmbassador;
      } else {
        return res.status(400).json({ error: 'Utente non è un ambassador' });
      }

      // Calcolo commissione diretta
      const directCommission = (saleAmount * commissionStructure.directSale) / 100;

      // Calcolo commissioni rete (livelli 1-6)
      const networkCommissions = [];
      let totalNetworkCommission = 0;

      for (let level = 1; level <= 6; level++) {
        const levelCommission = (saleAmount * commissionStructure.levels[level]) / 100;
        networkCommissions.push({
          level,
          percentage: commissionStructure.levels[level],
          amount: levelCommission
        });
        totalNetworkCommission += levelCommission;
      }

      const totalCommission = directCommission + totalNetworkCommission;

      res.json({
        success: true,
        commission: {
          direct: {
            percentage: commissionStructure.directSale,
            amount: directCommission
          },
          network: networkCommissions,
          total: totalCommission,
          saleAmount,
          saleType
        }
      });

    } catch (error) {
      console.error('Errore calcolo commissioni:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  // Dashboard Ambassador
  async getAmbassadorDashboard(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Statistiche ambassador
      const stats = {
        role: user.role,
        status: user.status,
        points: user.points,
        referralCode: user.referralCode,
        welcomeKit: user.welcomeKit,
        totalSales: user.totalSales || 0,
        totalCommissions: user.totalCommissions || 0,
        networkSize: user.networkSize || 0,
        level1Referrals: user.level1Referrals || 0,
        level2Referrals: user.level2Referrals || 0,
        level3Referrals: user.level3Referrals || 0,
        level4Referrals: user.level4Referrals || 0,
        level5Referrals: user.level5Referrals || 0,
        level6Referrals: user.level6Referrals || 0
      };

      res.json({
        success: true,
        dashboard: stats
      });

    } catch (error) {
      console.error('Errore dashboard ambassador:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  // Albero genealogico MLM
  async getMLMTree(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Trova tutti i referral diretti e indiretti
      const directReferrals = await User.find({ referredBy: user.referralCode });
      
      const tree = {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode
        },
        directReferrals: directReferrals.map(ref => ({
          id: ref._id,
          name: ref.name,
          email: ref.email,
          role: ref.role,
          status: ref.status,
          joinDate: ref.createdAt
        })),
        totalReferrals: directReferrals.length
      };

      res.json({
        success: true,
        mlmTree: tree
      });

    } catch (error) {
      console.error('Errore albero MLM:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  // Storico commissioni
  async getCommissionHistory(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Simula storico commissioni (in produzione verrebbe dal database)
      const commissionHistory = [
        {
          id: 1,
          date: new Date('2024-01-15'),
          type: 'direct_sale',
          amount: 150.00,
          commission: 19.50,
          description: 'Vendita diretta prodotto X'
        },
        {
          id: 2,
          date: new Date('2024-01-10'),
          type: 'network_level_1',
          amount: 200.00,
          commission: 6.00,
          description: 'Commissione livello 1 - Referral Y'
        }
      ];

      res.json({
        success: true,
        commissionHistory
      });

    } catch (error) {
      console.error('Errore storico commissioni:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  },

  // Upgrade da Entry Ambassador a MLM Ambassador
  async upgradeToMLMAmbassador(req, res) {
    try {
      const { userId, paymentMethod } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Verifica requisiti per upgrade
      if (user.role !== 'entry_ambassador') {
        return res.status(400).json({ 
          error: 'Solo gli Entry Ambassador possono diventare MLM Ambassador',
          currentRole: user.role
        });
      }

      // Configurazione upgrade MLM
      const mlmUpgradeConfig = {
        price: 49, // 49€
        points: 10, // 10 punti bonus
        role: 'mlm_ambassador',
        paymentMethods: ['stripe', 'paypal']
      };

      // Verifica metodo di pagamento
      if (!mlmUpgradeConfig.paymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ 
          error: 'Metodo di pagamento non supportato',
          supportedMethods: mlmUpgradeConfig.paymentMethods
        });
      }

      // Simulazione pagamento (in produzione qui andrebbe l'integrazione Stripe/PayPal)
      const paymentResult = await this.processPayment(paymentMethod, mlmUpgradeConfig.price);
      
      if (!paymentResult.success) {
        return res.status(400).json({ 
          error: 'Pagamento fallito',
          details: paymentResult.error
        });
      }

      // Aggiornamento utente
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          role: mlmUpgradeConfig.role,
          'welcomeKit.type': 'mlm_complete',
          'welcomeKit.upgradedAt': new Date(),
          'welcomeKit.upgradeAmount': mlmUpgradeConfig.price,
          'welcomeKit.status': 'active',
          'commissionPlan': 'mlm_ambassador',
          points: user.points + mlmUpgradeConfig.points,
          badges: [...user.badges, 'mlm_ambassador'],
          'mlmAccess.level': 6, // Sblocco 6 livelli
          'mlmAccess.advancedTraining': true,
          'mlmAccess.formationRequired': true
        },
        { new: true }
      );

      // Log dell'upgrade
      console.log(`🔓 Upgrade MLM completato per ${user.email}: Entry → MLM Ambassador`);

      res.json({
        success: true,
        message: '🔓 Libera tutto il tuo potenziale! Passa oggi al piano MLM Ambassador, ricevi 10 punti omaggio e guadagna di più da ogni vendita!',
        user: {
          id: updatedUser._id,
          role: updatedUser.role,
          points: updatedUser.points,
          badges: updatedUser.badges,
          mlmAccess: updatedUser.mlmAccess
        },
        upgrade: {
          price: mlmUpgradeConfig.price,
          pointsEarned: mlmUpgradeConfig.points,
          paymentMethod: paymentMethod,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Errore upgrade MLM:', error);
      res.status(500).json({ error: 'Errore durante l\'upgrade a MLM Ambassador' });
    }
  },

  // Processo pagamento (simulato)
  async processPayment(method, amount) {
    // Simulazione pagamento - in produzione qui andrebbe l'integrazione reale
    return new Promise((resolve) => {
      setTimeout(() => {
        if (method === 'stripe' || method === 'paypal') {
          resolve({ success: true, transactionId: `txn_${Date.now()}` });
        } else {
          resolve({ success: false, error: 'Metodo di pagamento non supportato' });
        }
      }, 1000);
    });
  }
};

module.exports = ambassadorController; 