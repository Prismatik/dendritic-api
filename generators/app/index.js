const generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  initializing: function() {
    this.composeWith('redbeard:api', this, this.options);
  }
});
