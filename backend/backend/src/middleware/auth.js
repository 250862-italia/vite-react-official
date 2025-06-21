const jwt = require('jsonwebtoken');

// Middleware di autenticazione base
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    // Per il server semplice, simuliamo un token valido
    if (process.env.NODE_ENV === 'development' && token === 'fake-jwt-token-456') {
      req.user = {
        id: 1,
        email: 'test@example.com',
        role: 'entry_ambassador',
        points: 100
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

// Middleware per ruoli specifici
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accesso negato',
        message: 'Non hai i permessi necessari per accedere a questa risorsa',
        requiredRoles: roles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Middleware per accesso solo admin/magnificus
const requireAdmin = requireRole(['admin', 'magnificus']);

// Middleware per accesso solo magnificus
const requireMagnificus = requireRole(['magnificus']);

// Middleware per accesso solo ambassador (entry e mlm)
const requireAmbassador = requireRole(['entry_ambassador', 'mlm_ambassador']);

// Middleware per accesso solo MLM ambassador
const requireMLMAmbassador = requireRole(['mlm_ambassador']);

// Middleware per controllare accesso ai propri dati
const requireOwnership = (paramName = 'userId') => {
  return (req, res, next) => {
    const targetUserId = req.params[paramName] || req.body[paramName];
    
    // Admin e magnificus possono accedere a tutto
    if (['admin', 'magnificus'].includes(req.user.role)) {
      return next();
    }

    // Gli utenti normali possono accedere solo ai propri dati
    if (req.user.id.toString() !== targetUserId?.toString()) {
      return res.status(403).json({
        error: 'Accesso negato',
        message: 'Puoi accedere solo ai tuoi dati personali',
        yourId: req.user.id,
        requestedId: targetUserId
      });
    }

    next();
  };
};

// Middleware per statistiche globali (solo admin/magnificus)
const requireGlobalStats = requireAdmin;

// Middleware per gestione ordini (solo admin/magnificus)
const requireOrderManagement = requireAdmin;

// Middleware per configurazioni sistema (solo magnificus)
const requireSystemConfig = requireMagnificus;

module.exports = {
  auth,
  requireRole,
  requireAdmin,
  requireMagnificus,
  requireAmbassador,
  requireMLMAmbassador,
  requireOwnership,
  requireGlobalStats,
  requireOrderManagement,
  requireSystemConfig
}; 