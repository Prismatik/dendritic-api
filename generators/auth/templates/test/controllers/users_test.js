const HttpError = require('standard-http-error');
const User = require('../../src/models/user');
const users = require('../../src/controllers/users');
const { thinky: { Errors: { DocumentNotFound, ValidationError } } } = require('../../config');
const userFixture = require('../fixtures/user');

const UUID_RE = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

describe('users controller', () => {
  let validData;
  let user;

  beforeEach(function *() {
    validData = userFixture.valid();
    user = yield users.create(validData);
  });

  const pureData = data => Object.assign({}, data, { id: null, rev: null, password: null });

  describe('.all(query)', () => {
    let user1;
    let user2;
    let user3;

    const sorted = (records, param = 'id') => records
      .sort((a, b) => (a[param] > b[param] ? 1 : -1))
      .map(i => Object.assign({}, i));

    beforeEach(function *() {
      yield User.delete().execute();

      [user1, user2, user3] = yield [
        users.create(userFixture.valid()),
        users.create(userFixture.valid()),
        users.create(userFixture.valid())
      ];
    });

    it('returns all the records by default', function *() {
      const result = yield users.all();
      result.must.be.an(Array);
      sorted(result).must.eql(sorted([
        user1, user2, user3
      ]));
    });

    it('allows to filter the list by a specific field', function *() {
      const filter = { id: user1.id };
      const result = yield users.all(filter);
      sorted(result).must.eql(sorted([user1]));
    });

    it('ignores totally unsupported params', function *() {
      const filter = { totalMonkey: 123 };
      const result = yield users.all(filter);
      sorted(result).must.eql(sorted([
        user1, user2, user3
      ]));
    });

    it('allows to order things by a specific field', function *() {
      const params = { orderBy: 'rev' };
      const result = yield users.all(params);
      result.map(i => Object.assign({}, i)).must.eql(
        sorted([user1, user2, user3], 'rev')
      );
    });

    it('allows to skip records', function *() {
      const params = { orderBy: 'rev', skip: 1 };
      const result = yield users.all(params);
      result.map(i => Object.assign({}, i)).must.eql(
        sorted([user1, user2, user3], 'rev').slice(1)
      );
    });

    it('allows to limit records', function *() {
      const params = { orderBy: 'rev', limit: 2 };
      const result = yield users.all(params);
      result.map(i => Object.assign({}, i)).must.eql(sorted([
        user1, user2, user3
      ], 'rev').slice(0, 2));
    });
  });

  describe('.find(id)', () => {
    it('returns the user when it exists', function *() {
      const result = yield users.find(user.id);

      Object.assign({}, result).must.eql(Object.assign({}, user));
    });

    it('throws DocumentNotFound if the user does not exist', function *() {
      try {
        yield users.find('hack!');
        throw new Error('must fail here!');
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });

  describe('.create(data)', () => {
    beforeEach(() => {
      // refreshing the validData to avoid conflicts
      validData = userFixture.valid();
    });

    it('saves valid data and returns a model instance', function *() {
      const user = yield users.create(validData);
      user.constructor.must.equal(User);

      user.id.must.match(UUID_RE);

      pureData(user).must.eql(pureData(validData));
    });

    it('automatically adds a `rev` property onto new records', function *() {
      delete validData.rev;
      const user = yield users.create(validData);
      user.rev.must.match(UUID_RE);
    });

    it('throws validation errors when data is missing', function *() {
      try {
        yield users.create({});
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });

    it('must require `email` and `password`', function *() {
      try {
        yield users.create(Object.assign(
          validData, { email: undefined, password: undefined }
        ));
        throw new Error('must fail here');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`email` is required');
        e.message.must.contain('`password` is required');
      }
    });

    it('must validate `email` format', function *() {
      try {
        yield users.create(Object.assign(validData, { email: 'hack!' }));
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`email` must match format "email"');
      }
    });

    it('must encrypt passwords', function *() {
      const data = Object.assign(validData, { password: '84(0/\\/' });
      const user = yield users.create(data);
      user.password.must.not.eql(data.password);
    });
  });

  describe('.update(params)', () => {
    it('updates params when things are good', function *() {
      const oldId = user.id;
      const validData = userFixture.valid(); delete validData.id;
      validData.rev = user.rev;
      const result = yield users.update(user.id, validData);
      result.constructor.must.equal(User);
      result.id.must.eql(oldId);

      pureData(result).must.eql(pureData(Object.assign({}, user, validData)));
    });

    it('explodes when data is wrong', function *() {
      try {
        yield users.update(user.id, { rev: 'hack!' });
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield users.update('hack!', validData);
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });

    it('does not allow update to borked emails', function *() {
      try {
        yield users.update(user.id, { email: 'hack!' });
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`email` must match format "email"');
      }
    });

    it('re-encrypts new passwords', function *() {
      const oldPassword = user.password;
      const data = { password: '84(0/\\/' };
      const result = yield users.update(user.id, data);
      result.password.must.not.eql(data.password);
      result.password.must.not.eql(oldPassword);
    });
  });

  describe('.replace(id, params)', () => {
    it('replaces the entire document with the new data', function *() {
      const oldId = user.id;
      const validData = userFixture.valid(); delete validData.id;
      validData.rev = user.rev;
      const result = yield users.replace(user.id, validData);
      result.constructor.must.equal(User);
      result.id.must.eql(oldId);

      pureData(result).must.eql(pureData(validData));
    });

    it('explodes when data is missing', function *() {
      try {
        yield users.replace(user.id, {});
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });

    it('explodes when data is wrong', function *() {
      const data = Object.assign({}, validData, { rev: 'hack!' });

      try {
        yield users.replace(user.id, data);
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield users.replace('hack!', validData);
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });

    it('does not allow update to borked emails', function *() {
      const data = Object.assign({}, validData, { email: 'hack!' });

      try {
        yield users.replace(user.id, data);
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`email` must match format "email"');
      }
    });

    it('re-encrypts new passwords', function *() {
      const oldPassword = user.password;
      const data = Object.assign({}, validData, { password: '84(0/\\/' });
      const result = yield users.replace(user.id, data);
      result.password.must.not.eql(data.password);
      result.password.must.not.eql(oldPassword);
    });
  });

  describe('.delete(id)', () => {
    it('deletes a user for sure when it exists', function *() {
      const record = yield users.delete(user.id);
      Object.assign({}, record).must.eql(Object.assign({}, user));

      const result = yield User.getAll(user.id);
      result.must.eql([]);
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield users.delete('hack!');
        throw new Error('must fail here');
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });

  describe('.signin(email, password)', () => {
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
