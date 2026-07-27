const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Newsletter subscriber. Re-subscribing an inactive email re-activates the
 * existing document instead of creating a duplicate (see routes/subscribe.js).
 */
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email address'],
    },
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, default: 'website', trim: true },
    unsubscribeToken: { type: String, index: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
    meta: {
      ip: { type: String, select: false },
      userAgent: { type: String, select: false },
    },
  },
  { timestamps: true, versionKey: false },
);

subscriberSchema.pre('validate', function generateToken(next) {
  if (!this.unsubscribeToken) this.unsubscribeToken = crypto.randomBytes(24).toString('hex');
  next();
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
