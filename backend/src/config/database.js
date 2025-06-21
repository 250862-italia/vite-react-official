const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wash-the-world', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB connesso: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 