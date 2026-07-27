const express = require('express');
const { body, query } = require('express-validator');

const Subscriber = require('../models/Subscriber');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, honeypot } = require('../middleware/validate');
const { subscribeLimiter } = require('../middleware/rateLimiter');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

const unsubscribeLink = (token) =>
  `${(process.env.SITE_URL || '').replace(/\/$/, '')}/unsubscribe?token=${token}`;

/* GET /api/subscribe/count — public: subscriber count for the UI badge */
router.get(
  '/count',
  asyncHandler(async (req, res) => {
    const count = await Subscriber.countDocuments({ isActive: true });
    res.json({ success: true, message: 'Subscriber count.', data: { count } });
  }),
);

/* ────────────────────────────────────────────────────────────
   POST /api/subscribe — public: join the newsletter
   ──────────────────────────────────────────────────────────── */
router.post(
  '/',
  subscribeLimiter,
  honeypot('website'),
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('source').optional().trim().isLength({ max: 40 }).escape(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const { email, source } = req.body;
    const existing = await Subscriber.findOne({ email });

    /* Already an active subscriber → idempotent friendly response. */
    if (existing && existing.isActive) {
      return res.status(200).json({
        success: true,
        message: "You're already subscribed — thanks for sticking around!",
        data: { email: existing.email, alreadySubscribed: true },
      });
    }

    /* Previously unsubscribed → reactivate instead of duplicating. */
    if (existing && !existing.isActive) {
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      await existing.save();

      Promise.allSettled([
        sendEmail({
          to: existing.email,
          subject: 'Welcome back to the newsletter 🎯',
          html: templates.subscriberWelcome(existing, unsubscribeLink(existing.unsubscribeToken)),
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.',
        data: { email: existing.email, reactivated: true },
      });
    }

    const subscriber = await Subscriber.create({
      email,
      source: source || 'website',
      meta: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    Promise.allSettled([
      sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_FROM,
        subject: `🔔 New subscriber: ${subscriber.email}`,
        html: templates.subscriberAdmin(subscriber),
      }),
      sendEmail({
        to: subscriber.email,
        subject: "You're subscribed 🎯",
        html: templates.subscriberWelcome(subscriber, unsubscribeLink(subscriber.unsubscribeToken)),
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Subscribed! Check your inbox for a welcome email.',
      data: { email: subscriber.email },
    });
  }),
);

/* ────────────────────────────────────────────────────────────
   DELETE /api/subscribe — public: unsubscribe by email or token
   ──────────────────────────────────────────────────────────── */
router.delete(
  '/',
  subscribeLimiter,
  [
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('token').optional().trim().isLength({ min: 10, max: 128 }),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const { email, token } = req.body;
    if (!email && !token) {
      res.status(400);
      throw new Error('Provide an email address or an unsubscribe token.');
    }

    const subscriber = await Subscriber.findOne(token ? { unsubscribeToken: token } : { email });
    if (!subscriber) {
      res.status(404);
      throw new Error('That email is not on the subscriber list.');
    }

    if (!subscriber.isActive) {
      return res.json({ success: true, message: 'You are already unsubscribed.' });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return res.json({ success: true, message: 'You have been unsubscribed. Sorry to see you go!' });
  }),
);

/* GET /api/subscribe/unsubscribe?token=… — one-click link from emails */
router.get(
  '/unsubscribe',
  [query('token').trim().isLength({ min: 10, max: 128 }), validate],
  asyncHandler(async (req, res) => {
    const subscriber = await Subscriber.findOne({ unsubscribeToken: req.query.token });
    if (!subscriber) {
      res.status(404);
      throw new Error('Invalid unsubscribe link.');
    }
    if (subscriber.isActive) {
      subscriber.isActive = false;
      subscriber.unsubscribedAt = new Date();
      await subscriber.save();
    }
    res.json({ success: true, message: 'You have been unsubscribed.' });
  }),
);

/* ────────────────────────────────────────────────────────────
   GET /api/subscribe/all (aliased as /api/subscribers) — admin
   ──────────────────────────────────────────────────────────── */
const listSubscribers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [items, total, active] = await Promise.all([
    Subscriber.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Subscriber.countDocuments(filter),
    Subscriber.countDocuments({ isActive: true }),
  ]);

  res.json({
    success: true,
    message: total ? `${total} subscriber(s) found.` : 'No subscribers yet.',
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1, active },
  });
});

router.get('/all', protect, requireRole('admin'), listSubscribers);

module.exports = router;
module.exports.listSubscribers = listSubscribers;
