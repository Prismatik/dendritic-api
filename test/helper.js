require('must');
const mocha = require('mocha');
const coMocha = require('co-mocha');

coMocha(mocha);

const timekeeper = require('timekeeper');

process.nextTick(() => {
  before(() => timekeeper.freeze(new Date()));
  after(() => timekeeper.reset());
});

const models = require('./app/models');

process.nextTick(() => {
  before(function *() {
    this.timeout(30000);

    // waiting on all tables to pop up
    yield Object.keys(models).map(
      name => models[name].ready()
    );
  });
});
