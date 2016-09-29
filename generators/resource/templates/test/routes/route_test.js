const { app } = require('../helper');
const <%= camelCase %>Fixture = require('../fixtures/<%= snakeCase %>');
const { testStandardRoute } = require('../support/routes');

describe('/<%= kebabCasePlural %> route', () => {
  testStandardRoute(app, '/<%= kebabCasePlural %>', <%= camelCase %>Fixture);
});
