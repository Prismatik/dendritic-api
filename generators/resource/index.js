const generators = require('yeoman-generator');
const { snakeCase, camelCase, startCase, kebabCase } = require('lodash');
const pluralize = require('pluralize');

const pascalCase = str => startCase(str).replace(/\s+/g, '');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);

    this.argument('modelname', { type: String, required: true, desc: 'resource name' });
    this.option('timestamps', { type: Boolean, defaults: true, desc: "automatically add createdAt/updatedAt properties" });

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
      multiRelationships: false,
      addTimestamps: this.options.timestamps
    };

    const mapping = {
      'config/schemas/schema.json': `config/schemas/${this.singularName}.json`,
      'src/controllers/controller.js': `src/controllers/${this.pluralName}.js`,
      'src/routes/route.js': `src/routes/${this.pluralName}.js`,
      'src/models/model.js': `src/models/${this.singularName}.js`,

      'test/fixtures/fixture.js': `test/fixtures/${this.singularName}.js`,
      'test/controllers/controller_test.js': `test/controllers/${this.pluralName}_test.js`,
      'test/routes/route_test.js': `test/routes/${this.pluralName}_test.js`
    };

    for (const templateName in mapping) {
      this.fs.copyTpl(
        this.templatePath(templateName),
        this.destinationPath(mapping[templateName]),
        params
      );
    }

    ['src/utils', 'test/utils', 'test/support'].forEach(name => {
      this.fs.copy(
        this.templatePath(name),
        this.destinationPath(name)
      );
    });
  }
});
