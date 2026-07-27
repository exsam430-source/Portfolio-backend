const logger = require('../utils/logger');

/** 404 handler — runs when no route matched. */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Centralised error handler. Always returns the same JSON envelope:
 * { success:false, message:string, errors?:[{field,message}] }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode >= 400 ? err.statusCode || res.statusCode : 500;
  let message = err.message || 'Something went wrong on the server.';
  let errors;

  /* Mongoose: invalid ObjectId */
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  /* Mongoose: schema validation */
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed. Please check the highlighted fields.';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  /* Mongo: duplicate key */
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { value: 'value' })[0];
    message = `That ${field} is already registered.`;
    errors = [{ field, message }];
  }

  /* JWT */
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please sign in again.';
  }

  /* Bad JSON body */
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} :: ${err.stack || err.message}`);
  else logger.warn(`${req.method} ${req.originalUrl} :: ${statusCode} ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

/** Wrap async route handlers so rejected promises reach errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
