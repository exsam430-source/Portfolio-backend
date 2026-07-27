const mongoose = require('mongoose');

const SERVICE_TYPES = [
  'Full-Stack Web App',
  'Frontend Only',
  'Backend API',
  'E-Commerce Store',
  'Admin Dashboard',
  'Other',
];

const BUDGET_RANGES = [
  '$100 - $500',
  '$500 - $1000',
  '$1000 - $2000',
  '$2000 - $5000',
  '$5000+',
  'Discuss Later',
];

const TIMELINES = ['ASAP (1-2 weeks)', '1 Month', '2-3 Months', '3+ Months', 'Flexible'];

const ORDER_STATUS = ['pending', 'in-review', 'accepted', 'completed', 'rejected'];

/**
 * Project order submitted from the "Start Your Project" section.
 */
const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },

    name: {
      type: String,
      required: [true, 'Full name is required'],
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
    phone: { type: String, trim: true, maxlength: [30, 'Phone cannot exceed 30 characters'], default: '' },

    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      enum: { values: SERVICE_TYPES, message: '{VALUE} is not a supported service type' },
    },
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Project title must be at least 3 characters'],
      maxlength: [140, 'Project title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [20, 'Please describe the project in at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    budget: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: { values: BUDGET_RANGES, message: '{VALUE} is not a valid budget range' },
    },
    timeline: {
      type: String,
      required: [true, 'Timeline is required'],
      enum: { values: TIMELINES, message: '{VALUE} is not a valid timeline' },
    },
    techPreference: { type: String, trim: true, maxlength: [300], default: '' },

    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    adminNote: { type: String, trim: true, maxlength: [2000], default: '' },
    isRead: { type: Boolean, default: false },

    meta: {
      ip: { type: String, select: false },
      userAgent: { type: String, select: false },
    },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

/** Human-friendly reference like ORD-9F3K2A generated before validation. */
orderSchema.pre('validate', function generateReference(next) {
  if (!this.reference) {
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    const time = Date.now().toString(36).slice(-4).toUpperCase();
    this.reference = `ORD-${time}${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
module.exports.BUDGET_RANGES = BUDGET_RANGES;
module.exports.TIMELINES = TIMELINES;
module.exports.ORDER_STATUS = ORDER_STATUS;
