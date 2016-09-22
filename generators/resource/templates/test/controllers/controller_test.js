const <%= pascalCase %> = require('../../src/models/<%= snakeCase %>');
const <%= camelCasePlural %> = require('../../src/controllers/<%= snakeCasePlural %>');
const { thinky: { Errors: { DocumentNotFound, ValidationError } } } = require('../../config');
const <%= camelCase %>Fixture = require('../fixtures/<%= snakeCase %>');

const UUID_RE = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

describe('<%= camelCasePlural %> controller', () => {
  let validData;
  let <%= camelCase %>;

  beforeEach(function *() {
    validData = <%= camelCase %>Fixture.valid();
    <%= camelCase %> = yield <%= camelCasePlural %>.create(validData);
  });

  const pureData = data => Object.assign({}, data, { id: null, rev: null });

  describe('.all(query)', () => {
    let <%= camelCase %>1;
    let <%= camelCase %>2;
    let <%= camelCase %>3;

    const sorted = (records, param = 'id') => records
      .sort((a, b) => (a[param] > b[param] ? 1 : -1))
      .map(i => Object.assign({}, i));

    beforeEach(function *() {
      yield <%= pascalCase %>.delete().execute();

      [<%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3] = yield [
        <%= camelCasePlural %>.create(<%= camelCase %>Fixture.valid()),
        <%= camelCasePlural %>.create(<%= camelCase %>Fixture.valid()),
        <%= camelCasePlural %>.create(<%= camelCase %>Fixture.valid())
      ];
    });

    it('returns all the records by default', function *() {
      const result = yield <%= camelCasePlural %>.all();
      result.must.be.an(Array);
      sorted(result).must.eql(sorted([
        <%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3
      ]));
    });

    it('allows to filter the list by a specific field', function *() {
      const filter = { id: <%= camelCase %>1.id };
      const result = yield <%= camelCasePlural %>.all(filter);
      sorted(result).must.eql(sorted([<%= camelCase %>1]));
    });

    it('ignores totally unsupported params', function *() {
      const filter = { totalMonkey: 123 };
      const result = yield <%= camelCasePlural %>.all(filter);
      sorted(result).must.eql(sorted([
        <%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3
      ]));
    });

    it('allows to order things by a specific field', function *() {
      const params = { orderBy: 'rev' };
      const result = yield <%= camelCasePlural %>.all(params);
      result.map(i => Object.assign({}, i)).must.eql(
        sorted([<%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3], 'rev')
      );
    });

    it('allows to skip records', function *() {
      const params = { orderBy: 'rev', skip: 1 };
      const result = yield <%= camelCasePlural %>.all(params);
      result.map(i => Object.assign({}, i)).must.eql(
        sorted([<%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3], 'rev').slice(1)
      );
    });

    it('allows to limit records', function *() {
      const params = { orderBy: 'rev', limit: 2 };
      const result = yield <%= camelCasePlural %>.all(params);
      result.map(i => Object.assign({}, i)).must.eql(sorted([
        <%= camelCase %>1, <%= camelCase %>2, <%= camelCase %>3
      ], 'rev').slice(0, 2));
    });
  });

  describe('.find(id)', () => {
    it('returns the <%= camelCase %> when it exists', function *() {
      const result = yield <%= camelCasePlural %>.find(<%= camelCase %>.id);

      Object.assign({}, result).must.eql(Object.assign({}, <%= camelCase %>));
    });

    it('throws DocumentNotFound if the <%= camelCase %> does not exist', function *() {
      try {
        yield <%= camelCasePlural %>.find('hack!');
        throw new Error('must fail here!');
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });

  describe('.create(data)', () => {
    beforeEach(() => {
      // refreshing the validData to avoid conflicts
      validData = <%= camelCase %>Fixture.valid();
    });

    it('saves valid data and returns a model instance', function *() {
      const <%= camelCase %> = yield <%= camelCasePlural %>.create(validData);
      <%= camelCase %>.constructor.must.equal(<%= pascalCase %>);

      <%= camelCase %>.id.must.match(UUID_RE);

      pureData(<%= camelCase %>).must.eql(pureData(validData));
    });

    it('automatically adds a `rev` property onto new records', function *() {
      delete validData.rev;
      const <%= camelCase %> = yield <%= camelCasePlural %>.create(validData);
      <%= camelCase %>.rev.must.match(UUID_RE);
    });

    it('throws validation errors when data is missing', function *() {
      try {
        yield <%= camelCasePlural %>.create({});
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });
  });

  describe('.update(params)', () => {
    it('updates params when things are good', function *() {
      const oldId = <%= camelCase %>.id;
      const validData = <%= camelCase %>Fixture.valid(); delete validData.id;
      validData.rev = <%= camelCase %>.rev;
      const result = yield <%= camelCasePlural %>.update(<%= camelCase %>.id, validData);
      result.constructor.must.equal(<%= pascalCase %>);
      result.id.must.eql(oldId);

      pureData(result).must.eql(pureData(Object.assign({}, <%= camelCase %>, validData)));
    });

    it('explodes when data is wrong', function *() {
      try {
        yield <%= camelCasePlural %>.update(<%= camelCase %>.id, { rev: 'hack!' });
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield <%= camelCasePlural %>.update('hack!', validData);
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });

  describe('.replace(id, params)', () => {
    it('replaces the entire document with the new data', function *() {
      const oldId = <%= camelCase %>.id;
      const validData = <%= camelCase %>Fixture.valid(); delete validData.id;
      validData.rev = <%= camelCase %>.rev;
      const result = yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, validData);
      result.constructor.must.equal(<%= pascalCase %>);
      result.id.must.eql(oldId);

      pureData(result).must.eql(pureData(validData));
    });

    it('explodes when data is missing', function *() {
      try {
        yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, {});
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('is required');
      }
    });

    it('explodes when data is wrong', function *() {
      const data = Object.assign({}, validData, { rev: 'hack!' });

      try {
        yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, data);
        throw new Error('should fail');
      } catch (e) {
        e.must.be.instanceOf(ValidationError);
        e.message.must.contain('`rev` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield <%= camelCasePlural %>.replace('hack!', validData);
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });

  describe('.delete(id)', () => {
    it('deletes a <%= camelCase %> for sure when it exists', function *() {
      const record = yield <%= camelCasePlural %>.delete(<%= camelCase %>.id);
      Object.assign({}, record).must.eql(Object.assign({}, <%= camelCase %>));

      const result = yield <%= pascalCase %>.getAll(<%= camelCase %>.id);
      result.must.eql([]);
    });

    it('throws DocumentNotFound when the document does not exist', function *() {
      try {
        yield <%= camelCasePlural %>.delete('hack!');
        throw new Error('must fail here');
      } catch (e) {
        e.must.be.instanceOf(DocumentNotFound);
      }
    });
  });
});
