const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Image Storage ─────────────────────────────────────────── */
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'portfolio/projects/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1280, height: 800, crop: 'limit', quality: 'auto:good' },
    ],
    public_id: `project-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }),
});

/* ── Video Storage ─────────────────────────────────────────── */
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'portfolio/projects/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    transformation: [
      { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
    ],
    public_id: `project-vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }),
});

/* ── Thumbnail Storage ─────────────────────────────────────── */
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'portfolio/projects/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 500, crop: 'fill', quality: 'auto:good' },
    ],
    public_id: `project-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }),
});

/* ── Multer Upload Instances ───────────────────────────────── */
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for this field.'), false);
    }
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for this field.'), false);
    }
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnail.'), false);
    }
  },
});

/* ── Combined Upload (thumbnail + images + video) ──────────── */
const uploadProjectMedia = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder: isVideo
          ? 'portfolio/projects/videos'
          : 'portfolio/projects/images',
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: isVideo
          ? ['mp4', 'webm', 'mov']
          : ['jpg', 'jpeg', 'png', 'webp'],
        transformation: isVideo
          ? [{ width: 1280, height: 720, crop: 'limit', quality: 'auto' }]
          : [{ width: 1280, height: 800, crop: 'limit', quality: 'auto:good' }],
        public_id: `project-${isVideo ? 'vid' : 'img'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed.'), false);
    }
  },
});

/* ── Delete from Cloudinary ────────────────────────────────── */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

/* ── Extract public_id from Cloudinary URL ─────────────────── */
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return null;
    // Skip version segment if present (v1234567890)
    const startIndex = parts[uploadIndex + 1]?.match(/^v\d+$/)
      ? uploadIndex + 2
      : uploadIndex + 1;
    const pathWithExt = parts.slice(startIndex).join('/');
    return pathWithExt.replace(/\.[^/.]+$/, ''); // remove extension
  } catch {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadThumbnail,
  uploadProjectMedia,
  deleteFromCloudinary,
  extractPublicId,
};