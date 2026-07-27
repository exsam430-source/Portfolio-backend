/**
 * End-to-end smoke test against a real in-memory MongoDB instance.
 * Run with:  node tests/e2e.test.js
 * Exits non-zero if any assertion fails.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let pass = 0;
let fail = 0;
const ok = (label, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ✓ ${label}`); }
  else { fail += 1; console.log(`  ✗ ${label} ${extra}`); }
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('portfolio_test');
  process.env.JWT_SECRET = 'test_secret_key_that_is_long_enough_1234567890';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(process.env.MONGO_URI);

  const app = require('../app');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const req = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };

  console.log('\n── Health ──');
  const health = await req('GET', '/api/health');
  ok('health 200', health.status === 200);
  ok('db connected', health.json.data.database === 'connected', health.json.data?.database);

  console.log('\n── Contact ──');
  const badContact = await req('POST', '/api/contact', { name: 'A', email: 'nope', subject: 'x', message: 'tiny' });
  ok('rejects invalid payload (422)', badContact.status === 422);
  ok('returns field errors', Array.isArray(badContact.json.errors) && badContact.json.errors.length === 4);

  const goodContact = await req('POST', '/api/contact', {
    name: 'Jane Cooper', email: 'jane@example.com',
    subject: 'Project enquiry', message: 'I would like to discuss building a dashboard for my team.',
  });
  ok('accepts valid message (201)', goodContact.status === 201, JSON.stringify(goodContact.json));
  ok('persists and returns id', Boolean(goodContact.json.data?.id));

  const honeypot = await req('POST', '/api/contact', {
    name: 'Bot', email: 'bot@spam.com', subject: 'spam', message: 'buy things now please', website: 'http://spam',
  });
  ok('honeypot silently accepts bot (200, not saved)', honeypot.status === 200);
  ok('bot record NOT persisted', (await mongoose.connection.db.collection('contacts').countDocuments()) === 1);

  console.log('\n── Orders ──');
  const opts = await req('GET', '/api/orders/options');
  ok('options endpoint', opts.status === 200 && opts.json.data.serviceTypes.length === 6);

  const badOrder = await req('POST', '/api/orders', { name: 'X', email: 'bad', serviceType: 'Nope', budget: '$1' });
  ok('rejects invalid order (422)', badOrder.status === 422);

  const order = await req('POST', '/api/orders', {
    name: 'Ahmed Khan', email: 'ahmed@example.com', phone: '+92 300 1234567',
    serviceType: 'E-Commerce Store', projectTitle: 'Multi-vendor marketplace',
    description: 'We need a marketplace with vendor onboarding, cart, and Stripe checkout integration.',
    budget: '$2000 - $5000', timeline: '2-3 Months', techPreference: 'MERN preferred',
  });
  ok('accepts valid order (201)', order.status === 201, JSON.stringify(order.json));
  const ref = order.json.data?.reference;
  ok('generates ORD- reference', /^ORD-[A-Z0-9]{8}$/.test(ref || ''), ref);
  ok('defaults to pending status', order.json.data?.status === 'pending');

  console.log('\n── Subscribe ──');
  const sub1 = await req('POST', '/api/subscribe', { email: 'reader@example.com' });
  ok('subscribes new email (201)', sub1.status === 201);
  const sub2 = await req('POST', '/api/subscribe', { email: 'reader@example.com' });
  ok('idempotent on duplicate (200)', sub2.status === 200 && sub2.json.data.alreadySubscribed === true);
  const count = await req('GET', '/api/subscribe/count');
  ok('public count = 1', count.json.data.count === 1);

  const unsub = await req('DELETE', '/api/subscribe', { email: 'reader@example.com' });
  ok('unsubscribes', unsub.status === 200);
  ok('count drops to 0', (await req('GET', '/api/subscribe/count')).json.data.count === 0);
  const resub = await req('POST', '/api/subscribe', { email: 'reader@example.com' });
  ok('reactivates instead of duplicating', resub.json.data?.reactivated === true);
  ok('no duplicate documents', (await mongoose.connection.db.collection('subscribers').countDocuments()) === 1);

  console.log('\n── Auth & admin routes ──');
  for (const [m, p] of [['GET','/api/contact'],['GET','/api/orders'],['GET','/api/subscribers'],['PUT',`/api/orders/${order.json.data.id}`]]) {
    const r = await req(m, p, m === 'PUT' ? { status: 'accepted' } : undefined);
    ok(`${m} ${p} blocked without token (401)`, r.status === 401, r.status);
  }

  const User = require('../models/User');
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'SuperSecret123!' });
  const badLogin = await req('POST', '/api/auth/login', { email: 'admin@example.com', password: 'WrongPassword1' });
  ok('rejects wrong password (401)', badLogin.status === 401);

  const login = await req('POST', '/api/auth/login', { email: 'admin@example.com', password: 'SuperSecret123!' });
  ok('admin login returns token', login.status === 200 && Boolean(login.json.data?.token));
  const token = login.json.data.token;

  ok('GET /api/contact with token', (await req('GET', '/api/contact', null, token)).json.data.length === 1);
  ok('GET /api/orders with token', (await req('GET', '/api/orders', null, token)).json.data.length === 1);
  ok('GET /api/subscribers alias works', (await req('GET', '/api/subscribers', null, token)).status === 200);

  const upd = await req('PUT', `/api/orders/${order.json.data.id}`, { status: 'accepted', adminNote: 'Looks good' }, token);
  ok('PUT updates order status', upd.status === 200 && upd.json.data.status === 'accepted');
  const badStatus = await req('PUT', `/api/orders/${order.json.data.id}`, { status: 'bogus' }, token);
  ok('rejects invalid status (422)', badStatus.status === 422);

  console.log('\n── Security ──');
  const injection = await req('POST', '/api/subscribe', { email: { $ne: null } });
  ok('blocks NoSQL injection payload', injection.status === 422, injection.status);
  const notFound = await req('GET', '/api/does-not-exist');
  ok('404 handler returns JSON envelope', notFound.status === 404 && notFound.json.success === false);

  server.close();
  await mongoose.disconnect();
  await mongod.stop();

  console.log(`\n${'─'.repeat(46)}\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
