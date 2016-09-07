require('dotenv-safe').load({ sample: './.env.example' });

const {
  PORT = 3001,
  NODE_ENV = 'development',
  RETHINKDB_URL = 'rethinkdb://localhost:28015/<%= appName %>',
  JWT_SECRET = 'Ba(0/\\/',
  LOG_LEVEL = 'info',
  HASH_ROUNDS = 10
} = process.env;

module.exports = {
  PORT,
  NODE_ENV,
  RETHINKDB_URL,
  JWT_SECRET,
  LOG_LEVEL,
  HASH_ROUNDS: parseInt(HASH_ROUNDS, 10)
};
