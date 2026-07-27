const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Lazily-created singleton transporter.
 * If SMTP credentials are absent we fall back to "log only" mode so the API
 * keeps working (forms still save to MongoDB) instead of throwing 500s.
 */
let transporter = null;
let transportReady = false;

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (transporter || !smtpConfigured()) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true', // true for 465, false for 587
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 3,
  });

  transporter
    .verify()
    .then(() => {
      transportReady = true;
      logger.success('SMTP transport verified — outgoing email enabled.');
    })
    .catch((err) => logger.warn(`SMTP verify failed (${err.message}). Emails will be logged only.`));

  return transporter;
};

/**
 * Send an email. Never throws — email must never break a form submission.
 * @returns {Promise<{sent: boolean, reason?: string, messageId?: string}>}
 */
const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const tx = getTransporter();

  if (!tx) {
    logger.warn(`[email:skipped] "${subject}" → ${to} (SMTP not configured)`);
    return { sent: false, reason: 'smtp-not-configured' };
  }

  try {
    const info = await tx.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'Portfolio'}" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
      replyTo,
    });
    logger.success(`[email:sent] "${subject}" → ${to}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`[email:failed] "${subject}" → ${to} :: ${error.message}`);
    return { sent: false, reason: error.message };
  }
};

module.exports = sendEmail;
module.exports.smtpConfigured = smtpConfigured;
module.exports.isReady = () => transportReady;
