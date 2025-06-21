const mongoose = require('mongoose');

const onboardingTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'action', 'purchase', 'referral'],
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  order: {
    type: Number,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isBlocking: {
    type: Boolean,
    default: false // Se true, blocca il passaggio al livello successivo
  },
  requirements: {
    videoId: String,
    documentType: String,
    quizQuestions: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }],
    actionType: String,
    minimumAmount: Number
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    tokens: {
      type: Number,
      default: 0
    },
    experience: {
      type: Number,
      default: 0
    },
    badges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    }]
  },
  estimatedTime: {
    type: Number, // in minuti
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OnboardingTask', onboardingTaskSchema); 