// require('dotenv-safe').load({ sample: './.env.example' });

const {
  PORT = 3001,
  NODE_ENV = 'development',
  RETHINKDB_URL = 'rethinkdb://localhost:28015/dendritic_api',
  LOG_LEVEL = 'info'
} = process.env;

module.exports = {
  PORT,
  NODE_ENV,
  RETHINKDB_URL,
  LOG_LEVEL
};
