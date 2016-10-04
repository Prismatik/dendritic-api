const generate = require('json-schema-faker');
const { schema } = require('../../config');
const { CoolBanana } = require('../../src/models');
const { cleanUpAndMerge } = require('../support/commons');

exports.Model = CoolBanana;
exports.schema = schema.coolBanana;

exports.data = exports.valid = (params = {}) =>
  cleanUpAndMerge(generate(exports.schema), params);

exports.record = params =>
  new CoolBanana(exports.data(params)).save();
