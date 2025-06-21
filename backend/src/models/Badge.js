const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['onboarding', 'sales', 'referral', 'achievement', 'special'],
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  requirements: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema); 