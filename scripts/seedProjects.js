/**
 * Seeds the database with portfolio projects.
 * Run: node scripts/seedProjects.js
 *
 * This will:
 * 1. Connect to MongoDB
 * 2. Delete all existing projects
 * 3. Insert all projects from the portfolio data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Project = require('../models/Project');
const logger = require('../utils/logger');

const projects = [
  {
    title: 'RB Jewellers',
    slug: 'rb-jewellers',
    tagline: 'MERN Stack jewellery e-commerce platform',
    category: 'ecommerce',
    status: 'published',
    featured: true,
    live: true,
    year: '2025',
    description:
      'A complete jewellery e-commerce platform featuring product management, shopping cart, user authentication, order management, secure checkout and a full admin dashboard. Built and deployed for a real retail business.\n\nThe platform handles the complete buying journey — from browsing the catalogue with category filters and search, to adding items to a persistent cart, through a secure checkout flow with order confirmation. The admin dashboard gives the business owner full control over products, inventory, orders, customers and sales analytics.\n\nThis was built from scratch for a real jewellery retailer and is serving live customers in production today.',
    shortDescription:
      'A complete jewellery e-commerce platform with product management, shopping cart, authentication, order management and admin dashboard.',
    features: [
      'Product catalogue with categories and inventory management',
      'User authentication and account management',
      'Shopping cart with persistent state',
      'Secure checkout and order placement',
      'Order management and status tracking',
      'Admin dashboard for products, orders and customers',
      'Search and filter functionality',
      'Responsive design for all devices',
      'Sales analytics and reporting',
      'Email notifications for orders',
    ],
    tech: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'Tailwind CSS',
      'JWT Authentication',
      'Cloudinary',
      'Mongoose',
      'REST API',
    ],
    challenges:
      'The main challenge was building a robust inventory management system that could handle concurrent purchases without overselling. I implemented optimistic locking on the database level and built a cart reservation system that temporarily holds items during checkout.\n\nAnother challenge was image management — jewellery products need high-quality images from multiple angles. I integrated Cloudinary for optimised image storage with automatic resizing and format conversion.',
    outcome:
      'The platform launched successfully and is actively serving customers. The business owner reports a significant increase in sales reach beyond their physical store location. The admin dashboard reduced their inventory management time by approximately 70%.',
    liveUrl: 'https://rbjewellry.pk',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#F59E0B',
    accentTo: '#8B5CF6',
    sortOrder: 1,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
  {
    title: 'Mr Solver Learning Hub',
    slug: 'mr-solver-learning-hub',
    tagline: 'Online IT education & student management platform',
    category: 'fullstack',
    status: 'published',
    featured: true,
    live: true,
    year: '2025',
    description:
      'An online learning platform offering IT courses, diploma programs, language training, safety courses and professional certifications, with built-in student management. Developed as Development Head at Mr Solver TECH.\n\nThe platform serves as both a public-facing course catalogue and an internal student management system. Prospective students can browse available programs, view detailed curricula, and submit enrolment applications. The admin panel handles the complete student lifecycle — from application processing through course assignment to certification.\n\nBuilt with scalability in mind, the architecture supports adding new course categories, managing multiple batches simultaneously, and tracking student progress across programs.',
    shortDescription:
      'An online learning platform with IT courses, diplomas, languages, safety programs and student management.',
    features: [
      'Course catalogue: IT, diplomas, languages and safety programs',
      'Professional certification tracks',
      'Student enrolment and management',
      'Course detail pages with curriculum outlines',
      'Admin controls for courses and students',
      'Fully responsive, mobile-first interface',
      'Batch management system',
      'Student progress tracking',
      'Application processing workflow',
      'Dynamic course content management',
    ],
    tech: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'Tailwind CSS',
      'JWT Authentication',
      'Mongoose',
      'REST API',
    ],
    challenges:
      'Designing a flexible course structure that could accommodate vastly different program types — from short IT certifications to multi-month diploma programs — while keeping the admin interface intuitive was the primary challenge.\n\nI solved this by creating a modular course schema with nested curriculum sections, flexible scheduling options, and configurable enrolment rules that the admin can manage without touching code.',
    outcome:
      'The platform is live and actively used by Mr Solver TECH to manage their complete educational offering. It handles student enrolments, course scheduling, and certification management for all their programs. The admin team manages everything through the dashboard without any developer involvement.',
    liveUrl: 'https://mrsolverlearninghub.com',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#3B82F6',
    accentTo: '#06B6D4',
    sortOrder: 2,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
  {
    title: 'Office Management Portal',
    slug: 'office-management-portal',
    tagline: 'Complete office & student administration system',
    category: 'management',
    status: 'published',
    featured: true,
    live: true,
    year: '2025',
    description:
      'A complete office and student management system designed to handle admissions, students, staff, attendance, courses and day-to-day administrative workflows for the entire organisation.\n\nThis system replaces manual paper-based processes with a digital workflow that covers every aspect of office administration. From processing new student admissions and managing staff records to tracking daily attendance and generating reports, the portal centralises all operations in one place.\n\nThe role-based access control ensures that different staff members see only the data relevant to their responsibilities, while administrators have full visibility across the organisation.',
    shortDescription:
      'A complete office management system handling admissions, students, staff, attendance, courses and administrative workflows.',
    features: [
      'Admissions pipeline and student records',
      'Staff management and role-based access',
      'Attendance tracking and reporting',
      'Course and batch administration',
      'Administrative workflow automation',
      'Dashboard with organisational metrics',
      'Fee management and payment tracking',
      'Document management system',
      'Notification system for staff and students',
      'Comprehensive reporting and analytics',
    ],
    tech: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'Tailwind CSS',
      'JWT Authentication',
      'Role-Based Access Control',
      'Mongoose',
    ],
    challenges:
      'The biggest challenge was modelling the complex relationships between students, courses, batches, staff, and attendance in a way that supports efficient queries for the dashboard metrics.\n\nI designed a denormalised MongoDB schema that balances read performance with data consistency, and implemented aggregation pipelines for the reporting features that process thousands of attendance records in milliseconds.',
    outcome:
      'The portal is live at Mr Solver TECH and has completely digitised their administrative operations. Manual paperwork has been eliminated, admission processing time has been reduced by 80%, and the management team has real-time visibility into organisational metrics through the dashboard.',
    liveUrl: 'https://office.mrsolverlearninghub.com',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#8B5CF6',
    accentTo: '#3B82F6',
    sortOrder: 3,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
  {
    title: 'Shan Biryani Restaurant',
    slug: 'shan-biryani-restaurant',
    tagline: 'Restaurant management & online ordering platform',
    category: 'management',
    status: 'published',
    featured: true,
    live: true,
    year: '2025',
    description:
      'A restaurant management platform with menu management, online ordering, table reservations, billing and full administrative controls — everything a restaurant needs to run its front and back of house.\n\nThe system provides a seamless experience for both customers and restaurant staff. Customers can browse the digital menu, place orders online, and make table reservations. The kitchen receives orders in real-time through the management interface, and the billing system generates invoices automatically.\n\nThe responsive design ensures the system works perfectly on the tablets used by waitstaff on the restaurant floor, as well as on desktop screens in the back office.',
    shortDescription:
      'A restaurant management platform with menu management, online ordering, reservations, billing and admin controls.',
    features: [
      'Digital menu with category management',
      'Online ordering flow',
      'Table reservation system',
      'Billing and invoice generation',
      'Admin controls for menu, orders and bookings',
      'Responsive design for tablet and mobile use',
      'Real-time order notifications',
      'Customer feedback system',
      'Daily sales reporting',
      'Kitchen display system',
    ],
    tech: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'Tailwind CSS',
      'JWT Authentication',
      'REST API',
      'Mongoose',
    ],
    challenges:
      'Building a real-time ordering system that keeps the kitchen display synchronised with incoming orders was the main technical challenge. I implemented a polling mechanism that checks for new orders every few seconds, with visual and audio notifications for the kitchen staff.\n\nThe menu management needed to handle complex pricing — items with size variations, add-ons, and special deals — which required a flexible schema design.',
    outcome:
      'The restaurant system is live and handles all daily operations. The owner reports that online orders now account for a significant portion of their business, and the digital menu has eliminated the cost of printing physical menus. Table reservations have become more organised, reducing double-bookings to zero.',
    liveUrl: 'https://shan-biryani.vercel.app',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#EF4444',
    accentTo: '#F59E0B',
    sortOrder: 4,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
  {
    title: 'Single Vendor E-Commerce',
    slug: 'single-vendor-ecommerce',
    tagline: 'Full-featured store with admin dashboard',
    category: 'ecommerce',
    status: 'published',
    featured: false,
    live: false,
    year: '2024',
    description:
      'A single-vendor e-commerce application with product management, secure authentication, shopping cart, checkout, order management and an admin dashboard — built as a reusable commerce foundation.\n\nThis project was designed as a template-quality e-commerce solution that can be customised and deployed for any single-vendor retail business. It includes all the essential features expected in a modern online store, with clean code architecture that makes it easy to extend.\n\nThe admin dashboard provides complete control over the product catalogue, order processing, and customer management. The REST API is fully documented and follows consistent patterns throughout.',
    shortDescription:
      'A single-vendor e-commerce application with product management, cart, checkout, order management and admin dashboard.',
    features: [
      'Product management with image uploads',
      'Secure JWT authentication',
      'Shopping cart and checkout flow',
      'Order management and history',
      'Admin dashboard with sales overview',
      'REST API with clean, documented endpoints',
      'Category and filter management',
      'Customer account management',
      'Responsive storefront design',
      'Inventory tracking system',
    ],
    tech: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'JWT Authentication',
      'Tailwind CSS',
      'Mongoose',
      'REST API',
    ],
    challenges:
      'Building a cart system that works seamlessly for both authenticated and guest users was an interesting challenge. I implemented a hybrid approach where guest carts are stored in localStorage and automatically merged with the user\'s server-side cart upon login.\n\nThe checkout flow needed to handle edge cases like items going out of stock between cart addition and checkout completion.',
    outcome:
      'The project serves as a proven, production-ready e-commerce foundation. The architecture and patterns from this project were reused in the RB Jewellers platform, significantly accelerating its development. The codebase has been referenced by other developers as a learning resource for building MERN e-commerce applications.',
    liveUrl: '',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#10B981',
    accentTo: '#06B6D4',
    sortOrder: 5,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
  {
    title: 'Portfolio REST API',
    slug: 'portfolio-rest-api',
    tagline: 'The hardened Express API powering this site',
    category: 'fullstack',
    status: 'published',
    featured: false,
    live: true,
    year: '2025',
    description:
      'The production backend behind this portfolio: contact messages, project orders, newsletter subscriptions, and project management with Cloudinary media uploads. Ships input validation, rate limiting, Helmet security headers, NoSQL-injection sanitising, JWT-protected admin routes and transactional email via Nodemailer.\n\nEvery public endpoint is protected against common attack vectors — rate limiting prevents spam, express-validator catches malformed input before it reaches the database, and express-mongo-sanitize blocks NoSQL injection attempts. The admin routes are protected with JWT authentication and role-based access control.\n\nThe email system uses Nodemailer with Gmail SMTP to send confirmation emails to users and notification emails to the admin. The project management system integrates with Cloudinary for image and video uploads with automatic optimisation.\n\nThe API follows RESTful conventions consistently and returns predictable JSON envelopes with clear error messages and field-level validation feedback.',
    shortDescription:
      'The production Express API powering this portfolio — contact forms, project orders, newsletter, project CRUD with Cloudinary media.',
    features: [
      'Express Validator on every public endpoint',
      'Per-route rate limiting to block spam',
      'Helmet, CORS allow-list and NoSQL sanitising',
      'Nodemailer notifications + client auto-replies',
      'JWT-protected admin endpoints with role guard',
      'Centralised error handler with typed responses',
      'Project CRUD with Cloudinary image/video uploads',
      'Newsletter subscription with double opt-in',
      'Project order system with WhatsApp integration',
      'Comprehensive API health monitoring',
    ],
    tech: [
      'Node.js',
      'Express.js',
      'MongoDB',
      'Mongoose',
      'Nodemailer',
      'JWT Authentication',
      'Cloudinary',
      'Multer',
      'Express Validator',
      'Helmet',
      'Rate Limiting',
    ],
    challenges:
      'Designing an email system that never breaks form submissions was critical — if the SMTP service is down, the API must still save the form data and respond successfully. I implemented a fire-and-forget email pattern with comprehensive error logging.\n\nThe Cloudinary integration needed to handle multiple file types (images and videos) with different storage configurations, automatic cleanup when projects are deleted, and graceful fallbacks when the service is unavailable.',
    outcome:
      'The API has been running in production with zero downtime. It handles all contact form submissions, project orders, and newsletter subscriptions reliably. The admin dashboard provides full project management capabilities with media uploads. The security measures have successfully blocked hundreds of spam submissions and injection attempts.',
    liveUrl: '',
    githubUrl: 'https://github.com/exsam430-source',
    accentFrom: '#3B82F6',
    accentTo: '#10B981',
    sortOrder: 6,
    thumbnail: { url: '', publicId: '' },
    images: [],
    demoVideo: { url: '', publicId: '' },
  },
];

async function seedProjects() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectDB();

    /* Wait for connection to be ready */
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });

    logger.info('Connected! Starting project seed...');

    /* Count existing projects */
    const existingCount = await Project.countDocuments();
    logger.info(`Found ${existingCount} existing project(s) in database.`);

    /* Ask for confirmation if projects exist */
    if (existingCount > 0) {
      logger.warn(
        `This will DELETE all ${existingCount} existing projects and replace them with ${projects.length} seeded projects.`
      );
      logger.info('Proceeding in 3 seconds... (Ctrl+C to cancel)');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    /* Delete existing projects */
    const deleted = await Project.deleteMany({});
    logger.info(`Deleted ${deleted.deletedCount} existing project(s).`);

    /* Insert new projects */
    const inserted = await Project.insertMany(projects, {
      ordered: true,
    });

    logger.success(`✅ Successfully seeded ${inserted.length} projects:`);
    console.log('');

    inserted.forEach((project, i) => {
      const status = project.live ? '🟢 Live' : '⚪ Dev';
      const featured = project.featured ? '⭐' : '  ';
      console.log(
        `  ${featured} ${i + 1}. ${project.title.padEnd(35)} ${status.padEnd(10)} ${project.category.padEnd(15)} → /projects/${project.slug}`
      );
    });

    console.log('');
    logger.info('Project slugs for frontend routes:');
    inserted.forEach((p) => {
      console.log(`  GET /api/projects/${p.slug}`);
    });

    console.log('');
    logger.success('Seed completed successfully! 🎉');
    logger.info(
      'You can now view these projects at: http://localhost:5173/#projects'
    );
    logger.info(
      'Admin panel: http://localhost:5173/admin/projects'
    );

    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);

    if (error.name === 'ValidationError') {
      const fields = Object.keys(error.errors);
      logger.error(`Validation failed on fields: ${fields.join(', ')}`);
      fields.forEach((field) => {
        logger.error(`  → ${field}: ${error.errors[field].message}`);
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      logger.error(
        `Duplicate key error on field "${field}": ${JSON.stringify(
          error.keyValue
        )}`
      );
    }

    process.exit(1);
  }
}

seedProjects();