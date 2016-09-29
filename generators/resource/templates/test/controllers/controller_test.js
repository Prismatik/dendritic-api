const <%= camelCasePlural %> = require('../../src/controllers/<%= snakeCasePlural %>');
const <%= camelCase %>Fixture = require('../fixtures/<%= snakeCase %>');
const { testStandardController } = require('../support/controllers');

describe('<%= camelCasePlural %> controller', () => {
  testStandardController(<%= camelCasePlural %>, <%= camelCase %>Fixture);
});
