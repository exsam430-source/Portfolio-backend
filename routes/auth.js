const express = require('express');
const { body } = require('express-validator');

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect, signToken } = require('../middleware/auth');

const router = express.Router();

/* POST /api/auth/login — admin sign-in, returns a JWT */
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');

    if (!user || !(await user.comparePassword(req.body.password))) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}.`,
      data: {
        token: signToken(user),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  }),
);

/* GET /api/auth/me — verify the current token */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Authenticated.',
      data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
    });
  }),
);

module.exports = router;
