const generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  writing: function() {
    this.fs.copy(
      this.templatePath('**/*'),
      this.destinationPath('')
    );
  },

  install: function() {
    this.npmInstall(['express-jwt', 'simple-password'], { save: true });
  }
});
