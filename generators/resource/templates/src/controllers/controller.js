const { <%= pascalCase %> } = require('../models');
const { createController } = require('../utils/controller');

module.exports = createController(<%= pascalCase %>, {
  // TODO business logic
});
