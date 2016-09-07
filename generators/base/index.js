const generators = require('yeoman-generator');
const { snakeCase } = require('lodash');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);

    this.argument('appname', { type: String, required: true });
    this.appname = snakeCase(this.appname);
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

    this.fs.copy(
      this.templatePath('.env.example'),
      this.destinationPath('.env')
    );
  },

  install: function() {
    this.npmInstall();
  }
});
