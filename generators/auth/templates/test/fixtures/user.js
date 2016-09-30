const generate = require('json-schema-faker');
const { schema } = require('../../config');
const { User } = require('../../src/models');
const { cleanUpAndMerge } = require('../support/commons');

exports.Model = User;
exports.schema = schema.user;

exports.data = exports.valid = (params = {}) =>
  cleanUpAndMerge(generate(exports.schema), params);

exports.record = params =>
  new User(exports.data(params)).save();
