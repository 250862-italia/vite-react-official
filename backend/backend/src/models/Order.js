const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Informazioni ordine
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    firstName: String,
    lastName: String,
    phone: String
  },
  
  // Prodotti
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    commission: {
      type: Number,
      default: 0
    }
  }],
  
  // Prezzi e commissioni
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Sistema commissioni
  commissions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    level: {
      type: Number,
      min: 0,
      max: 10
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending'
    },
    paidAt: Date
  }],
  
  // Indirizzo di spedizione
  shippingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'IT'
    },
    phone: String
  },
  
  // Indirizzo di fatturazione
  billingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'IT'
    },
    phone: String
  },
  
  // Pagamento
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    transactionId: String,
    gateway: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    paidAt: Date
  },
  
  // Spedizione
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'premium'],
      default: 'standard'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'returned'],
      default: 'pending',
      index: true
    },
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date
  },
  
  // Status ordine
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  // Note e commenti
  notes: {
    customer: String,
    internal: String
  },
  
  // Metadati
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'admin', 'api'],
    default: 'website'
  },
  referrer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    code: String
  },
  
  // Timestamps
  confirmedAt: Date,
  processedAt: Date,
  cancelledAt: Date,
  refundedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.userId': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1, createdAt: -1 });
orderSchema.index({ 'shipping.status': 1, createdAt: -1 });
orderSchema.index({ total: -1 });
orderSchema.index({ 'commissions.userId': 1, 'commissions.status': 1 });

// Virtuals
orderSchema.virtual('isPaid').get(function() {
  return this.payment.status === 'completed';
});

orderSchema.virtual('isShipped').get(function() {
  return this.shipping.status === 'shipped' || this.shipping.status === 'delivered';
});

orderSchema.virtual('isDelivered').get(function() {
  return this.shipping.status === 'delivered';
});

orderSchema.virtual('totalCommissions').get(function() {
  return this.commissions.reduce((sum, commission) => sum + commission.amount, 0);
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    // Genera numero ordine unico
    this.orderNumber = this.generateOrderNumber();
  }
  next();
});

// Metodi
orderSchema.methods.generateOrderNumber = function() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `WTW${timestamp}${random}`;
};

orderSchema.methods.addCommission = function(userId, level, percentage, amount) {
  this.commissions.push({
    userId,
    level,
    percentage,
    amount,
    status: 'pending'
  });
  return this.save();
};

orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  // Aggiorna timestamp appropriato
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = new Date();
      break;
    case 'processing':
      this.processedAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
    case 'refunded':
      this.refundedAt = new Date();
      break;
  }
  
  return this.save();
};

orderSchema.methods.updatePaymentStatus = function(status, transactionId = null) {
  this.payment.status = status;
  if (status === 'completed') {
    this.payment.paidAt = new Date();
  }
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  return this.save();
};

// Metodi statici
orderSchema.statics.findByCustomer = function(userId, limit = 20) {
  return this.find({ 'customer.userId': userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('items.productId', 'name image');
};

orderSchema.statics.findPendingCommissions = function(userId) {
  return this.find({
    'commissions.userId': userId,
    'commissions.status': 'pending'
  }).sort({ createdAt: -1 });
};

orderSchema.statics.getStats = function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalCommissions: { $sum: { $sum: '$commissions.amount' } },
        avgOrderValue: { $avg: '$total' },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }
    }
  ]);
};

orderSchema.statics.getDailyStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
        commissions: { $sum: { $sum: '$commissions.amount' } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema); 