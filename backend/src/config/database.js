const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-attendance';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
