const model = require('./utils/model');
const controller = require('./utils/controller');
const { slurp } = require('./utils/module');
const middleware = require('./middleware');
const router = require('./utils/router');
const logger = require('./utils/logger');

Object.assign(exports, {
  model,
  controller,
  middleware,
  router,
  logger,
  slurp
});

let migration;
Object.defineProperty(exports, 'migration', {
  readonly: true,
  get() {
    /* eslint global-require: 'off' */
    if (!migration) {
      migration = require('./utils/migration');
    }

    return migration;
  }
});
