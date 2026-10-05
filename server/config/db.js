const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elwo_music';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[ELWO DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[ELWO DB] MongoDB connection warning: ${err.message}. Running in resilient dev mode.`);
    isConnected = false;
  }
};

const getDBStatus = () => {
  return isConnected ? 'HEALTHY' : 'WARNING';
};

module.exports = { connectDB, getDBStatus };
