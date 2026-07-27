const express = require('express');
const { body, query } = require('express-validator');

const Order = require('../models/Order');
const { SERVICE_TYPES, BUDGET_RANGES, TIMELINES, ORDER_STATUS } = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, honeypot } = require('../middleware/validate');
const { orderLimiter } = require('../middleware/rateLimiter');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

/* GET /api/orders/options — public: dropdown values */
router.get('/options', (req, res) => {
  res.json({
    success: true,
    message: 'Order form options.',
    data: { serviceTypes: SERVICE_TYPES, budgets: BUDGET_RANGES, timelines: TIMELINES },
  });
});

/* ────────────────────────────────────────────────────────────
   POST /api/orders — public: submit a project order
   ──────────────────────────────────────────────────────────── */
router.post(
  '/',
  orderLimiter,
  honeypot('website'),
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.').escape(),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone number is too long.').escape(),
    body('serviceType').trim().isIn(SERVICE_TYPES).withMessage('Please choose a service type.'),
    body('projectTitle').trim().isLength({ min: 3, max: 140 }).withMessage('Project title must be 3–140 characters.').escape(),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20–5000 characters.'),
    body('budget').trim().isIn(BUDGET_RANGES).withMessage('Please choose a budget range.'),
    body('timeline').trim().isIn(TIMELINES).withMessage('Please choose a timeline.'),
    body('techPreference').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).escape(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const payload = (({ name, email, phone, serviceType, projectTitle, description, budget, timeline, techPreference }) => ({
      name,
      email,
      phone: phone || '',
      serviceType,
      projectTitle,
      description,
      budget,
      timeline,
      techPreference: techPreference || '',
    }))(req.body);

    const order = await Order.create({
      ...payload,
      meta: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    // ── No email sent — WhatsApp redirect handled on frontend ──

    res.status(201).json({
      success: true,
      message: `Order submitted! Your reference is ${order.reference}. You'll be redirected to WhatsApp to send the details.`,
      data: {
        id: order._id,
        reference: order.reference,
        status: order.status,
        createdAt: order.createdAt,
        // Send full order back so frontend can build WhatsApp message
        name: order.name,
        email: order.email,
        phone: order.phone,
        serviceType: order.serviceType,
        projectTitle: order.projectTitle,
        description: order.description,
        budget: order.budget,
        timeline: order.timeline,
        techPreference: order.techPreference,
      },
    });
  }),
);

/* ────────────────────────────────────────────────────────────
   GET /api/orders — admin: paginated + filterable list
   ──────────────────────────────────────────────────────────── */
router.get(
  '/',
  protect,
  requireRole('admin'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(ORDER_STATUS),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).trim(), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { projectTitle: rx }, { reference: rx }];
    }

    const [items, total, byStatus] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      message: total ? `${total} order(s) found.` : 'No orders yet.',
      data: items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        stats: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      },
    });
  }),
);

/* GET /api/orders/:id — admin: single order */
router.get(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }
    res.json({ success: true, message: 'Order fetched.', data: order });
  }),
);

/* PUT /api/orders/:id — admin: update status / note */
router.put(
  '/:id',
  protect,
  requireRole('admin'),
  [
    body('status').optional().isIn(ORDER_STATUS).withMessage(`Status must be one of: ${ORDER_STATUS.join(', ')}`),
    body('adminNote').optional().trim().isLength({ max: 2000 }),
    body('isRead').optional().isBoolean().toBoolean(),
    body('notifyClient').optional().isBoolean().toBoolean(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (req.body.status) order.status = req.body.status;
    if (req.body.adminNote !== undefined) order.adminNote = req.body.adminNote;
    if (req.body.isRead !== undefined) order.isRead = req.body.isRead;
    await order.save();

    res.json({ success: true, message: `Order updated to "${order.status}".`, data: order });
  }),
);

/* DELETE /api/orders/:id — admin */
router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }
    res.json({ success: true, message: 'Order deleted.' });
  }),
);

module.exports = router;