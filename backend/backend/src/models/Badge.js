const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  // Informazioni badge
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Categoria e tipo
  category: {
    type: String,
    enum: ['achievement', 'milestone', 'special', 'event', 'rank'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['sales', 'recruitment', 'training', 'leadership', 'community', 'special'],
    required: true,
    index: true
  },
  
  // Criteri di assegnazione
  criteria: {
    type: {
      type: String,
      enum: ['sales_amount', 'sales_count', 'recruits', 'team_size', 'training_completed', 'days_active', 'custom'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['lifetime', 'monthly', 'weekly', 'daily'],
      default: 'lifetime'
    }
  },
  
  // Immagini e design
  icon: {
    type: String,
    required: true
  },
  iconLocked: {
    type: String
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  
  // Rarità e punti
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
    index: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Stato e visibilità
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  
  // Requisiti speciali
  requirements: {
    minRank: {
      type: String,
      enum: ['entry', 'wavemaker', 'entry_ambassador', 'mlm_ambassador', 'admin']
    },
    minTeamSize: Number,
    minSalesAmount: Number,
    customCondition: String
  },
  
  // Badge correlati
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  unlocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indici per performance
badgeSchema.index({ category: 1, type: 1 });
badgeSchema.index({ rarity: 1, isActive: 1 });
badgeSchema.index({ 'criteria.type': 1, isActive: 1 });

// Pre-save middleware per generare code se non fornito
badgeSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  }
  next();
});

// Metodo per verificare se un utente può ottenere il badge
badgeSchema.methods.canEarn = function(user) {
  // Verifica requisiti di rango
  if (this.requirements.minRank) {
    const rankOrder = {
      'entry': 1,
      'wavemaker': 2,
      'entry_ambassador': 3,
      'mlm_ambassador': 4,
      'admin': 5
    };
    
    if (rankOrder[user.role] < rankOrder[this.requirements.minRank]) {
      return false;
    }
  }
  
  // Verifica dimensione team
  if (this.requirements.minTeamSize && user.teamSize < this.requirements.minTeamSize) {
    return false;
  }
  
  // Verifica vendite minime
  if (this.requirements.minSalesAmount && user.totalSales < this.requirements.minSalesAmount) {
    return false;
  }
  
  return true;
};

// Metodo per calcolare progresso verso il badge
badgeSchema.methods.getProgress = function(user) {
  const criteria = this.criteria;
  let currentValue = 0;
  let targetValue = criteria.value;
  
  switch (criteria.type) {
    case 'sales_amount':
      currentValue = user.totalSales || 0;
      break;
    case 'sales_count':
      currentValue = user.totalOrders || 0;
      break;
    case 'recruits':
      currentValue = user.teamSize || 0;
      break;
    case 'team_size':
      currentValue = user.teamSize || 0;
      break;
    case 'training_completed':
      currentValue = user.completedTasks || 0;
      break;
    case 'days_active':
      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
      currentValue = daysSinceJoin;
      break;
    default:
      currentValue = 0;
  }
  
  return {
    current: currentValue,
    target: targetValue,
    percentage: Math.min(100, (currentValue / targetValue) * 100),
    isCompleted: currentValue >= targetValue
  };
};

// Metodo statico per badge disponibili per un utente
badgeSchema.statics.getAvailableForUser = function(user) {
  return this.find({
    isActive: true,
    isHidden: false
  }).then(badges => {
    return badges.filter(badge => badge.canEarn(user));
  });
};

// Metodo statico per badge per categoria
badgeSchema.statics.getByCategory = function(category) {
  return this.find({
    category: category,
    isActive: true
  }).sort({ points: -1 });
};

// Metodo statico per badge per rarità
badgeSchema.statics.getByRarity = function(rarity) {
  return this.find({
    rarity: rarity,
    isActive: true
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Badge', badgeSchema); 