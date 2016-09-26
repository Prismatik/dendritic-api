const <%= camelCasePlural %> = require('../../src/controllers/<%= snakeCasePlural %>');
const <%= camelCase %>Fixture = require('../fixtures/<%= snakeCase %>');
const { testStandardController } = require('../support/controllers');

describe.only('<%= camelCasePlural %> controller', () => {
  testStandardController(<%= camelCasePlural %>, <%= camelCase %>Fixture);

  //
  // describe('.replace(id, params)', () => {
  //   it('replaces the entire document with the new data', function *() {
  //     const oldId = <%= camelCase %>.id;
  //     const validData = <%= camelCase %>Fixture.valid(); delete validData.id;
  //     validData.rev = <%= camelCase %>.rev;
  //     const result = yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, validData);
  //     result.constructor.must.equal(<%= pascalCase %>);
  //     result.id.must.eql(oldId);
  //
  //     pureData(result).must.eql(pureData(validData));
  //   });
  //
  //   it('explodes when data is missing', function *() {
  //     try {
  //       yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, {});
  //       throw new Error('should fail');
  //     } catch (e) {
  //       e.must.be.instanceOf(ValidationError);
  //       e.message.must.contain('is required');
  //     }
  //   });
  //
  //   it('explodes when data is wrong', function *() {
  //     const data = Object.assign({}, validData, { rev: 'hack!' });
  //
  //     try {
  //       yield <%= camelCasePlural %>.replace(<%= camelCase %>.id, data);
  //       throw new Error('should fail');
  //     } catch (e) {
  //       e.must.be.instanceOf(ValidationError);
  //       e.message.must.contain('`rev` must match pattern');
  //     }
  //   });
  //
  //   it('throws DocumentNotFound when the document does not exist', function *() {
  //     try {
  //       yield <%= camelCasePlural %>.replace('hack!', validData);
  //     } catch (e) {
  //       e.must.be.instanceOf(DocumentNotFound);
  //     }
  //   });
  // });
  //
});
