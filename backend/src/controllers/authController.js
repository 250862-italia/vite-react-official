const User = require('../models/User');
const jwt = require('jsonwebtoken');
const blockchainService = require('../services/blockchainService');

class AuthController {
  // Registrazione nuovo Wavemaker
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, phone, referralCode } = req.body;

      // Validazione base
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Tutti i campi obbligatori devono essere compilati'
        });
      }

      // Controllo se utente esiste già
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username o email già in uso'
        });
      }

      // Genera wallet blockchain
      const wallet = await blockchainService.generateUserWallet();

      // Crea hash del contratto
      const contractHash = blockchainService.createContractHash({
        username,
        email,
        role: 'wavemaker'
      });

      // Crea nuovo utente
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        walletAddress: wallet.address,
        walletPrivateKey: wallet.privateKey, // In produzione andrebbe crittografato
        contractHash: contractHash.hash,
        referralCode: `${username.toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });

      // Se c'è un referral code, collega l'utente
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          user.referredBy = referrer._id;
          referrer.referrals.push(user._id);
          await referrer.save();
        }
      }

      await user.save();

      // Genera JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Registra evento blockchain
      await blockchainService.logEvent('user_registered', {
        userId: user._id,
        username: user.username,
        walletAddress: wallet.address
      });

      res.status(201).json({
        success: true,
        message: 'Registrazione completata con successo',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            walletAddress: wallet.address,
            referralCode: user.referralCode,
            onboardingLevel: user.onboardingLevel
          },
          token,
          contractHash: contractHash.hash,
          wallet: {
            address: wallet.address,
            mnemonic: wallet.mnemonic
          }
        }
      });

    } catch (error) {
      console.error('❌ Errore registrazione:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Login utente
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username e password sono obbligatori'
        });
      }

      // Trova utente
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenziali non valide'
        });
      }

      // Verifica password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Credenziali non valide'
        });
      }

      // Controlla status utente
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Account sospeso. Contatta il supporto.'
        });
      }

      // Aggiorna ultimo login
      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();

      // Genera JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Registra evento blockchain
      await blockchainService.logEvent('user_login', {
        userId: user._id,
        username: user.username
      });

      res.json({
        success: true,
        message: 'Login effettuato con successo',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            walletAddress: user.walletAddress,
            referralCode: user.referralCode,
            onboardingLevel: user.onboardingLevel,
            points: user.points,
            tokens: user.tokens,
            stats: user.stats
          },
          token
        }
      });

    } catch (error) {
      console.error('❌ Errore login:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Verifica token e ottieni profilo utente
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -walletPrivateKey');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Ottieni saldo token dalla blockchain
      const tokenBalance = await blockchainService.getTokenBalance(user.walletAddress);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            walletAddress: user.walletAddress,
            referralCode: user.referralCode,
            onboardingLevel: user.onboardingLevel,
            onboardingProgress: user.onboardingProgress,
            points: user.points,
            tokens: user.tokens,
            stats: user.stats,
            referrals: user.referrals.length,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          },
          blockchain: {
            tokenBalance: tokenBalance.balance,
            tokenSymbol: tokenBalance.symbol
          }
        }
      });

    } catch (error) {
      console.error('❌ Errore profilo:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Firma contratto digitale
  async signContract(req, res) {
    try {
      const { signature } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      if (user.onboardingProgress.contractSigned) {
        return res.status(400).json({
          success: false,
          error: 'Contratto già firmato'
        });
      }

      // Verifica firma
      const isValidSignature = blockchainService.verifyContractSignature(
        user.contractHash,
        signature,
        user.walletAddress
      );

      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          error: 'Firma non valida'
        });
      }

      // Aggiorna stato contratto
      user.onboardingProgress.contractSigned = true;
      user.onboardingProgress.contractSignedAt = new Date();
      user.onboardingLevel = Math.min(user.onboardingLevel + 1, 5);
      user.status = 'active';

      // Assegna punti bonus per la firma
      await user.addPoints(100);
      await user.addTokens(50);

      await user.save();

      // Registra evento blockchain
      await blockchainService.logEvent('contract_signed', {
        userId: user._id,
        username: user.username,
        contractHash: user.contractHash
      });

      res.json({
        success: true,
        message: 'Contratto firmato con successo',
        data: {
          contractSigned: true,
          contractSignedAt: user.onboardingProgress.contractSignedAt,
          onboardingLevel: user.onboardingLevel,
          pointsEarned: 100,
          tokensEarned: 50
        }
      });

    } catch (error) {
      console.error('❌ Errore firma contratto:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // Registra evento blockchain
      await blockchainService.logEvent('user_logout', {
        userId: req.user.userId,
        username: req.user.username
      });

      res.json({
        success: true,
        message: 'Logout effettuato con successo'
      });

    } catch (error) {
      console.error('❌ Errore logout:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }
}

module.exports = new AuthController(); 