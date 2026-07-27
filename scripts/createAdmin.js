/**
 * One-off script: create (or update) the admin account used by the
 * protected dashboard endpoints.
 *
 *   npm run seed:admin
 *
 * Reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    logger.success('Connected to MongoDB.');

    const email = ADMIN_EMAIL.toLowerCase().trim();
    let user = await User.findOne({ email }).select('+password');

    if (user) {
      user.name = ADMIN_NAME || user.name;
      user.password = ADMIN_PASSWORD; // re-hashed by the pre-save hook
      await user.save();
      logger.success(`Admin password reset for ${email}`);
    } else {
      user = await User.create({ name: ADMIN_NAME || 'Portfolio Admin', email, password: ADMIN_PASSWORD });
      logger.success(`Admin created: ${email}`);
    }

    logger.info('Log in via POST /api/auth/login to get a JWT.');
    process.exit(0);
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
})();
