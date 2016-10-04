const coolBananas = require('../../src/controllers/cool_bananas');
const coolBananaFixture = require('../fixtures/cool_banana');
const { testStandardController } = require('../support/controllers');

describe('coolBananas controller', () => {
  testStandardController(coolBananas, coolBananaFixture);
});
