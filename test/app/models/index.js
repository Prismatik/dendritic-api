const { slurp } = require('../../../src');

const models = slurp('test/app/models');

// making all the models to be exported pacal cased
Object.keys(models).forEach(key => {
  const pascalCasedName = key[0].toUpperCase() + key.substr(1);

  module.exports[pascalCasedName] = models[key];
});
