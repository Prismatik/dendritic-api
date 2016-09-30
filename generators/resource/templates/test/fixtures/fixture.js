const generate = require('json-schema-faker');
const { schema } = require('../../config');
const { <%= pascalCase %> } = require('../../src/models');
const { cleanUpAndMerge } = require('../support/commons');

exports.Model = <%= pascalCase %>;
exports.schema = schema.<%= camelCase %>;

exports.data = exports.valid = (params = {}) =>
  cleanUpAndMerge(generate(exports.schema), params);

exports.record = params =>
  new <%= pascalCase %>(exports.data(params)).save();
