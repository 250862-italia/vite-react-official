const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  // Informazioni commissione
  commissionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Riferimenti
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Dettagli commissione
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tipo commissione
  type: {
    type: String,
    enum: ['direct_sale', 'team_bonus', 'leadership_bonus', 'matching_bonus', 'rank_advancement'],
    required: true,
    index: true
  },
  
  // Livello MLM
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Stato commissione
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Informazioni pagamento
  paymentMethod: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'crypto'],
    default: 'wallet'
  },
  paymentDate: Date,
  paymentReference: String,
  
  // Note e descrizione
  description: {
    type: String,
    maxlength: 500
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date
}, {
  timestamps: true
});

// Indici per performance
commissionSchema.index({ userId: 1, status: 1 });
commissionSchema.index({ userId: 1, createdAt: -1 });
commissionSchema.index({ type: 1, status: 1 });
commissionSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware per generare commissionId
commissionSchema.pre('save', function(next) {
  if (this.isNew && !this.commissionId) {
    this.commissionId = `COM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Metodo per approvare commissione
commissionSchema.methods.approve = function() {
  this.status = 'approved';
  this.updatedAt = new Date();
  return this.save();
};

// Metodo per pagare commissione
commissionSchema.methods.pay = function(paymentMethod = 'wallet', paymentReference = null) {
  this.status = 'paid';
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  this.paymentDate = new Date();
  this.paidAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Metodo per cancellare commissione
commissionSchema.methods.cancel = function(reason = null) {
  this.status = 'cancelled';
  this.notes = reason ? `${this.notes || ''}\nCancelled: ${reason}`.trim() : this.notes;
  this.updatedAt = new Date();
  return this.save();
};

// Metodo statico per commissioni pendenti di un utente
commissionSchema.statics.getPendingByUser = function(userId) {
  return this.find({
    userId: userId,
    status: 'pending'
  }).sort({ createdAt: -1 });
};

// Metodo statico per commissioni pagate di un utente
commissionSchema.statics.getPaidByUser = function(userId, limit = 50) {
  return this.find({
    userId: userId,
    status: 'paid'
  }).sort({ paidAt: -1 }).limit(limit);
};

// Metodo statico per totale commissioni di un utente
commissionSchema.statics.getTotalByUser = function(userId, status = null) {
  const query = { userId: userId };
  if (status) query.status = status;
  
  return this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

// Metodo statico per commissioni per periodo
commissionSchema.statics.getByPeriod = function(startDate, endDate, status = null) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  if (status) query.status = status;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Metodo statico per statistiche commissioni
commissionSchema.statics.getStats = function(userId = null) {
  const match = userId ? { userId: userId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Commission', commissionSchema); 