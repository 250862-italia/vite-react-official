const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware per verificare JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token di accesso richiesto'
      });
    }

    // Verifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Trova utente nel database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    // Controlla se l'utente è attivo
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account sospeso'
      });
    }

    // Aggiungi informazioni utente alla request
    req.user = decoded;
    req.userData = user;
    
    next();
  } catch (error) {
    console.error('❌ Errore autenticazione:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

// Middleware per verificare ruoli specifici
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato. Permessi insufficienti.'
      });
    }

    next();
  };
};

// Middleware per verificare se l'utente ha completato l'onboarding
const requireOnboarding = (minLevel = 1) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      if (user.onboardingLevel < minLevel) {
        return res.status(403).json({
          success: false,
          error: `Onboarding livello ${minLevel} richiesto. Livello attuale: ${user.onboardingLevel}`,
          data: {
            currentLevel: user.onboardingLevel,
            requiredLevel: minLevel,
            onboardingProgress: user.onboardingProgress
          }
        });
      }

      next();
    } catch (error) {
      console.error('❌ Errore verifica onboarding:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  };
};

// Middleware per aggiornare lastActivity
const updateActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
        lastActivity: new Date()
      });
    }
    next();
  } catch (error) {
    // Non bloccare la richiesta se fallisce l'aggiornamento dell'attività
    console.error('❌ Errore aggiornamento attività:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOnboarding,
  updateActivity
}; 