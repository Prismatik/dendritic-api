const generators = require('yeoman-generator');
const { snakeCase, camelCase, startCase, kebabCase } = require('lodash');
const pluralize = require('pluralize');

const pascalCase = str => startCase(str).replace(/\s+/g, '');

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
      pascalCase: pascalCase(this.singularName),
      pascalCasePlural: pascalCase(this.pluralName),
      kebabCase: kebabCase(this.singularName),
      kebabCasePlural: kebabCase(this.pluralName),
      singularRelationships: false,
      multiRelationships: false
    };

    const mapping = {
      'config/schemas/schema.json': `config/schemas/${this.singularName}.json`,
      'src/controllers/controller.js': `src/controllers/${this.pluralName}.js`,
      'src/routes/route.js': `src/routes/${this.pluralName}.js`,
      'src/models/model.js': `src/models/${this.singularName}.js`
    };

    for (const templateName in mapping) {
      this.fs.copyTpl(
        this.templatePath(templateName),
        this.destinationPath(mapping[templateName]),
        params
      );
    }

    this.fs.copy(
      this.templatePath('src/utils'),
      this.destinationPath('src/utils')
    );
  }
});
