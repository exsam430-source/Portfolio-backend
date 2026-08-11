const mongoose = require('mongoose');

const PROJECT_CATEGORIES = [
  'fullstack',
  'frontend',
  'backend',
  'ecommerce',
  'management',
  'mobile',
  'other',
];

const PROJECT_STATUS = ['published', 'draft', 'archived'];

/* ── Media sub-document ────────────────────────────────────── */
const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    caption: { type: String, trim: true, maxlength: 200, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

/* ── Main Project schema ───────────────────────────────────── */
const projectSchema = new mongoose.Schema(
  {
    /* Identity */
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
      default: '',
    },

    /* Categorisation */
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: PROJECT_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    status: {
      type: String,
      enum: PROJECT_STATUS,
      default: 'published',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    live: { type: Boolean, default: false },
    year: {
      type: String,
      default: () => new Date().getFullYear().toString(),
    },

    /* Content */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Maximum 20 features allowed',
      },
    },
    tech: {
      type: [String],
      required: [true, 'At least one technology is required'],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 30,
        message: 'Please provide 1–30 technologies',
      },
    },
    challenges: {
      type: String,
      trim: true,
      maxlength: [2000],
      default: '',
    },
    outcome: {
      type: String,
      trim: true,
      maxlength: [2000],
      default: '',
    },

    /* Media */
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    images: { type: [mediaSchema], default: [] },
    demoVideo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    /* Links */
    liveUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },

    /* Styling */
    accentFrom: { type: String, default: '#3B82F6' },
    accentTo: { type: String, default: '#8B5CF6' },

    /* Ordering */
    sortOrder: { type: Number, default: 0, index: true },

    /* Stats */
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ── Indexes ───────────────────────────────────────────────── */
projectSchema.index({ status: 1, featured: -1, sortOrder: 1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ createdAt: -1 });

/* ── Auto-generate slug from title ────────────────────────── */
projectSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    // Add suffix to prevent duplicates on same-title projects
    this.slug += `-${Date.now().toString(36)}`;
  }
  next();
});

/* ── Auto-generate shortDescription ───────────────────────── */
projectSchema.pre('save', function generateShortDesc(next) {
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.slice(0, 180).trim() + (this.description.length > 180 ? '…' : '');
  }
  next();
});

/* ── Virtual: accent array (matches frontend format) ──────── */
projectSchema.virtual('accent').get(function () {
  return [this.accentFrom, this.accentTo];
});

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_CATEGORIES = PROJECT_CATEGORIES;
module.exports.PROJECT_STATUS = PROJECT_STATUS;