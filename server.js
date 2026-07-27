require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT) || 5000;

/* Crash-safety nets — log, then shut down gracefully. */
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.stack || err.message}`);
  process.exit(1);
});

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.success(`API listening on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`Health check → http://localhost:${PORT}/api/health`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason?.message || reason}`);
    server.close(() => process.exit(1));
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) =>
    process.on(signal, () => {
      logger.warn(`${signal} received — shutting down gracefully…`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    }),
  );
})();
