const generators = require('yeoman-generator');
const { snakeCase, camelCase } = require('lodash');
const pluralize = require('pluralize');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);

    this.argument('modelname', { type: String, required: true });
    this.singularName = pluralize(snakeCase(this.modelname), 1);
    this.pluralName = pluralize(this.singularName);
  },

  writing: function() {
    const params = {
      snakeCase: this.singularName,
      snakeCasePlural: this.pluralName,
      camelCase: camelCase(this.singularName),
      camelCasePlural: camelCase(this.pluralName),
      singularRelationships: false,
      multiRelationships: false
    };

    const mapping = {
      'config/schemas/schema.json': `config/schemas/${this.singularName}.json`
    };

    for (const templateName in mapping) {
      this.fs.copyTpl(
        this.templatePath(templateName),
        this.destinationPath(mapping[templateName]),
        params
      );
    }
  }
});
