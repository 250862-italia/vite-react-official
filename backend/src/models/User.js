const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informazioni base
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Informazioni personali
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  dateOfBirth: Date,
  
  // Ruolo e status
  role: {
    type: String,
    enum: ['wavemaker', 'ambassador', 'admin', 'magnificus'],
    default: 'wavemaker'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  
  // Blockchain & Wallet
  walletAddress: String,
  walletPrivateKey: String, // Crittografato
  contractHash: String, // Hash del contratto firmato
  
  // Sistema Gamificato
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  experienceToNextLevel: {
    type: Number,
    default: 100
  },
  
  // Onboarding e Gamification
  onboardingLevel: {
    type: Number,
    default: 0
  },
  onboardingProgress: {
    videosWatched: [String],
    documentsUploaded: [String],
    quizzesCompleted: [String],
    tasksCompleted: [{
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OnboardingTask'
      },
      completedAt: Date,
      score: Number
    }],
    contractSigned: {
      type: Boolean,
      default: false
    },
    contractSignedAt: Date,
    currentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnboardingTask'
    }
  },
  
  // Badge e Achievement
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: Date,
    progress: {
      type: Number,
      default: 0
    }
  }],
  
  // Sistema di punti e token
  points: {
    type: Number,
    default: 0
  },
  tokens: {
    type: Number,
    default: 0
  },
  
  // Referral system
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Documenti
  documents: {
    idCard: String,
    taxCode: String,
    selfie: String,
    contract: String
  },
  
  // Statistiche
  stats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    ordersCount: {
      type: Number,
      default: 0
    },
    videosWatched: {
      type: Number,
      default: 0
    },
    quizzesPassed: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  lastLogin: Date,
  lastActivity: Date
}, {
  timestamps: true
});

// Hash password prima del salvataggio
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo per confrontare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Metodo per generare referral code
userSchema.methods.generateReferralCode = function() {
  return `${this.username.toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// Metodo per aggiungere esperienza e gestire livelli
userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  
  // Calcola se l'utente è salito di livello
  while (this.experience >= this.experienceToNextLevel) {
    this.experience -= this.experienceToNextLevel;
    this.level += 1;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5); // Aumenta del 50%
  }
  
  return this.save();
};

// Metodo per aggiornare punti
userSchema.methods.addPoints = function(points) {
  this.points += points;
  return this.save();
};

// Metodo per aggiornare token
userSchema.methods.addTokens = function(tokens) {
  this.tokens += tokens;
  return this.save();
};

// Metodo per aggiungere badge
userSchema.methods.addBadge = function(badgeId) {
  const existingBadge = this.badges.find(b => b.badgeId.toString() === badgeId.toString());
  if (!existingBadge) {
    this.badges.push({
      badgeId,
      earnedAt: new Date(),
      progress: 100
    });
  }
  return this.save();
};

// Metodo per completare task di onboarding
userSchema.methods.completeOnboardingTask = function(taskId, score = 100) {
  const existingTask = this.onboardingProgress.tasksCompleted.find(
    t => t.taskId.toString() === taskId.toString()
  );
  
  if (!existingTask) {
    this.onboardingProgress.tasksCompleted.push({
      taskId,
      completedAt: new Date(),
      score
    });
    
    this.stats.tasksCompleted += 1;
  }
  
  return this.save();
};

// Metodo per verificare se un task è completato
userSchema.methods.hasCompletedTask = function(taskId) {
  return this.onboardingProgress.tasksCompleted.some(
    t => t.taskId.toString() === taskId.toString()
  );
};

// Metodo per ottenere il progresso dell'onboarding
userSchema.methods.getOnboardingProgress = function() {
  const totalTasks = 10; // Numero totale di task (da configurare)
  const completedTasks = this.onboardingProgress.tasksCompleted.length;
  return Math.round((completedTasks / totalTasks) * 100);
};

// Metodo per verificare se l'onboarding è completo
userSchema.methods.isOnboardingComplete = function() {
  return this.onboardingLevel >= 5;
};

module.exports = mongoose.model('User', userSchema);