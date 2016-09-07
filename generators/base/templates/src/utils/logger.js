const bunyan = require('bunyan');
const { LOG_LEVEL } = require('../../config');

const log = bunyan.createLogger({
  name: '<%= appName %>',
  level: LOG_LEVEL
});

module.exports = log;
