require('must');
const mocha = require('mocha');
const coMocha = require('co-mocha');

coMocha(mocha);

const timekeeper = require('timekeeper');

process.nextTick(() => {
  before(() => timekeeper.freeze(new Date()));
  after(() => timekeeper.reset());
});
