const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./errorHandler');

/** Issue a signed JWT for an admin user. */
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Protect admin routes. Accepts `Authorization: Bearer <token>`.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    res.status(401);
    throw new Error('Not authorised — admin token missing.');
  }

  if (!process.env.JWT_SECRET) {
    res.status(500);
    throw new Error('JWT_SECRET is not configured on the server.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error('Admin account no longer exists.');
  }

  req.user = user;
  next();
});

/** Role gate (kept generic in case more roles are added later). */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('You do not have permission to perform this action.'));
    }
    return next();
  };

module.exports = { protect, requireRole, signToken };
