const { app } = require('../helper');
const coolBananaFixture = require('../fixtures/cool_banana');
const { testStandardRoute } = require('../support/routes');

describe('/cool-bananas route', () => {
  testStandardRoute(app, '/cool-bananas', coolBananaFixture);
});
