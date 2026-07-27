const express = require('express');
const { body, query } = require('express-validator');

const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, honeypot } = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimiter');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ────────────────────────────────────────────────────────────
   POST /api/contact — public: submit a contact message
   ──────────────────────────────────────────────────────────── */
router.post(
  '/',
  contactLimiter,
  honeypot('website'),
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.').escape(),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('subject').trim().isLength({ min: 3, max: 140 }).withMessage('Subject must be 3–140 characters.').escape(),
    body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message must be 10–4000 characters.'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      meta: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    /* Fire-and-forget emails: never block the response on SMTP. */
    Promise.allSettled([
      sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_FROM,
        subject: `📬 New message: ${subject}`,
        html: templates.contactAdmin(contact),
        replyTo: email,
      }),
      sendEmail({
        to: email,
        subject: 'Thanks for reaching out — I got your message',
        html: templates.contactAutoReply(contact),
      }),
    ]);

    res.status(201).json({
      success: true,
      message: "Message sent successfully! I'll get back to you within 24 hours.",
      data: { id: contact._id, createdAt: contact.createdAt },
    });
  }),
);

/* ────────────────────────────────────────────────────────────
   GET /api/contact — admin: paginated message list
   ──────────────────────────────────────────────────────────── */
router.get(
  '/',
  protect,
  requireRole('admin'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('isRead').optional().isBoolean().toBoolean(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const filter = {};
    if (typeof req.query.isRead === 'boolean') filter.isRead = req.query.isRead;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).trim(), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { subject: rx }];
    }

    const [items, total, unread] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Contact.countDocuments(filter),
      Contact.countDocuments({ isRead: false }),
    ]);

    res.json({
      success: true,
      message: total ? `${total} message(s) found.` : 'No messages yet.',
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1, unread },
    });
  }),
);

/* PATCH /api/contact/:id/read — admin: toggle read flag */
router.patch(
  '/:id/read',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: req.body.isRead !== false },
      { new: true },
    );
    if (!contact) {
      res.status(404);
      throw new Error('Message not found.');
    }
    res.json({ success: true, message: 'Message updated.', data: contact });
  }),
);

/* DELETE /api/contact/:id — admin */
router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      res.status(404);
      throw new Error('Message not found.');
    }
    res.json({ success: true, message: 'Message deleted.' });
  }),
);

module.exports = router;
