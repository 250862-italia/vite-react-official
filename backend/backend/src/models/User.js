const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informazioni base
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Profilo utente
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Ruolo e status
  role: {
    type: String,
    enum: ['user', 'ambassador', 'mlm_ambassador', 'admin'],
    default: 'user',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active',
    index: true
  },
  
  // Sistema MLM
  mlmLevel: {
    type: String,
    enum: ['Entry', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Entry'
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  upline: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    level: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  
  // Statistiche
  stats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalCommissions: {
      type: Number,
      default: 0
    },
    totalReferrals: {
      type: Number,
      default: 0
    },
    activeReferrals: {
      type: Number,
      default: 0
    },
    monthlySales: {
      type: Number,
      default: 0
    },
    monthlyCommissions: {
      type: Number,
      default: 0
    }
  },
  
  // Onboarding e gamification
  onboardingProgress: {
    completed: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 1
    },
    completedSteps: [{
      stepId: String,
      completedAt: Date,
      score: Number
    }],
    totalScore: {
      type: Number,
      default: 0
    }
  },
  
  // Badges e achievements
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['onboarding', 'sales', 'referrals', 'milestones', 'special']
    }
  }],
  
  // Wallet e pagamenti
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    pendingBalance: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    }
  },
  
  // Impostazioni
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true
      },
      showEarnings: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Metadati
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  ipAddress: String,
  userAgent: String,
  
  // Timestamps
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: Date,
  
  // Sistema Referral
  referralCode: {
    type: String,
    unique: true,
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per performance
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.totalSales': -1 });
userSchema.index({ 'stats.totalCommissions': -1 });
userSchema.index({ 'wallet.balance': -1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ mlmLevel: 1, 'stats.totalSales': -1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isAmbassador').get(function() {
  return this.role === 'ambassador' || this.role === 'mlm_ambassador';
});

userSchema.virtual('isMLMAmbassador').get(function() {
  return this.role === 'mlm_ambassador';
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Metodi
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateStats = function(sales, commissions) {
  this.stats.totalSales += sales || 0;
  this.stats.totalCommissions += commissions || 0;
  this.stats.monthlySales += sales || 0;
  this.stats.monthlyCommissions += commissions || 0;
  return this.save();
};

userSchema.methods.addBadge = function(badgeData) {
  const existingBadge = this.badges.find(b => b.badgeId === badgeData.badgeId);
  if (!existingBadge) {
    this.badges.push(badgeData);
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.updateOnboardingProgress = function(stepId, score) {
  const existingStep = this.onboardingProgress.completedSteps.find(s => s.stepId === stepId);
  if (!existingStep) {
    this.onboardingProgress.completedSteps.push({
      stepId,
      completedAt: new Date(),
      score: score || 0
    });
    this.onboardingProgress.totalScore += score || 0;
    this.onboardingProgress.currentStep = Math.max(this.onboardingProgress.currentStep, this.onboardingProgress.completedSteps.length + 1);
  }
  return this.save();
};

// Metodi statici
userSchema.statics.findTopPerformers = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.totalSales': -1 })
    .limit(limit)
    .select('firstName lastName username stats mlmLevel');
};

userSchema.statics.findByMLMLevel = function(level) {
  return this.find({ mlmLevel: level, status: 'active' })
    .sort({ 'stats.totalSales': -1 });
};

userSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        totalAmbassadors: { $sum: { $cond: [{ $in: ['$role', ['ambassador', 'mlm_ambassador']] }, 1, 0] } },
        totalSales: { $sum: '$stats.totalSales' },
        totalCommissions: { $sum: '$stats.totalCommissions' },
        avgSalesPerUser: { $avg: '$stats.totalSales' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema); 