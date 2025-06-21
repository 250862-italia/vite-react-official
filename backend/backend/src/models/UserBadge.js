const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  // Riferimenti
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
    index: true
  },
  
  // Dettagli assegnazione
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  earnedBy: {
    type: String,
    enum: ['automatic', 'manual', 'event', 'admin'],
    default: 'automatic'
  },
  
  // Progresso al momento dell'assegnazione
  progressAtEarning: {
    current: Number,
    target: Number,
    percentage: Number
  },
  
  // Metadati
  metadata: {
    orderId: mongoose.Schema.Types.ObjectId,
    salesAmount: Number,
    teamSize: Number,
    daysActive: Number,
    customData: mongoose.Schema.Types.Mixed
  },
  
  // Notifiche
  isNotified: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indice composto per evitare duplicati
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

// Indici per performance
userBadgeSchema.index({ userId: 1, earnedAt: -1 });
userBadgeSchema.index({ badgeId: 1, earnedAt: -1 });

// Pre-save middleware per aggiornare progresso
userBadgeSchema.pre('save', function(next) {
  if (this.isNew && !this.progressAtEarning) {
    // Il progresso verrà impostato dal controller
    this.progressAtEarning = {
      current: 0,
      target: 0,
      percentage: 0
    };
  }
  next();
});

// Metodo per marcare come notificato
userBadgeSchema.methods.markAsNotified = function() {
  this.isNotified = true;
  this.notificationSentAt = new Date();
  return this.save();
};

// Metodo statico per badge di un utente
userBadgeSchema.statics.getUserBadges = function(userId, options = {}) {
  const query = { userId: userId };
  
  if (options.category) {
    query['badge.category'] = options.category;
  }
  
  if (options.type) {
    query['badge.type'] = options.type;
  }
  
  return this.find(query)
    .populate('badgeId')
    .sort({ earnedAt: -1 })
    .limit(options.limit || 50);
};

// Metodo statico per verificare se un utente ha un badge
userBadgeSchema.statics.hasBadge = function(userId, badgeId) {
  return this.exists({ userId: userId, badgeId: badgeId });
};

// Metodo statico per badge recenti di un utente
userBadgeSchema.statics.getRecentBadges = function(userId, limit = 5) {
  return this.find({ userId: userId })
    .populate('badgeId')
    .sort({ earnedAt: -1 })
    .limit(limit);
};

// Metodo statico per statistiche badge di un utente
userBadgeSchema.statics.getUserBadgeStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'badges',
        localField: 'badgeId',
        foreignField: '_id',
        as: 'badge'
      }
    },
    { $unwind: '$badge' },
    {
      $group: {
        _id: null,
        totalBadges: { $sum: 1 },
        totalPoints: { $sum: '$badge.points' },
        categories: { $addToSet: '$badge.category' },
        types: { $addToSet: '$badge.type' },
        rarities: { $addToSet: '$badge.rarity' }
      }
    }
  ]);
};

// Metodo statico per badge più comuni
userBadgeSchema.statics.getMostEarnedBadges = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$badgeId',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'badges',
        localField: '_id',
        foreignField: '_id',
        as: 'badge'
      }
    },
    { $unwind: '$badge' },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Metodo statico per badge assegnati in un periodo
userBadgeSchema.statics.getBadgesByPeriod = function(startDate, endDate, userId = null) {
  const query = {
    earnedAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query)
    .populate('badgeId')
    .populate('userId', 'username email firstName lastName')
    .sort({ earnedAt: -1 });
};

module.exports = mongoose.model('UserBadge', userBadgeSchema); 