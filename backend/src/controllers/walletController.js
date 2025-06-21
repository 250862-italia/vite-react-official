const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

class WalletController {
  // Ottieni informazioni wallet dell'utente
  async getWalletInfo(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Ottieni saldo token dalla blockchain
      const tokenBalance = await blockchainService.getTokenBalance(user.walletAddress);
      
      // Ottieni statistiche di staking
      const stakingStats = await blockchainService.getUserStats(user.walletAddress);
      
      // Ottieni stake attivi
      const userStakes = await blockchainService.getUserStakes(user.walletAddress);

      res.json({
        success: true,
        data: {
          wallet: {
            address: user.walletAddress,
            balance: tokenBalance.balance,
            symbol: tokenBalance.symbol,
            decimals: tokenBalance.decimals
          },
          staking: {
            totalStaked: stakingStats.totalStakedAmount,
            totalRewards: stakingStats.totalRewardsEarned,
            activeStakes: stakingStats.activeStakes,
            stakes: userStakes
          },
          user: {
            points: user.points,
            tokens: user.tokens,
            referralCode: user.referralCode,
            referrals: user.referrals.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Errore wallet info:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Crea un nuovo stake
  async createStake(req, res) {
    try {
      const { amount, duration } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Validazione
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Importo deve essere maggiore di 0'
        });
      }

      if (!duration || duration < 30 * 24 * 60 * 60 || duration > 365 * 24 * 60 * 60) {
        return res.status(400).json({
          success: false,
          error: 'Durata deve essere tra 30 giorni e 1 anno'
        });
      }

      // Verifica saldo
      const tokenBalance = await blockchainService.getTokenBalance(user.walletAddress);
      if (parseInt(tokenBalance.balance) < amount) {
        return res.status(400).json({
          success: false,
          error: 'Saldo insufficiente per creare lo stake'
        });
      }

      // Crea lo stake
      const stakeResult = await blockchainService.createStake(user.walletAddress, amount, duration);

      // Registra evento blockchain
      await blockchainService.logEvent('stake_created', {
        userId: user._id,
        username: user.username,
        amount,
        duration,
        transactionHash: stakeResult.transactionHash
      });

      res.json({
        success: true,
        message: 'Stake creato con successo',
        data: {
          transactionHash: stakeResult.transactionHash,
          amount,
          duration,
          estimatedRewards: (amount * 5 * duration) / (365 * 24 * 60 * 60 * 100) // 5% APY
        }
      });

    } catch (error) {
      console.error('❌ Errore creazione stake:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Withdraw stake
  async withdrawStake(req, res) {
    try {
      const { stakeIndex } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      if (stakeIndex === undefined || stakeIndex < 0) {
        return res.status(400).json({
          success: false,
          error: 'Indice stake non valido'
        });
      }

      // Verifica che lo stake esista e sia maturo
      const userStakes = await blockchainService.getUserStakes(user.walletAddress);
      
      if (stakeIndex >= userStakes.length) {
        return res.status(400).json({
          success: false,
          error: 'Stake non trovato'
        });
      }

      const stake = userStakes[stakeIndex];
      if (!stake.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Stake non attivo'
        });
      }

      if (new Date() < stake.endTime) {
        return res.status(400).json({
          success: false,
          error: 'Stake non ancora maturo'
        });
      }

      // Calcola ricompense
      const rewards = await blockchainService.calculateRewards(user.walletAddress, stakeIndex);

      // Withdraw (questa funzione dovrebbe essere implementata nel contratto)
      // Per ora simuliamo
      console.log(`🔓 Simulazione withdraw stake ${stakeIndex} per ${user.walletAddress}`);

      // Registra evento blockchain
      await blockchainService.logEvent('stake_withdrawn', {
        userId: user._id,
        username: user.username,
        stakeIndex,
        amount: stake.amount,
        rewards
      });

      res.json({
        success: true,
        message: 'Stake ritirato con successo',
        data: {
          stakeIndex,
          amount: stake.amount,
          rewards,
          totalReceived: parseInt(stake.amount) + parseInt(rewards)
        }
      });

    } catch (error) {
      console.error('❌ Errore withdraw stake:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Ottieni cronologia transazioni
  async getTransactionHistory(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Per ora restituiamo una cronologia simulata
      // In futuro interrogeremo la blockchain per eventi reali
      const transactions = [
        {
          type: 'mint',
          amount: '100',
          reason: 'onboarding',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          transactionHash: '0x123...abc'
        },
        {
          type: 'cashback',
          amount: '25',
          reason: 'purchase',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          transactionHash: '0x456...def'
        },
        {
          type: 'referral',
          amount: '50',
          reason: 'new_user',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          transactionHash: '0x789...ghi'
        }
      ];

      res.json({
        success: true,
        data: {
          transactions,
          total: transactions.length
        }
      });

    } catch (error) {
      console.error('❌ Errore cronologia transazioni:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Genera referral code
  async generateReferralCode(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Genera nuovo referral code se non esiste
      if (!user.referralCode) {
        user.referralCode = user.generateReferralCode();
        await user.save();
      }

      res.json({
        success: true,
        data: {
          referralCode: user.referralCode,
          referralLink: `https://washtheworld.com/ref/${user.referralCode}`,
          totalReferrals: user.referrals.length
        }
      });

    } catch (error) {
      console.error('❌ Errore generazione referral code:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Ottieni statistiche referral
  async getReferralStats(req, res) {
    try {
      const user = await User.findById(req.user.userId).populate('referrals', 'username email createdAt');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Calcola statistiche referral
      const referralStats = {
        totalReferrals: user.referrals.length,
        activeReferrals: user.referrals.filter(ref => ref.status === 'active').length,
        totalEarnings: user.stats.totalCommission || 0,
        thisMonth: user.referrals.filter(ref => {
          const refDate = new Date(ref.createdAt);
          const now = new Date();
          return refDate.getMonth() === now.getMonth() && refDate.getFullYear() === now.getFullYear();
        }).length
      };

      res.json({
        success: true,
        data: {
          referralCode: user.referralCode,
          referralLink: `https://washtheworld.com/ref/${user.referralCode}`,
          stats: referralStats,
          referrals: user.referrals.map(ref => ({
            username: ref.username,
            email: ref.email,
            joinedAt: ref.createdAt,
            status: ref.status
          }))
        }
      });

    } catch (error) {
      console.error('❌ Errore statistiche referral:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }
}

module.exports = new WalletController(); 