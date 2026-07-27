const mongoose = require('mongoose');

/**
 * Contact message submitted from the "Contact" section.
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email address'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [140, 'Subject cannot exceed 140 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    isRead: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false },
    /* Lightweight anti-abuse metadata (never exposed publicly). */
    meta: {
      ip: { type: String, select: false },
      userAgent: { type: String, select: false },
    },
  },
  { timestamps: true, versionKey: false },
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
