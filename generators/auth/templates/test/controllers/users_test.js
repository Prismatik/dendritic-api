const HttpError = require('standard-http-error');
const users = require('../../src/controllers/users');
const { testStandardController } = require('../support/controllers');
const userFixture = require('../fixtures/user');

describe('users controller', () => {
  testStandardController(users, userFixture, record =>
    // don't compare passwords as they're encrypted and overwritten
    Object.assign(record, { password: '[FILTERED]' })
  );

  describe('.signin(email, password)', () => {
    let user;
    let validData;

    beforeEach(function *() {
      validData = userFixture.data();
      user = yield users.create(validData);
    });

    it('returns a user and token if everything is correct', function *() {
      const result = yield users.signin(validData.email, validData.password);
      result.token.must.be.string();

      Object.assign({}, result.user).must.eql(Object.assign({}, user));
    });

    it('throws UNAUTHORIZED if the email is wrong', function *() {
      try {
        yield users.signin('h4ckr@h4ck.com', validData.password);
      } catch (e) {
        e.must.be.instanceOf(HttpError);
        e.code.must.eql(401);
      }
    });

    it('throws UNAUTHORIZED if the password is wrong', function *() {
      try {
        yield users.signin(validData.email, 'hack hack hack');
      } catch (e) {
        e.must.be.instanceOf(HttpError);
        e.code.must.eql(401);
      }
    });
  });
});
