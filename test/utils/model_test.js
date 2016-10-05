const uuid = require('uuid');
const timekeeper = require('timekeeper');
const { Model: model } = require('../../src');
const { thinky, schema } = require('../../config');

describe('utils/model', function () {
  this.timeout(5000);

  describe('.create(modelName)', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'thing',
      pluralName: 'things',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        email: {
          type: 'string',
          format: 'email'
        },
        password: {
          type: 'string'
        }
      },
      required: [
        'email',
        'password'
      ]
    };
    let Model;

    before(() => {
      schema.thing = TEST_JSON_SCHEMA;
      Model = model.create('thing');
    });

    it('should build a thinky class', () => {
      Model.must.equal(thinky.models.things);
    });

    it('should pick up validations correctly', () => (
      new Model({}).save().must.reject.with.error(
        thinky.Errors.ValidationError,
        '`email` is required, `password` is required'
      )
    ));

    it('should handle malformed data as well', () => {
      const params = { email: 'blah!', password: 'blah!' };
      return new Model(params).save().must.reject.with.error(
        thinky.Errors.ValidationError,
        '`email` must match format "email"'
      );
    });
  });

  describe('.create(modelName, {audit: true})', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'auditableThing',
      pluralName: 'auditableThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        email: {
          type: 'string',
          format: 'email'
        },
        password: {
          type: 'string'
        }
      },
      required: [
        'email',
        'password'
      ]
    };
    let Model;
    const params = { email: 'blah@example.com', password: 'blah!' };

    before(() => {
      schema.auditableThing = TEST_JSON_SCHEMA;
      Model = model.create('auditableThing', { audit: true });
    });

    it('should populate the audit log', function *() {
      const record = yield new Model(params).save();

      const audit = yield Model.AuditModel.filter({ doc: { id: record.id } }).run();

      audit[0].createdAt.must.be.a(Date);
      audit[0].doc.must.eql(Object.assign({}, record));
    });
  });

  describe('update/replace data', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'updThing',
      pluralName: 'updThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        }
      },
      required: [
        'firstName'
      ]
    };

    let Model;
    let record;
    let hookCalls = [];

    before(() => {
      schema.updThing = TEST_JSON_SCHEMA;
      Model = model.create('updThing');

      Model.pre('save', next => {
        hookCalls.push('pre save 1');
        next();
      });

      Model.post('save', next => {
        hookCalls.push('post save 1');
        next();
      });

      Model.pre('validate', next => {
        hookCalls.push('pre validate 1');
        next();
      });
    });

    beforeEach(function *() {
      record = yield new Model({ id: uuid.v4(), firstName: 'nikolay', lastName: 'theosom' }).save();
      hookCalls = [];
    });

    it('partially updates data with #udpate', function *() {
      yield record.update({ lastName: 'new name' });

      record.firstName.must.eql('nikolay');
      record.lastName.must.eql('new name');

      const dbRecord = yield Model.get(record.id).run();
      dbRecord.lastName.must.eql(record.lastName);
    });

    it('fully updates data with #replace', function *() {
      yield record.replace({ firstName: 'new name' });

      record.firstName.must.eql('new name');
      record.must.not.have.property('lastName');

      const dbRecord = yield Model.get(record.id).run();
      dbRecord.firstName.must.eql(record.firstName);
      dbRecord.must.not.have.property('lastName');
    });

    it('explodes when validation fails', function *() {
      try {
        yield record.update({ firstName: null });
        throw new Error('validation must fail');
      } catch (error) {
        error.message.must.eql('`firstName` must be string');
      }
    });

    it('runs the pre/post hooks as expected', function *() {
      yield record.update({ lastName: 'new name' });
      hookCalls.must.eql(['pre validate 1', 'pre save 1', 'post save 1']);
    });
  });

  describe('model with a `rev`', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'revThing',
      pluralName: 'revThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        rev: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        name: {
          type: 'string'
        }
      },
      required: [
        'rev',
        'name'
      ]
    };
    let Model;
    const params = { name: 'something' };
    const REV_RE = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

    before(() => {
      schema.revThing = TEST_JSON_SCHEMA;
      Model = model.create('revThing');
    });

    it('sets a new `rev` automatically for new records', function *() {
      const thing = yield new Model(Object.assign({ id: uuid.v4() }, params)).save();
      thing.rev.must.match(REV_RE);
    });

    it('replaces the `rev` automatically every time the data is saved', function *() {
      const thing = yield new Model(Object.assign({ id: uuid.v4() }, params)).save();
      const oldRev = thing.rev;

      yield thing.update({ name: 'new name' });

      thing.rev.must.match(REV_RE);
      thing.rev.must.not.eql(oldRev);
    });

    it('works fine if the provided `rev` is the same', function *() {
      const thing = yield new Model(Object.assign({ id: uuid.v4() }, params)).save();
      const oldRev = thing.rev;

      yield thing.update({ name: 'new name', rev: oldRev });

      thing.name.must.eql('new name');
    });

    it('explodes if the `rev` was changed to something else', function *() {
      const thing = yield new Model(Object.assign({ id: uuid.v4() }, params)).save();

      try {
        yield thing.update({ name: 'new name', rev: uuid.v4() });
        throw new Error('must fail the `rev` check');
      } catch (error) {
        error.message.must.eql('`rev` was changed by another update');
      }
    });

    it('validates revs format before trying to save things', function *() {
      const thing = yield new Model(Object.assign({ id: uuid.v4() }, params)).save();

      try {
        yield thing.update({ name: 'new name', rev: 'hack hack hack' });
        throw new Error('must validate rev format');
      } catch (error) {
        error.message.must.contain('`rev` must match pattern');
      }
    });
  });

  describe('a model with createdAt/updatedAt properties', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'timestampsThing',
      pluralName: 'timestampsThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        name: {
          type: 'string'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time'
        }
      },
      required: [
        'name'
      ]
    };
    let Model;
    let now;
    let record;

    before(() => {
      schema.timestampsThing = TEST_JSON_SCHEMA;
      Model = model.create('timestampsThing');
      now = new Date();
    });

    beforeEach(function *() {
      record = yield new Model({ name: 'nikolay!' }).save();
    });

    afterEach(() => timekeeper.freeze(now));

    it('automatically populates the created at and updated at timestamps', () => {
      record.createdAt.must.eql(new Date());
      record.updatedAt.must.eql(new Date());
    });

    it('updates the updatedAt and keeps createdAt on existing records', function *() {
      const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);

      timekeeper.freeze(tomorrow);
      yield record.merge({ name: 'antikolay' }).save();

      record.createdAt.must.eql(now);
      record.updatedAt.must.eql(tomorrow);
    });

    it('updates the updatedAt with custom #update/#replace methods as well', function *() {
      const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);

      timekeeper.freeze(tomorrow);
      yield record.update({ name: 'antikolay' });

      record.createdAt.must.eql(now);
      record.updatedAt.must.eql(tomorrow);
    });
  });
});
