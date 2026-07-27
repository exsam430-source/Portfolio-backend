const rateLimit = require('express-rate-limit');

const json = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

/** Broad protection for the whole /api surface. */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many requests from this IP. Please try again in a few minutes.'),
});

/** Contact form — spam is the main risk here. */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('You have sent several messages already. Please try again later.'),
});

/** Project orders — slightly stricter, these trigger two emails each. */
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many project requests submitted. Please try again in an hour.'),
});

/** Newsletter subscribe/unsubscribe. */
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many subscription attempts. Please try again later.'),
});

/** Login brute-force protection. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json('Too many login attempts. Please try again in 15 minutes.'),
});

module.exports = { globalLimiter, contactLimiter, orderLimiter, subscribeLimiter, authLimiter };
