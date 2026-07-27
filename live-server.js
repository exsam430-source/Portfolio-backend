/* Dev helper: boots the API against an in-memory MongoDB (no Atlas needed). */
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('portfolio_live');
  process.env.JWT_SECRET = 'live_test_secret_key_long_enough_1234567890';
  process.env.CLIENT_URL = 'http://127.0.0.1:4188';
  await mongoose.connect(process.env.MONGO_URI);
  require('./app').listen(5000, () => console.log('LIVE API on 5000'));
})();
