const express = require('express');
const { body, query, param } = require('express-validator');

const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { protect, requireRole } = require('../middleware/auth');
const {
  uploadProjectMedia,
  deleteFromCloudinary,
  extractPublicId,
} = require('../config/cloudinary');

const router = express.Router();

/* ════════════════════════════════════════════════════════════
   PUBLIC ROUTES
   ════════════════════════════════════════════════════════════ */

/* GET /api/projects — public: all published projects */
router.get(
  '/',
  [
    query('category').optional().trim().isLength({ max: 40 }),
    query('featured').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const filter = { status: 'published' };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    if (typeof req.query.featured === 'boolean') {
      filter.featured = req.query.featured;
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 50;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean({ virtuals: true }),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: total ? `${total} project(s) found.` : 'No projects yet.',
      data: projects,
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  }),
);

/* GET /api/projects/:slug — public: single project by slug */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const project = await Project.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true, lean: { virtuals: true } },
    );

    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    res.json({ success: true, message: 'Project found.', data: project });
  }),
);

/* ════════════════════════════════════════════════════════════
   ADMIN ROUTES — all protected
   ════════════════════════════════════════════════════════════ */

/* GET /api/projects/admin/all — admin: all projects regardless of status */
router.get(
  '/admin/all',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).trim(), 'i');
      filter.$or = [{ title: rx }, { tagline: rx }, { description: rx }];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean({ virtuals: true }),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: `${total} project(s) found.`,
      data: projects,
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  }),
);

/* POST /api/projects — admin: create project with media */
router.post(
  '/',
  protect,
  requireRole('admin'),
  uploadProjectMedia.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'demoVideo', maxCount: 1 },
  ]),
  [
    body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Title must be 2–120 characters.'),
    body('tagline').optional().trim().isLength({ max: 200 }),
    body('category')
      .trim()
      .isIn(['fullstack', 'frontend', 'backend', 'ecommerce', 'management', 'mobile', 'other'])
      .withMessage('Invalid category.'),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20–5000 characters.'),
    body('tech').notEmpty().withMessage('Tech stack is required.'),
    body('liveUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Live URL must be a valid URL.'),
    body('githubUrl').optional({ checkFalsy: true }).trim(),
    body('featured').optional().isBoolean().toBoolean(),
    body('live').optional().isBoolean().toBoolean(),
    body('status').optional().isIn(['published', 'draft', 'archived']),
    body('accentFrom').optional().trim().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex colour.'),
    body('accentTo').optional().trim().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex colour.'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const {
      title, tagline, category, description, shortDescription,
      features, tech, challenges, outcome,
      liveUrl, githubUrl, featured, live, status,
      accentFrom, accentTo, sortOrder, year,
    } = req.body;

    /* Parse JSON arrays sent as strings from FormData */
    const parsedTech = typeof tech === 'string' ? JSON.parse(tech) : tech;
    const parsedFeatures =
      features
        ? typeof features === 'string'
          ? JSON.parse(features)
          : features
        : [];

    /* Build media objects from Cloudinary-uploaded files */
    const thumbnail = req.files?.thumbnail?.[0]
      ? { url: req.files.thumbnail[0].path, publicId: req.files.thumbnail[0].filename }
      : { url: '', publicId: '' };

    const images = (req.files?.images || []).map((f, i) => ({
      url: f.path,
      publicId: f.filename,
      type: 'image',
      order: i,
    }));

    const demoVideo = req.files?.demoVideo?.[0]
      ? { url: req.files.demoVideo[0].path, publicId: req.files.demoVideo[0].filename }
      : { url: '', publicId: '' };

    const project = await Project.create({
      title,
      tagline,
      category,
      description,
      shortDescription,
      features: parsedFeatures,
      tech: parsedTech,
      challenges,
      outcome,
      liveUrl: liveUrl || '',
      githubUrl: githubUrl || '',
      featured: featured || false,
      live: live || false,
      status: status || 'published',
      accentFrom: accentFrom || '#3B82F6',
      accentTo: accentTo || '#8B5CF6',
      sortOrder: sortOrder || 0,
      year: year || new Date().getFullYear().toString(),
      thumbnail,
      images,
      demoVideo,
    });

    res.status(201).json({
      success: true,
      message: `Project "${project.title}" created successfully.`,
      data: project,
    });
  }),
);

/* PUT /api/projects/:id — admin: update project */
router.put(
  '/:id',
  protect,
  requireRole('admin'),
  uploadProjectMedia.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'demoVideo', maxCount: 1 },
  ]),
  [
    param('id').isMongoId().withMessage('Invalid project ID.'),
    body('title').optional().trim().isLength({ min: 2, max: 120 }),
    body('category').optional().isIn(['fullstack', 'frontend', 'backend', 'ecommerce', 'management', 'mobile', 'other']),
    body('description').optional().trim().isLength({ min: 20, max: 5000 }),
    body('liveUrl').optional({ checkFalsy: true }).trim().isURL(),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    const updates = { ...req.body };

    /* Parse JSON strings from FormData */
    if (updates.tech && typeof updates.tech === 'string') {
      updates.tech = JSON.parse(updates.tech);
    }
    if (updates.features && typeof updates.features === 'string') {
      updates.features = JSON.parse(updates.features);
    }

    /* Handle new thumbnail upload */
    if (req.files?.thumbnail?.[0]) {
      /* Delete old thumbnail from Cloudinary */
      if (project.thumbnail?.publicId) {
        await deleteFromCloudinary(project.thumbnail.publicId, 'image');
      }
      updates.thumbnail = {
        url: req.files.thumbnail[0].path,
        publicId: req.files.thumbnail[0].filename,
      };
    }

    /* Handle new images upload — append to existing */
    if (req.files?.images?.length) {
      const newImages = req.files.images.map((f, i) => ({
        url: f.path,
        publicId: f.filename,
        type: 'image',
        order: project.images.length + i,
      }));
      updates.images = [...project.images, ...newImages];
    }

    /* Handle new demo video upload */
    if (req.files?.demoVideo?.[0]) {
      if (project.demoVideo?.publicId) {
        await deleteFromCloudinary(project.demoVideo.publicId, 'video');
      }
      updates.demoVideo = {
        url: req.files.demoVideo[0].path,
        publicId: req.files.demoVideo[0].filename,
      };
    }

    /* Reset slug if title changed */
    if (updates.title && updates.title !== project.title) {
      updates.slug = undefined;
    }

    Object.assign(project, updates);
    await project.save();

    res.json({
      success: true,
      message: `Project "${project.title}" updated successfully.`,
      data: project,
    });
  }),
);

/* DELETE /api/projects/:id/image/:imageId — admin: remove one image */
router.delete(
  '/:id/image/:imageId',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    const image = project.images.id(req.params.imageId);
    if (!image) {
      res.status(404);
      throw new Error('Image not found.');
    }

    await deleteFromCloudinary(image.publicId, 'image');
    project.images.pull(req.params.imageId);
    await project.save();

    res.json({ success: true, message: 'Image removed.', data: project });
  }),
);

/* DELETE /api/projects/:id — admin: delete entire project */
router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    /* Clean up all Cloudinary assets */
    const deletePromises = [];

    if (project.thumbnail?.publicId) {
      deletePromises.push(deleteFromCloudinary(project.thumbnail.publicId, 'image'));
    }
    if (project.demoVideo?.publicId) {
      deletePromises.push(deleteFromCloudinary(project.demoVideo.publicId, 'video'));
    }
    project.images.forEach((img) => {
      if (img.publicId) {
        deletePromises.push(deleteFromCloudinary(img.publicId, 'image'));
      }
    });

    await Promise.allSettled(deletePromises);
    await project.deleteOne();

    res.json({
      success: true,
      message: `Project "${project.title}" deleted successfully.`,
    });
  }),
);

/* PATCH /api/projects/:id/toggle-featured — admin: quick featured toggle */
router.patch(
  '/:id/toggle-featured',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    project.featured = !project.featured;
    await project.save();

    res.json({
      success: true,
      message: `Project ${project.featured ? 'featured' : 'unfeatured'}.`,
      data: { featured: project.featured },
    });
  }),
);

/* PATCH /api/projects/:id/status — admin: change status */
router.patch(
  '/:id/status',
  protect,
  requireRole('admin'),
  [
    param('id').isMongoId(),
    body('status').isIn(['published', 'draft', 'archived']).withMessage('Invalid status.'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );

    if (!project) {
      res.status(404);
      throw new Error('Project not found.');
    }

    res.json({
      success: true,
      message: `Project status updated to "${project.status}".`,
      data: project,
    });
  }),
);

module.exports = router;