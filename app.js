const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const { protect, requireRole } = require('./middleware/auth');
const { smtpConfigured } = require('./utils/sendEmail');

const contactRoutes = require('./routes/contact');
const orderRoutes = require('./routes/orders');
const subscribeRoutes = require('./routes/subscribe');
const authRoutes = require('./routes/auth');

const app = express();

/* Trust the first proxy (Render/Railway/Nginx) so req.ip and rate limiting work. */
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ── Security ─────────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // API only; the SPA sets its own CSP
  }),
);

/* CORS — comma separated allow-list from CLIENT_URL. */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server / curl / Postman (no Origin header).
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(clean) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

/* ── Parsing & performance ────────────────────────────────── */
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(mongoSanitize()); // strips $ and . from keys → blocks NoSQL injection
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* ── Health & meta ────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio API is running.',
    docs: '/api/health',
    version: require('./package.json').version,
  });
});

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'OK',
    data: {
      uptime: Math.round(process.uptime()),
      env: process.env.NODE_ENV || 'development',
      database: states[mongoose.connection.readyState] || 'unknown',
      email: smtpConfigured() ? 'configured' : 'log-only',
      timestamp: new Date().toISOString(),
    },
  });
});

/* ── API routes ───────────────────────────────────────────── */
app.use('/api', globalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscribe', subscribeRoutes);

/* Spec alias: GET /api/subscribers → admin subscriber list */
app.get('/api/subscribers', protect, requireRole('admin'), subscribeRoutes.listSubscribers);

/* ── Optional: serve the built SPA in production ──────────── */
if (process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

/* ── Errors ───────────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
