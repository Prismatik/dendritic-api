/**
 * This module has the standard CRUD controller functionality tests
 *
 * USEAGE:
 * describe("my awesome controller", () => {
 *   testStandardController(controller, fixture);
 * });
 */
const { thinky: { Errors: { DocumentNotFound, ValidationError } } } = require('../../config');
const { run, sorted, toObject, UUID_RE } = require('./commons');

const sameThing = record => record; // so one could override it in custom cases

/**
 * an all in one test fro the entire RESTful API
 *
 * @param {Object} controller
 * @param {Object} fixture
 * @param {Function} filter optional filter to transform data before comparisons
 * @param {Object} options
 * @return void
 */
exports.testStandardController = (...args) => {
  run(args, {
    list: exports.testStandardControllerList,
    find: exports.testStandardControllerFind,
    create: exports.testStandardControllerCreate,
    update: exports.testStandardControllerUpdate,
    replace: exports.testStandardControllerReplace,
    delete: exports.testStandardControllerDelete
  });
};

/**
 * Tests the standard `controller#all(query)` functionality
 */
exports.testStandardControllerList = (controller, fixture) => {
  describe('.all(query)', () => {
    let doc1;
    let doc2;
    let doc3;

    before(function *() {
      yield fixture.Model.delete().execute();

      [doc1, doc2, doc3] = yield [
        fixture.record(),
        fixture.record(),
        fixture.record()
      ];
    });

    it('returns all the records by default', function *() {
      const result = yield controller.all();
      result.must.be.an(Array);
      sorted(result).must.eql(sorted([
        doc1, doc2, doc3
      ]));
    });

    it('allows to filter the list by a specific field', function *() {
      const filter = { id: doc1.id };
      const result = yield controller.all(filter);
      sorted(result).must.eql(sorted([doc1]));
    });

    it('ignores totally unsupported params', function *() {
      const filter = { totalMonkey: 123 };
      const result = yield controller.all(filter);
      sorted(result).must.eql(sorted([
        doc1, doc2, doc3
      ]));
    });

    it('allows to order things by a specific field', function *() {
      const params = { orderBy: 'rev' };
      const result = yield controller.all(params);
      result.map(toObject).must.eql(sorted([doc1, doc2, doc3], 'rev'));
    });

    it('allows to skip records', function *() {
      const params = { orderBy: 'rev', skip: 1 };
      const result = yield controller.all(params);
      result.map(toObject).must.eql(sorted([doc1, doc2, doc3], 'rev').slice(1));
    });

    it('allows to limit records', function *() {
      const params = { orderBy: 'rev', limit: 2 };
      const result = yield controller.all(params);
      result.map(toObject).must.eql(sorted([doc1, doc2, doc3], 'rev').slice(0, 2));
    });
  });
};

/**
 * Tests the individual `controller#find(id)` method
 */
exports.testStandardControllerFind = (controller, fixture) => {
  describe('.find(id)', () => {
    let record;

    before(function *() {
      record = yield fixture.record();
    });

    it('returns the record when it exists', function *() {
      const result = yield controller.find(record.id);
      toObject(result).must.eql(toObject(record));
    });

    it('throws DocumentNotFound if the record does not exist', function *() {
      try {
        yield controller.find('hack!');
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        error.must.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * The standard `controller.create(params)` method tests
 */
exports.testStandardControllerCreate = (controller, fixture, filter = sameThing) => {
  describe('.create(data)', () => {
    let validData;
    beforeEach(() => {
      validData = fixture.data({ id: undefined, rev: undefined, createdAt: undefined });
    });

    it('saves valid data and returns a model instance', function *() {
      const record = yield controller.create(validData);

      record.constructor.must.equal(fixture.Model);
      record.id.must.match(UUID_RE);

      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date(), updatedAt: new Date()
      } : {};

      toObject(filter(record)).must.eql(toObject(
        filter(validData), Object.assign(timestamps, { id: record.id, rev: record.rev })
      ));
    });

    it('automatically adds a `rev` property onto new records', function *() {
      delete validData.rev;
      const record = yield controller.create(validData);
      if (record.rev) record.rev.must.match(UUID_RE);
    });

    it('throws validation errors when data is missing', function *() {
      try {
        yield controller.create({});
        throw new Error('expected throw a ValidationError');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });
  });
};

/**
 * Tests the standard `controller.update(id, params)` method
 */
exports.testStandardControllerUpdate = (controller, fixture, filter = sameThing) => {
  describe('.update(id, params)', () => {
    let record;
    let validData;

    before(function *() {
      record = yield fixture.record({ createdAt: undefined });
      validData = fixture.data({ id: undefined, rev: record.rev, createdAt: undefined });
    });

    it('updates params when things are good', function *() {
      const result = yield controller.update(record.id, validData);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date(), updatedAt: new Date()
      } : {};

      // must return an updated record
      result.constructor.must.equal(fixture.Model);
      toObject(filter(result), { rev: null }).must.eql(
        filter(Object.assign({}, record, validData, { rev: null }, timestamps))
      );

      // must update the `rev` with a new stamp
      result.rev.must.not.eql(record.rev);
      result.rev.must.match(UUID_RE);
    });

    it('throws validation errors when data is missing', function *() {
      try {
        yield controller.replace(record.id, {});
        throw new Error('expected throw a ValidationError');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });

    it('explodes when data is wrong', function *() {
      try {
        yield controller.update(record.id, { rev: 'hack!' });
        throw new Error('expected to throw a ValidationError');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield controller.update('hack!', validData);
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        error.must.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * Tests the standard `controller.replace(id, data)` functionality
 */
exports.testStandardControllerReplace = (controller, fixture, filter = sameThing) => {
  describe('.replace(id, params)', () => {
    let record;
    let validData;

    before(function *() {
      record = yield fixture.record({ createdAt: undefined });
      validData = fixture.data({ id: undefined, rev: record.rev, createdAt: undefined });
    });

    it('updates params when things are good', function *() {
      const result = yield controller.replace(record.id, validData);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: record.createdAt, updatedAt: new Date()
      } : {};

      // must return an updated record
      result.constructor.must.equal(fixture.Model);
      toObject(filter(result), { rev: null }).must.eql(
        filter(Object.assign({}, record, validData, { rev: null }, timestamps))
      );

      // must update the `rev` with a new stamp
      result.rev.must.not.eql(record.rev);
      result.rev.must.match(UUID_RE);
    });

    it('explodes when data is wrong', function *() {
      const data = Object.assign({}, validData, { rev: 'hack!' });

      try {
        yield controller.replace(record.id, data);
        throw new Error('expected to throw a ValidationError');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield controller.replace('hack!', validData);
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        error.must.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * Tests the standard `controller#delete(id)` functionality
 */
exports.testStandardControllerDelete = (controller, fixture, filter = sameThing) => {
  describe('.delete(id)', () => {
    let record;

    before(function *() {
      record = yield fixture.record();
    });

    it('deletes a document for sure when it exists', function *() {
      const result = yield controller.delete(record.id);
      toObject(filter(result)).must.eql(toObject(filter(record)));

      const records = yield record.getModel().filter({ id: record.id }).run();
      records.must.have.length(0);
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield controller.delete('hack!');
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        error.must.be.instanceOf(DocumentNotFound);
      }
    });
  });
};
