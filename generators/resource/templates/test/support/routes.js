/**
 * A set of standard router testing scripts
 */
const io = require('socket.io-client');
const { run, sorted, toObject, UUID_RE } = require('./commons');

/**
 * runs all the steps with the given arguments
 *
 * @param {Object} app
 * @param {String} path namespace
 * @param {Object} fixture
 * @param {Function} serializer (optional)
 * @param {Object} options { skip: [...], only: [...] }
 * @return void
 */
exports.testStandardRoute = (...args) => {
  run(args, {
    index: exports.testStandardRouteIndex,
    fetch: exports.testStandardRouteFetch,
    post: exports.testStandardRoutePost,
    put: exports.testStandardRoutePut,
    patch: exports.testStandardRoutePatch,
    delete: exports.testStandardRouteDelete,
    socket: exports.testStandardRouteSocket,
  });
};

/**
 * Tests the standard router GET / behavior for the route
 */
exports.testStandardRouteIndex = (app, path, fixture, serialize = toObject) => {
  describe('GET /', () => {
    let doc1;
    let doc2;

    before(function *() {
      yield fixture.Model.delete().execute();

      [doc1, doc2] = yield [
        fixture.record(),
        fixture.record()
      ];
    });

    it('returns all records by default', function *() {
      const response = yield app.get(path);
      response.status.must.eql(200);
      sorted(response.body).must.eql(sorted([doc1, doc2]).map(serialize));
    });

    it('allows to specify property filters', function *() {
      const response = yield app.get(path, { id: doc1.id });
      response.status.must.eql(200);
      sorted(response.body).must.eql(sorted([doc1]).map(serialize));
    });

    it('allows to sort data by fields', function *() {
      const response = yield app.get(path, { orderBy: 'rev' });
      response.status.must.eql(200);
      sorted(response.body, 'rev').must.eql(
        sorted([doc1, doc2], 'rev').map(serialize)
      );
    });

    it('allows `limit` data', function *() {
      const response = yield app.get(path, { limit: 1, orderBy: 'rev' });
      response.status.must.eql(200);
      response.body.must.eql(sorted(
        [doc1, doc2], 'rev'
      ).slice(0, 1).map(serialize));
    });
  });
};

/**
 * Tests the standard GET `/:id` route
 */
exports.testStandardRouteFetch = (app, path, fixture, serialize = toObject) => {
  describe('GET /:id', () => {
    let record;

    before(function *() {
      record = yield fixture.record();
    });

    it('returns the record if exists', function *() {
      const response = yield app.get(`${path}/${record.id}`);
      response.status.must.eql(200);
      response.body.must.eql(serialize(record));
    });

    it('throws 404 when the record does not exist', function *() {
      const response = yield app.get(`${path}/hack-hack-hack`);
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });
};

/**
 * Tests the standard POST / route behavior
 */
exports.testStandardRoutePost = (app, path, fixture, serialize = toObject) => {
  describe('POST /', () => {
    it('creates new record when data is good', function *() {
      const omits = { id: undefined, rev: undefined };
      const data = fixture.data(omits);
      const response = yield app.post(path, data);
      response.status.must.eql(201);

      toObject(response.body, omits).must.eql(serialize(toObject(data, omits)));

      // must set the new id and rev
      response.body.id.must.match(UUID_RE);
      response.body.rev.must.match(UUID_RE);
    });

    it('throws 422 if the data is bad', function *() {
      const response = yield app.post(path, {});
      response.status.must.eql(422);
      response.body.error.must.contain('is required');
    });
  });
};

/**
 * Tests the standard PUT /:id route functionality
 */
exports.testStandardRoutePut = (app, path, fixture, serialize = toObject) => {
  describe('PUT /:id', () => {
    let data;
    let record;

    beforeEach(function *() {
      record = yield fixture.record();
      data = fixture.data({id: undefined, rev: record.rev});
    });

    it('replaces an entire document and returns the updated record back', function *() {
      const response = yield app.put(`${path}/${record.id}`, data);
      response.status.must.eql(200);
      response.body.must.eql(serialize(Object.assign({}, record, data, { rev: response.body.rev })));

      // must set a new rev
      response.body.rev.must.not.eql(record.rev);
      response.body.rev.must.match(UUID_RE);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.put(`${path}/hack-hack-hack`, {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('throws 422 if the rev is different from the current stamp', function *() {
      const wrongRev = Object.assign(data, { rev: record.id });
      const response = yield app.put(`${path}/${record.id}`, wrongRev);
      response.status.must.eql(422);
      response.body.must.eql({ error: '`rev` was changed by another update' });
    });

    it('throws 422 if data is missing', function *() {
      const response = yield app.put(`${path}/${record.id}`, { rev: data.rev });
      response.status.must.eql(422);
      response.body.error.must.contain('is required');
    });

    it('throws 422 if the data validation fails', function *() {
      const data = fixture.data({ rev: 'hack hack hack' });
      const response = yield app.put(`${path}/${record.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: `\`rev\` must match pattern "${UUID_RE.toString().replace(/\//g, '')}"`
      });
    });
  });
};

/**
 * Tests the standard PATCH /:id route functionality
 */
exports.testStandardRoutePatch = (app, path, fixture, serialize = toObject) => {
  describe('PATCH /:id', () => {
    let data;
    let record;

    beforeEach(function *() {
      record = yield fixture.record();
      data = fixture.data({id: undefined, rev: record.rev});
    });

    it('replaces an entire document and returns the updated record back', function *() {
      const response = yield app.patch(`${path}/${record.id}`, data);
      response.status.must.eql(200);
      response.body.must.eql(serialize(Object.assign({}, record, data, { rev: response.body.rev })));

      // must set a new rev
      response.body.rev.must.not.eql(record.rev);
      response.body.rev.must.match(UUID_RE);
    });

    it('accepts empty and partial data sets', function *() {
      const response = yield app.patch(`${path}/${record.id}`, { rev: data.rev });
      response.status.must.eql(200);

      // must set a new rev
      response.body.rev.must.not.eql(record.rev);
      response.body.rev.must.match(UUID_RE);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.patch(`${path}/hack-hack-hack`, {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('throws 422 if the rev is different from the current stamp', function *() {
      const wrongRev = Object.assign(data, { rev: record.id });
      const response = yield app.patch(`${path}/${record.id}`, wrongRev);
      response.status.must.eql(422);
      response.body.must.eql({ error: '`rev` was changed by another update' });
    });

    it('throws 422 if the data validation fails', function *() {
      const data = fixture.data({ rev: 'hack hack hack' });
      const response = yield app.patch(`${path}/${record.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: `\`rev\` must match pattern "${UUID_RE.toString().replace(/\//g, '')}"`
      });
    });

    // https://tools.ietf.org/html/rfc7396
    it('interprets `null` as delete', function *() {
      const record = yield fixture.record({ foo: { bar: 'baz' }, boo: 'hoo' });
      const data = { rev: record.rev, foo: { bar: null }, boo: null };

      const response = yield app.patch(`${path}/${record.id}`, data);

      response.status.must.eql(200);
      response.body.foo.must.eql({});
      response.body.must.not.have.property('boo');
    });
  });
};

/**
 * Tests the standard DELETE /:id route functionality
 */
exports.testStandardRouteDelete = (app, path, fixture, serialize = toObject) => {
  describe('DELETE /:id', () => {
    let record;

    before(function * () {
      record = yield fixture.record();
    });

    it('deletes a record if it exists', function *() {
      const response = yield app.delete(`${path}/${record.id}`);
      response.status.must.eql(200);
      response.body.must.eql(serialize(record));
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.delete(`${path}/hack-hack-hack`);
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });
};

/**
 * Tests the standard changes web-socket behavior
 */
exports.testStandardRouteSocket = (app, path, fixture, serialize = toObject) => {
  describe('web-socket connection', () => {
    let doc1;
    let doc2;
    let client;

    const wait = timeout => new Promise(resolve => setTimeout(resolve, timeout));
    const listenFor = event => new Promise((resolve, reject) => {
      client.on(event, data => resolve(data));
      client.on('error', error => reject(error));
    });

    before(function *() {
      yield fixture.Model.delete().execute();
      [doc1, doc2] = yield [fixture.record(), fixture.record()];
      yield wait(50); // waiting for all events to propagate
    });

    beforeEach(() => {
      client = io(app.urlFor(path), { forceNew: true });
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
      sorted(records).must.eql(sorted([doc1, doc2]).map(serialize));
    });

    it('sends records through when they are created', function *() {
      const feed = listenFor('created'); yield wait(50);
      const newRecord = yield fixture.record();
      const feedRecord = yield feed;

      feedRecord.must.eql(serialize(newRecord));
    });

    it('sends notifications about changed objects', function *() {
      const feed = listenFor('updated'); yield wait(50);
      const newData = fixture.data({id: undefined, rev: doc1.rev});
      const updatedRecord = yield doc1.merge(newData).save();
      const feedRecord = yield feed;

      feedRecord.must.eql(serialize(updatedRecord));
    });

    it('sends notifications through when records are deleted', function *() {
      const feed = listenFor('deleted');
      yield wait(50);
      yield doc1.delete();
      const feedRecord = yield feed;

      feedRecord.must.eql(serialize(doc1));
    });
  });
};
