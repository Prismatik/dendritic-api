const generate = require('json-schema-faker');
const { schema } = require('../../config');

const modelSchema = schema.<%= camelCase %>;

module.exports = {
  valid() {
    return generate(modelSchema);
  }
};
