const generators = require('yeoman-generator');
const { kebabCase } = require('lodash');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);

    this.argument('appname', { type: String, required: true });
    this.appname = kebabCase(this.appname);
    this.destinationRoot(`${process.cwd()}/${this.appname}`);
  },

  writing: function() {
    ['**/*', '.*'].forEach(name => {
      this.fs.copyTpl(
        this.templatePath(name),
        this.destinationPath(''),
        {
          appName: this.appname
        }
      );
    });
  },

  install: function() {
    this.npmInstall();
  }
});
