/**
 * Responsive, dark-themed HTML email templates.
 * Table-based markup + inline styles = maximum client compatibility
 * (Gmail, Outlook, Apple Mail, mobile).
 */

const BRAND = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  muted: '#94A3B8',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
};

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const siteName = () => process.env.SITE_NAME || 'MERN Portfolio';
const siteUrl = () => process.env.SITE_URL || '#';

/** Shared shell: header bar, card body, footer. */
const layout = ({ title, preheader = '', body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.secondary});padding:22px 28px;">
            <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.3px;">${esc(siteName())}</div>
            <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:2px;">${esc(title)}</div>
          </td>
        </tr>
        <tr><td style="padding:28px;color:${BRAND.text};font-size:15px;line-height:1.65;">${body}</td></tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:12px;line-height:1.6;">
            Sent automatically from <a href="${esc(siteUrl())}" style="color:${BRAND.primary};text-decoration:none;">${esc(siteUrl())}</a>.<br/>
            &copy; ${new Date().getFullYear()} ${esc(siteName())}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/** Key/value rows used inside admin notification emails. */
const rows = (pairs) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:6px 0 18px;">
    ${pairs
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(
        ([k, v]) => `<tr>
          <td style="padding:9px 12px;border:1px solid ${BRAND.border};background:rgba(148,163,184,.06);color:${BRAND.muted};font-size:13px;width:38%;white-space:nowrap;">${esc(k)}</td>
          <td style="padding:9px 12px;border:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;">${esc(v)}</td>
        </tr>`,
      )
      .join('')}
  </table>`;

const button = (label, href) =>
  `<a href="${esc(href)}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.secondary});color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">${esc(label)}</a>`;

const quote = (text) =>
  `<div style="border-left:3px solid ${BRAND.primary};background:rgba(59,130,246,.08);padding:12px 16px;border-radius:0 10px 10px 0;color:${BRAND.text};white-space:pre-wrap;">${esc(text)}</div>`;

/* ── Contact ─────────────────────────────────────────────── */

const contactAdmin = (c) =>
  layout({
    title: 'New contact message',
    preheader: `${c.name}: ${c.subject}`,
    body: `<h2 style="margin:0 0 12px;font-size:20px;">📬 New contact message</h2>
      ${rows([
        ['Name', c.name],
        ['Email', c.email],
        ['Subject', c.subject],
        ['Received', new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })],
      ])}
      <p style="color:${BRAND.muted};margin:0 0 8px;font-size:13px;">Message</p>
      ${quote(c.message)}
      <p style="margin:22px 0 0;">${button('Reply to ' + c.name, `mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject)}`)}</p>`,
  });

const contactAutoReply = (c) =>
  layout({
    title: 'Thanks for reaching out',
    preheader: 'I received your message and will reply shortly.',
    body: `<h2 style="margin:0 0 12px;font-size:20px;">Hi ${esc(c.name)} 👋</h2>
      <p style="margin:0 0 14px;">Thanks for getting in touch — your message landed safely and I typically reply within <strong>24 hours</strong>.</p>
      <p style="color:${BRAND.muted};margin:0 0 8px;font-size:13px;">Here's a copy of what you sent:</p>
      ${quote(`Subject: ${c.subject}\n\n${c.message}`)}
      <p style="margin:22px 0 0;">${button('Visit the portfolio', siteUrl())}</p>`,
  });

/* ── Project orders ──────────────────────────────────────── */

const orderAdmin = (o) =>
  layout({
    title: 'New project order',
    preheader: `${o.name} — ${o.projectTitle}`,
    body: `<h2 style="margin:0 0 12px;font-size:20px;">🚀 New project order</h2>
      ${rows([
        ['Client', o.name],
        ['Email', o.email],
        ['Phone', o.phone],
        ['Service', o.serviceType],
        ['Project', o.projectTitle],
        ['Budget', o.budget],
        ['Timeline', o.timeline],
        ['Tech preference', o.techPreference],
        ['Reference', o.reference],
      ])}
      <p style="color:${BRAND.muted};margin:0 0 8px;font-size:13px;">Project description</p>
      ${quote(o.description)}
      <p style="margin:22px 0 0;">${button('Email the client', `mailto:${o.email}?subject=Re: ${encodeURIComponent(o.projectTitle)}`)}</p>`,
  });

const orderAutoReply = (o) =>
  layout({
    title: 'Order received',
    preheader: `I received your request: ${o.projectTitle}`,
    body: `<h2 style="margin:0 0 12px;font-size:20px;">Thank you, ${esc(o.name)} 🎉</h2>
      <p style="margin:0 0 14px;">Your project request has been received. Reference number <strong style="color:${BRAND.primary};">${esc(o.reference)}</strong> — keep it for follow-ups.</p>
      ${rows([
        ['Project', o.projectTitle],
        ['Service', o.serviceType],
        ['Budget', o.budget],
        ['Timeline', o.timeline],
        ['Status', 'Pending review'],
      ])}
      <p style="margin:0 0 14px;">I'll review the scope and get back to you within <strong>24–48 hours</strong> with questions, a proposed plan and a quote.</p>
      <p style="margin:22px 0 0;">${button('View portfolio', siteUrl())}</p>`,
  });

/* ── Newsletter ──────────────────────────────────────────── */

const subscriberAdmin = (s) =>
  layout({
    title: 'New newsletter subscriber',
    preheader: s.email,
    body: `<h2 style="margin:0 0 12px;font-size:20px;">🔔 New subscriber</h2>
      ${rows([
        ['Email', s.email],
        ['Source', s.source || 'website'],
        ['Subscribed', new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })],
      ])}`,
  });

const subscriberWelcome = (s, unsubscribeUrl) =>
  layout({
    title: 'Welcome aboard',
    preheader: "You're subscribed — no spam, unsubscribe anytime.",
    body: `<h2 style="margin:0 0 12px;font-size:20px;">You're in! 🎯</h2>
      <p style="margin:0 0 14px;">Thanks for subscribing. You'll get occasional updates on new projects, services and practical MERN/JavaScript insights — no spam, ever.</p>
      <ul style="margin:0 0 18px;padding-left:18px;color:${BRAND.muted};">
        <li style="margin-bottom:6px;">New full-stack project launches &amp; case studies</li>
        <li style="margin-bottom:6px;">Node.js / React tips from real client work</li>
        <li>Occasional availability &amp; service announcements</li>
      </ul>
      <p style="margin:0 0 22px;">${button('Explore the portfolio', siteUrl())}</p>
      <p style="color:${BRAND.muted};font-size:12px;margin:0;">Changed your mind? <a href="${esc(unsubscribeUrl)}" style="color:${BRAND.primary};">Unsubscribe instantly</a>.</p>`,
  });

/* ── Order status change ─────────────────────────────────── */

const orderStatusUpdate = (o) =>
  layout({
    title: `Order ${o.status}`,
    preheader: `Your project "${o.projectTitle}" is now ${o.status}.`,
    body: `<h2 style="margin:0 0 12px;font-size:20px;">Status update</h2>
      <p style="margin:0 0 14px;">Hi ${esc(o.name)}, your project <strong>${esc(o.projectTitle)}</strong> (ref <strong style="color:${BRAND.primary};">${esc(o.reference)}</strong>) has moved to:</p>
      <p style="margin:0 0 18px;"><span style="display:inline-block;padding:8px 16px;border-radius:999px;background:rgba(59,130,246,.15);border:1px solid ${BRAND.primary};color:${BRAND.text};font-weight:600;text-transform:capitalize;">${esc(o.status)}</span></p>
      ${o.adminNote ? quote(o.adminNote) : ''}
      <p style="margin:22px 0 0;">${button('View portfolio', siteUrl())}</p>`,
  });

module.exports = {
  contactAdmin,
  contactAutoReply,
  orderAdmin,
  orderAutoReply,
  orderStatusUpdate,
  subscriberAdmin,
  subscriberWelcome,
};
