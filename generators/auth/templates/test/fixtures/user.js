const generate = require('json-schema-faker');
const { schema } = require('../../config');

const modelSchema = schema.user;

module.exports = {
  valid() {
    return generate(modelSchema);
  }
};
