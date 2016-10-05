const model = require('./utils/model');
const controller = require('./utils/controller');
const { slurp } = require('./utils/module');
const middleware = require('./middleware');
const router = require('./utils/router');

Object.assign(exports, {
  model,
  controller,
  middleware,
  router,
  slurp
});
