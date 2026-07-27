const { validationResult } = require('express-validator');

/**
 * Collects express-validator errors into the standard API envelope.
 * Mount it as the last item of a route's validation chain.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(422).json({
    success: false,
    message: 'Validation failed. Please check the highlighted fields.',
    errors: result.array().map((e) => ({ field: e.path || e.param, message: e.msg })),
  });
};

/** Rejects submissions where the hidden honeypot field was filled (bots). */
const honeypot = (field = 'website') => (req, res, next) => {
  if (req.body && String(req.body[field] || '').trim() !== '') {
    // Pretend everything is fine so bots don't learn the trap exists.
    return res.status(200).json({ success: true, message: 'Submission received.' });
  }
  return next();
};

module.exports = { validate, honeypot };
