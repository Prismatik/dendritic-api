const { app } = require('../helper');
const userFixture = require('../fixtures/user');
const users = require('../../src/controllers/users');
const { testStandardRoute } = require('../support/routes');

const serialize = user => {
  const clone = Object.assign({}, user);
  delete clone.password;
  return clone;
};

describe('/users route', () => {
  testStandardRoute(app, '/users', userFixture, serialize);

  describe('POST /signin', () => {
    let user;
    let validData;

    before(function *() {
      validData = userFixture.data();
      user = yield users.create(validData);
    });

    it('generates an auth token and returns a user', function *() {
      const response = yield app.post('/users/signin', {
        email: validData.email, password: validData.password
      });

      response.status.must.eql(200);
      response.body.user.must.eql(serialize(user));
      response.body.token.must.be.a.string();
    });

    it('throws 401 when credentials are incorect', function *() {
      const response = yield app.post('/users/signin', {
        email: validData.email, password: 'hack hack hack'
      });

      response.status.must.eql(401);
      response.body.must.eql({ error: 'Unauthorized' });
    });
  });
});
