const generators = require('yeoman-generator');
const { snakeCase, camelCase } = require('lodash');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);

    this.argument('name', { type: String, required: true });
  },

  writing: function() {
    const params = {
      snakeCase: snakeCase(this.name),
      camelCase: camelCase(this.name),
      timestamp: new Date().toISOString().split('T')[0].replace(/[^\d+]/g, '')
    };

    params.migrationName = `${params.timestamp}_${params.snakeCase}`;

    const mapping = {
      'migrations/migration.js': `migrations/${params.migrationName}.js`,
      'test/migrations/migration_test.js': `test/migrations/${params.migrationName}_test.js`
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
