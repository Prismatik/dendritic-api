const { app } = require('../helper');
const User = require('../../src/models/user');
const users = require('../../src/controllers/users');
const userFixture = require('../fixtures/user');
const io = require('socket.io-client');

const HEX = '[a-fA-F0-9]';
const UUID_PATTERN = `^${HEX}{8}-${HEX}{4}-${HEX}{4}-${HEX}{4}-${HEX}{12}$`;

describe('/users route', () => {
  let user;
  let user1;
  let user2;

  const sorted = (records, param = 'id') => records
    .sort((a, b) => (a[param] > b[param] ? 1 : -1))
    .map(i => Object.assign({}, i))
    .map(i => { delete i.password; return i; })

  beforeEach(function *() {
    yield User.delete().execute();

    [user1, user2] = yield [
      users.create(userFixture.valid()),
      users.create(userFixture.valid())
    ];

    user = user1;
  });

  describe('GET /', () => {
    it('returns all records by default', function *() {
      const response = yield app.get('/users');
      response.status.must.eql(200);
      response.body.must.be.an(Array);
      sorted(response.body).must.eql(sorted([user1, user2]));
    });

    it('allows to specify property filters', function *() {
      const response = yield app.get('/users', { id: user1.id });
      response.status.must.eql(200);
      sorted(response.body).must.eql(sorted([user1]));
    });

    it('allows to sort data by fields', function *() {
      const response = yield app.get('/users', { orderBy: 'rev' });
      response.status.must.eql(200);
      sorted(response.body, 'rev').must.eql(
        sorted([user1, user2], 'rev')
      );
    });

    it('allows `limit` data', function *() {
      const response = yield app.get('/users', { limit: 1, orderBy: 'rev' });
      response.status.must.eql(200);
      response.body.must.eql(sorted(
        [user1, user2], 'rev'
      ).slice(0, 1));
    });
  });

  describe('GET /:id', () => {
    it('returns the record if exists', function *() {
      const response = yield app.get(`/users/${user.id}`);
      response.status.must.eql(200);
      response.body.must.be.object();

      delete user.password;

      response.body.must.eql(Object.assign({}, user));
    });

    it('throws 404 when the record does not exist', function *() {
      const response = yield app.get('/users/hack');
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });

  describe('POST /', () => {
    it('creates new record when data is good', function *() {
      const data = userFixture.valid(); delete data.id;
      const response = yield app.post('/users', data);
      response.status.must.eql(201);
      response.body.must.be.object();
      response.body.must.not.have.property('password');

      const user = response.body;

      delete user.id; delete user.rev;
      delete data.rev; delete data.password;

      user.must.eql(data);
    });

    it('throws 422 if the data is bad', function *() {
      const response = yield app.post('/users', {});
      response.status.must.eql(422);
      response.body.must.be.object();
      response.body.must.have.property('error');
      response.body.error.must.contain('is required');
    });

    it('throws 422 if a password is mising', function *() {
      const data = userFixture.valid(); delete data.password;
      const response = yield app.post('/users', data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: '`password` is required'
      });
    });
  });

  describe('PUT /:id', () => {
    let validData;

    beforeEach(() => {
      validData = userFixture.valid(); delete validData.id;
      validData.rev = user.rev;
    });

    it('replaces an entire document and returns the updated record back', function *() {
      const response = yield app.put(`/users/${user.id}`, validData);
      response.status.must.eql(200);

      const expected = Object.assign({ id: user.id }, validData);
      delete expected.password;
      delete expected.rev;
      delete response.body.rev;

      response.body.must.eql(expected);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.put('/users/hack', {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('throws 422 if some data is missing', function *() {
      const response = yield app.put(`/users/${user.id}`, {});
      response.status.must.eql(422);
      response.body.error.must.contain('is required');
    });

    it('throws 422 if the data is malformed', function *() {
      const data = Object.assign({}, validData, { rev: 'hack hack hack' });
      const response = yield app.put(`/users/${user.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: `\`rev\` must match pattern "${UUID_PATTERN}"`
      });
    });
  });

  describe('PATCH /:id', () => {
    it('updates the data and returns the updated record back', function *() {
      const data = { rev: user.rev };
      const response = yield app.patch(`/users/${user.id}`, data);
      response.status.must.eql(200);

      const expected = Object.assign({}, user, data);
      delete expected.password;
      delete expected.rev;
      delete response.body.rev;

      response.body.must.eql(expected);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.patch('/users/hack', {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('does not explode if not all data was send through', function *() {
      const response = yield app.patch(`/users/${user.id}`, {});
      response.status.must.eql(200);
    });

    it('throws 422 if the data is malformed', function *() {
      const data = { rev: 'hack hack hack' };
      const response = yield app.patch(`/users/${user.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: `\`rev\` must match pattern "${UUID_PATTERN}"`
      });
    });
  });

  describe('PATCH /:id', () => {
    let extraPropRecord;
    const propText = 'oh hi I am an extra prop';

    beforeEach(function *() {
      const data = userFixture.valid();
      data.extraProp = propText;
      data.foo = {};
      data.foo.bar = propText;
      extraPropRecord = yield users.create(data);
      data.rev = extraPropRecord.rev;
    });

    it('interprets null as a delete', function *() {
      // https://tools.ietf.org/html/rfc7396
      const existing = yield app.get(`/users/${extraPropRecord.id}`);
      existing.body.extraProp.must.eql(propText);
      existing.body.foo.bar.must.eql(propText);

      const data = { extraProp: null, foo: { bar: null } };
      const response = yield app.patch(`/users/${extraPropRecord.id}`, data);
      response.status.must.eql(200);

      const expected = Object.assign({}, extraPropRecord, data);
      delete expected.password;
      delete expected.extraProp;
      delete expected.foo.bar;
      delete expected.rev;
      delete response.body.rev;

      response.body.must.eql(expected);
    });
  });


  describe('DELETE /:id', () => {
    it('deletes a record if it exists', function *() {
      const response = yield app.delete(`/users/${user.id}`);
      response.status.must.eql(200);
      const expected = Object.assign({}, user);
      delete expected.password;
      response.body.must.eql(expected);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.delete('/users/hack', {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });

  describe('socket connection', () => {
    let client;
    const wait = timeout => new Promise(resolve => setTimeout(resolve, timeout));
    const listenFor = event => new Promise((resolve, reject) => {
      client.on(event, data => resolve(data));
      client.on('error', error => reject(error));
    });

    beforeEach(function *() {
      yield wait(50); // waiting for the other beforeEach events to pass
      client = io(app.urlFor('/users'), { forceNew: true });
    });

    afterEach(() => client.disconnect());

    it('allows to open up connection and get metadata back', function *() {
      const metadata = yield listenFor('metadata');
      metadata.must.eql({ count: 2 });
    });

    it('sends through all existing records and the `all:loaded` event', function *() {
      const records = [];
      const allDone = listenFor('all:loaded');
      client.on('existed', record => records.push(record));
      const result = yield allDone;
      result.must.eql({});
      sorted(records).must.eql(sorted([user1, user2]));
    });

    it('sends records through when they are created', function *() {
      const feed = listenFor('created'); yield wait(50);
      const newRecord = yield users.create(userFixture.valid());
      const feedRecord = yield feed;
      delete newRecord.password;
      feedRecord.must.eql(Object.assign({}, newRecord));
    });

    it('sends notifications about changed objects', function *() {
      const feed = listenFor('updated'); yield wait(50);
      const newData = userFixture.valid(); delete newData.id;
      newData.rev = user.rev;
      const updatedRecord = yield users.update(user.id, newData);
      const feedRecord = yield feed;
      delete updatedRecord.password;
      feedRecord.must.eql(Object.assign({}, updatedRecord));
    });

    it('sends notifications through when users are deleted', function *() {
      const feed = listenFor('deleted'); yield wait(50);
      const deletedRecord = yield users.delete(user.id);
      const feedRecord = yield feed;
      delete deletedRecord.password;
      feedRecord.must.eql(Object.assign({}, deletedRecord));
    });
  });
});
