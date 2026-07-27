const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB (Atlas or local) with sane production defaults.
 *
 * The server does NOT hard-crash when the DB is unreachable in development —
 * it retries with exponential backoff so `npm run dev` stays usable while you
 * are still setting up Atlas. In production a failed connection exits the
 * process so the orchestrator (PM2 / Render / Railway) can restart it.
 */
let retries = 0;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return null;
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    retries = 0;
    logger.success(`MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    if (process.env.NODE_ENV === 'production') process.exit(1);

    retries += 1;
    const delay = Math.min(30000, 2000 * retries);
    logger.warn(`Retrying MongoDB connection in ${delay / 1000}s (attempt ${retries})…`);
    setTimeout(connectDB, delay);
    return null;
  }
};

/* Connection lifecycle logging — helps debugging Atlas IP-whitelist issues. */
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));
mongoose.connection.on('reconnected', () => logger.success('MongoDB reconnected.'));

module.exports = connectDB;
