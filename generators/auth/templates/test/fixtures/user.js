const generate = require('json-schema-faker');
const { schema } = require('../../config');
const { User } = require('../../src/models');
const { cleanUpAndMerge } = require('../support/commons');

exports.Model = User;

exports.data = exports.valid = (params = {}) =>
  cleanUpAndMerge(generate(schema.user), params);

exports.record = params =>
  new User(exports.data(params)).save();
