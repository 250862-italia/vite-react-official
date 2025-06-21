const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Informazioni base prodotto
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  
  // Prezzi e disponibilità
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  
  // Categorie e tag
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Immagini
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Specifiche prodotto
  specifications: [{
    name: String,
    value: String
  }],
  
  // SEO
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  // Stato e visibilità
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Statistiche
  viewCount: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  },
  
  // Commissioni MLM
  mlmCommission: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
  }
}, {
  timestamps: true
});

// Indici per performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ createdAt: -1 });

// Virtual per calcolo margine
productSchema.virtual('margin').get(function() {
  if (this.costPrice && this.price) {
    return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
  }
  return 0;
});

// Virtual per calcolo sconto
productSchema.virtual('discount').get(function() {
  if (this.comparePrice && this.price) {
    return ((this.comparePrice - this.price) / this.comparePrice * 100).toFixed(2);
  }
  return 0;
});

// Pre-save middleware per generare slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Metodo per aggiornare stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else if (operation === 'increase') {
    this.stockQuantity += quantity;
  }
  return this.save();
};

// Metodo per incrementare vendite
productSchema.methods.incrementSold = function(quantity = 1) {
  this.soldCount += quantity;
  return this.save();
};

// Metodo per incrementare visualizzazioni
productSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Metodo statico per prodotti in esaurimento
productSchema.statics.getLowStock = function() {
  return this.find({
    stockQuantity: { $lte: '$lowStockThreshold' },
    isActive: true
  });
};

// Metodo statico per prodotti più venduti
productSchema.statics.getBestSellers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ soldCount: -1 })
    .limit(limit);
};

// Metodo statico per prodotti in evidenza
productSchema.statics.getFeatured = function() {
  return this.find({ 
    isActive: true, 
    isFeatured: true 
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Product', productSchema); 