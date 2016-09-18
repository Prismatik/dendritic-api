const generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  initializing: function() {
    this.composeWith('dendritic:base', this, this.options);
  }
});
