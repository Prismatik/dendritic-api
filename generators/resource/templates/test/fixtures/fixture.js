const generate = require('json-schema-faker');
const { schema } = require('../../config');
const { <%= pascalCase %> } = require('../../src/models');

const modelSchema = schema.<%= camelCase %>;

exports.Model = <%= pascalCase %>;

exports.data = exports.valid = (params={}) => {
  const data = generate(modelSchema);

  for (let key in params) {
    if (params[key] === undefined) {
      delete data[key];
    } else {
      data[key] = params[key];
    }
  }

  return data;
}

exports.record = (params) => {
  return new <%= pascalCase %>(exports.data(params)).save();
};
