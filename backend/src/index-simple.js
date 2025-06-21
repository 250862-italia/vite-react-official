const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware di sicurezza
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite per IP
  message: {
    error: 'Troppe richieste da questo IP, riprova più tardi.'
  }
});
app.use(limiter);

// Middleware per parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dati temporanei in memoria - SISTEMA COMPLETO
const users = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    level: 1,
    experience: 0,
    points: 100,
    tokens: 50,
    onboardingLevel: 0,
    badges: [],
    role: 'entry_ambassador',
    commissionRate: 0.05, // 5% per Entry Ambassador
    totalSales: 0,
    totalCommissions: 0,
    referralCode: 'MARIO001',
    referredBy: null,
    wallet: {
      balance: 0,
      transactions: []
    }
  }
];

// PRODOTTI ECOMMERCE
const products = [
  {
    id: 1,
    name: 'Kit Lavaggio Auto Premium',
    description: 'Kit completo per lavaggio professionale dell\'auto',
    price: 49.99,
    originalPrice: 69.99,
    category: 'auto',
    image: '/images/product-1.jpg',
    stock: 100,
    commission: 0.10, // 10% commissione
    tags: ['bestseller', 'premium'],
    features: ['Shampoo professionale', 'Cera protettiva', 'Panno microfibra']
  },
  {
    id: 2,
    name: 'Detergente Multiuso Eco',
    description: 'Detergente ecologico per tutte le superfici',
    price: 19.99,
    originalPrice: 24.99,
    category: 'home',
    image: '/images/product-2.jpg',
    stock: 150,
    commission: 0.08, // 8% commissione
    tags: ['eco-friendly', 'multiuso'],
    features: ['100% biodegradabile', 'Senza fosfati', 'Concentrato']
  },
  {
    id: 3,
    name: 'Set Pulizia Casa Completo',
    description: 'Set completo per la pulizia della casa',
    price: 89.99,
    originalPrice: 119.99,
    category: 'home',
    image: '/images/product-3.jpg',
    stock: 50,
    commission: 0.12, // 12% commissione
    tags: ['completo', 'casa'],
    features: ['5 prodotti inclusi', 'Borsa portaoggetti', 'Guanti inclusi']
  },
  {
    id: 4,
    name: 'Lavaggio Auto Mobile',
    description: 'Servizio di lavaggio auto a domicilio',
    price: 29.99,
    originalPrice: 39.99,
    category: 'service',
    image: '/images/product-4.jpg',
    stock: -1, // Servizio illimitato
    commission: 0.15, // 15% commissione
    tags: ['servizio', 'mobile'],
    features: ['A domicilio', 'Professionale', 'Garanzia soddisfatti']
  }
];

// ORDINI
const orders = [
  {
    id: 1,
    userId: 1,
    products: [
      { productId: 1, quantity: 2, price: 49.99, commission: 0.10 }
    ],
    total: 99.98,
    subtotal: 99.98,
    shipping: 0,
    tax: 22.00,
    commission: 9.99,
    status: 'completed',
    createdAt: '2024-06-18T10:00:00Z',
    paymentMethod: 'card',
    shippingAddress: {
      street: 'Via Roma 123',
      city: 'Milano',
      zip: '20100',
      country: 'Italia'
    }
  }
];

// VENDITE E COMMISSIONI
const sales = [
  {
    id: 1,
    orderId: 1,
    userId: 1,
    productId: 1,
    quantity: 2,
    unitPrice: 49.99,
    totalPrice: 99.98,
    commission: 9.99,
    commissionRate: 0.10,
    date: '2024-06-18T10:00:00Z',
    status: 'paid'
  }
];

// TASKS ONBOARDING
const tasks = [
  {
    id: 1,
    title: 'Benvenuto in Wash The World',
    description: 'Guarda il video di benvenuto',
    type: 'video',
    level: 1,
    order: 1,
    rewards: { points: 25, tokens: 5, experience: 15 }
  },
  {
    id: 2,
    title: 'Quiz: Conosci Wash The World?',
    description: 'Testa la tua conoscenza',
    type: 'quiz',
    level: 1,
    order: 2,
    rewards: { points: 50, tokens: 10, experience: 25 }
  }
];

// BADGES
const badges = [
  {
    id: 1,
    name: 'Primo Passo',
    description: 'Completa il primo task',
    icon: '🎯',
    category: 'onboarding',
    level: 1
  },
  {
    id: 2,
    name: 'Studente Diligente',
    description: 'Guarda 3 video',
    icon: '📚',
    category: 'onboarding',
    level: 1
  }
];

// Routes semplificate

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development-simple'
  });
});

// Route di default
app.get('/', (req, res) => {
  res.json({
    message: '🌊 Wash The World Backend API (Simple Mode)',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      onboarding: '/api/onboarding',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      sales: '/api/sales'
    }
  });
});

// ===== ECOMMERCE ROUTES =====

// GET tutti i prodotti
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: products,
    total: products.length
  });
});

// GET prodotto specifico
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Prodotto non trovato'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// POST nuovo ordine
app.post('/api/orders', (req, res) => {
  const { userId, products: orderProducts, shippingAddress, paymentMethod } = req.body;
  
  // Calcola totali
  let subtotal = 0;
  let totalCommission = 0;
  
  orderProducts.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      subtotal += product.price * item.quantity;
      totalCommission += (product.price * item.quantity * product.commission);
    }
  });
  
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.22; // 22% IVA
  const total = subtotal + shipping + tax;
  
  const newOrder = {
    id: orders.length + 1,
    userId: parseInt(userId),
    products: orderProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        commission: product.commission
      };
    }),
    total,
    subtotal,
    shipping,
    tax,
    commission: totalCommission,
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentMethod,
    shippingAddress
  };
  
  orders.push(newOrder);
  
  // Crea vendite per commissioni
  orderProducts.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const sale = {
        id: sales.length + 1,
        orderId: newOrder.id,
        userId: parseInt(userId),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
        commission: product.price * item.quantity * product.commission,
        commissionRate: product.commission,
        date: new Date().toISOString(),
        status: 'pending'
      };
      sales.push(sale);
    }
  });
  
  res.json({
    success: true,
    message: 'Ordine creato con successo',
    data: newOrder
  });
});

// GET ordini utente
app.get('/api/orders/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userOrders = orders.filter(o => o.userId === userId);
  
  res.json({
    success: true,
    data: userOrders,
    total: userOrders.length
  });
});

// GET vendite utente (per commissioni)
app.get('/api/sales/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userSales = sales.filter(s => s.userId === userId);
  
  const totalSales = userSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalCommissions = userSales.reduce((sum, sale) => sum + sale.commission, 0);
  
  res.json({
    success: true,
    data: {
      sales: userSales,
      stats: {
        totalSales,
        totalCommissions,
        totalOrders: userSales.length,
        averageOrderValue: userSales.length > 0 ? totalSales / userSales.length : 0
      }
    }
  });
});

// POST conferma pagamento ordine
app.post('/api/orders/:orderId/confirm', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Ordine non trovato'
    });
  }
  
  order.status = 'completed';
  
  // Aggiorna vendite
  const orderSales = sales.filter(s => s.orderId === orderId);
  orderSales.forEach(sale => {
    sale.status = 'paid';
  });
  
  // Aggiorna utente con commissioni
  const user = users.find(u => u.id === order.userId);
  if (user) {
    user.totalSales += order.subtotal;
    user.totalCommissions += order.commission;
    user.wallet.balance += order.commission;
    user.wallet.transactions.push({
      id: user.wallet.transactions.length + 1,
      type: 'commission',
      amount: order.commission,
      description: `Commissione ordine #${orderId}`,
      date: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    message: 'Ordine confermato e commissioni accreditate',
    data: {
      order,
      commissionEarned: order.commission
    }
  });
});

// ===== AUTH ROUTES =====

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'testuser' && password === 'password') {
    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: users[0],
        token: 'fake-jwt-token-123'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Credenziali non valide'
    });
  }
});

// Endpoint per verificare lo stato dell'autenticazione
app.get('/api/auth/me', (req, res) => {
  // Per semplicità, restituiamo sempre l'utente test
  // In produzione, verificheresti il token JWT
  res.json({
    success: true,
    data: {
      user: users[0]
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    firstName,
    lastName,
    level: 1,
    experience: 0,
    points: 0,
    tokens: 0,
    onboardingLevel: 0,
    badges: [],
    role: 'entry_ambassador',
    commissionRate: 0.05,
    totalSales: 0,
    totalCommissions: 0,
    referralCode: `${firstName.toUpperCase()}${users.length + 1}`,
    referredBy: null,
    wallet: {
      balance: 0,
      transactions: []
    }
  };
  
  users.push(newUser);
  
  res.json({
    success: true,
    message: 'Registrazione effettuata con successo',
    data: {
      user: newUser,
      token: 'fake-jwt-token-456'
    }
  });
});

// ===== ONBOARDING ROUTES =====

app.get('/api/onboarding/dashboard', (req, res) => {
  const user = users[0]; // Usa il primo utente per test
  
  res.json({
    success: true,
    data: {
      user: {
        level: user.level,
        experience: user.experience,
        experienceToNextLevel: 100,
        onboardingLevel: user.onboardingLevel,
        points: user.points,
        tokens: user.tokens,
        totalSales: user.totalSales,
        totalCommissions: user.totalCommissions,
        wallet: user.wallet
      },
      progress: {
        percentage: 20,
        completedTasks: 2,
        totalTasks: 10,
        currentTask: tasks[0]
      },
      availableTasks: tasks,
      completedTasks: [],
      badges: user.badges,
      availableBadges: badges,
      isOnboardingComplete: false
    }
  });
});

// Endpoint per ottenere un task specifico
app.get('/api/onboarding/tasks/:taskId', (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task non trovato'
    });
  }
  
  res.json({
    success: true,
    data: task
  });
});

// ===== AMBASSADOR ROUTES =====

// GET dashboard ambassador
app.get('/api/ambassador/dashboard', (req, res) => {
  const user = users[0];
  const userSales = sales.filter(s => s.userId === user.id);
  const userOrders = orders.filter(o => o.userId === user.id);
  
  const totalSales = userSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalCommissions = userSales.reduce((sum, sale) => sum + sale.commission, 0);
  
  res.json({
    success: true,
    data: {
      user: {
        ...user,
        totalSales,
        totalCommissions
      },
      stats: {
        totalSales,
        totalCommissions,
        totalOrders: userOrders.length,
        averageOrderValue: userOrders.length > 0 ? totalSales / userOrders.length : 0,
        commissionRate: user.commissionRate * 100
      },
      recentSales: userSales.slice(-5),
      recentOrders: userOrders.slice(-5),
      topProducts: products.slice(0, 3)
    }
  });
});

// POST upgrade a MLM Ambassador
app.post('/api/ambassador/upgrade', (req, res) => {
  const user = users[0];
  
  if (user.role === 'mlm_ambassador') {
    return res.status(400).json({
      success: false,
      error: 'Sei già un MLM Ambassador'
    });
  }
  
  // Simula upgrade
  user.role = 'mlm_ambassador';
  user.commissionRate = 0.08; // 8% per MLM
  user.points += 500;
  user.tokens += 100;
  
  console.log(`🔓 Upgrade MLM completato per ${user.email}: Entry → MLM Ambassador`);
  
  res.json({
    success: true,
    message: 'Upgrade a MLM Ambassador completato!',
    data: {
      user,
      rewards: {
        points: 500,
        tokens: 100,
        newCommissionRate: '8%'
      }
    }
  });
});

// ===== BADGES ROUTES =====

app.get('/api/badges', (req, res) => {
  const user = users[0];
  
  const userBadges = badges.map(badge => ({
    ...badge,
    unlocked: Math.random() > 0.5, // Simula badge sbloccati
    unlockedAt: Math.random() > 0.5 ? new Date().toISOString() : null,
    rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)]
  }));
  
  res.json({
    success: true,
    data: userBadges
  });
});

// ===== WALLET ROUTES =====

app.get('/api/wallet/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utente non trovato'
    });
  }
  
  res.json({
    success: true,
    data: user.wallet
  });
});

// Avvia il server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server semplice avviato sulla porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🧪 Modalità test - Database in memoria`);
  console.log(`👤 Utente test: testuser / password`);
  console.log(`🛒 Ecommerce: ${products.length} prodotti disponibili`);
  console.log(`💰 Sistema commissioni attivo`);
}); 